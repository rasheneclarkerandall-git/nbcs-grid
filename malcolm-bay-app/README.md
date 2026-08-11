# Malcolm Bay Resorts — Development Platform

An investor/homeowner-facing web platform for **Malcolm Bay Resorts**, a 983-acre
mixed-use coastal development in St. Elizabeth, Jamaica (Malcolm Bay Limited).

It merges two earlier standalone prototypes — the persona-driven prospect journey and
the master plan tool — into one Next.js app with a real backend, so the AI concierge
answers from the live project dataset instead of a hand-written fact sheet.

## What's here

**Prospect journey**: landing with animated count-up stats → persona picker
(Investor / Government Body / Future Homeowner) → master plan explorer → lead capture →
resources & consultation CTA. Back-navigation works at every step.

**Master plan explorer** (the development twin): clickable zone map, zone profile panel
(acreage, units, total development cost, cost basis, investment draw schedule), and a
filterable/sortable lot table with per-lot indicative pricing. Clicking a lot opens a
detail drawer with a "Register Interest" CTA that pre-fills the lead form with that lot.

**AI concierge**: a chat widget backed by Claude with **tool-calling against the real
dataset**. It can look up portfolio stats, list and compare zones, search lots by zone /
type / price / area, and fetch a specific lot. It is instructed to decline anything
outside the dataset (legal, financing, firm timelines, final pricing) and redirect to a
consultation. The API key is held server-side and never reaches the browser.

## Data

Everything comes from the client's May 2025 cost model and bill of quantities:
**14 zones**, **1,233 individual lot records**, **~$1.05B** total modeled development cost.

### About the pricing

The source data has **no per-lot sale prices** — only a total development cost per zone
plus either a flat cost-per-unit or a cost-per-sqft. A flat per-unit figure would
misprice every lot that isn't average-sized, so instead each zone's cost-per-sqft is
derived (`zone total cost ÷ total modeled lot area in that zone`) and applied to each
lot's actual area. Every lot price stays consistent with its zone total rather than
being invented.

This is an **indicative development-cost basis, not a sale price**, and is labeled as
such everywhere it appears — in the lot table, the lot drawer, and in the AI concierge's
instructions. **Swap in real list prices when the client provides them**: that means
adding a price field to the lot records and updating the derivation in
`data/dataset.js`.

### Source data caveats found while building

- **29 duplicate `(zone, lot_no)` pairs** exist in the bill of quantities. Some are
  genuinely distinct parcels sharing a number (e.g. two DEV-03 lot 578 records with
  different areas); others are placeholder rows. Lot IDs are therefore index-based so
  every record is uniquely addressable. Worth having the client de-duplicate at source.
- **27 records have zero area** (26 Open Space, 1 Commercial Unit). These are flagged
  `isSellable: false` and excluded from buyer-facing lists rather than shown as
  unpriced inventory.
- **Lot count discrepancy**: this dataset has 1,233 lots; the earlier investor deck says
  1,156. The two need reconciling — confirm with the client which is canonical.
- **Hotels zone cost is pre-development only** ($19.6M). Full hotel construction cost is
  not yet modeled, and the zone panel surfaces that note.

## Geospatial status

The zone map currently renders **schematic** shapes — rectangles sized proportionally by
acreage, not true site geometry. The supplied KML export could not be used: its
georeferencing is broken (latitude never converted from projected northings, longitude
wrapped into ±180). See **[GEODATA.md](./GEODATA.md)** for the full diagnosis, what to
request from the surveyor to fix it, and the parcel-ID vocabulary that *was* recovered
from the file.

## Running locally

```bash
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

The app runs without an API key — only the concierge chat is disabled (it returns a
clear "not configured" message rather than failing silently).

## Deploying

Built for **Vercel** (serverless), which is what makes the API-key proxy and the lead
store possible — GitHub Pages cannot host either, which is why the earlier prototype's
chat only worked inside the Claude.ai sandbox.

1. Import the repo in Vercel, set the project root to `malcolm-bay-app/`.
2. Set `ANTHROPIC_API_KEY` in Project → Settings → Environment Variables.
3. For durable lead storage, add a Redis integration from the Vercel Marketplace; it
   populates `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically.

**Without Redis configured, leads are not durably stored.** Locally they go to a JSON
file; on a serverless deployment the filesystem is read-only, so the write fails and the
lead is written to the function log instead. The form still returns success — showing a
prospect an error loses them outright, whereas a logged lead is recoverable from
`vercel logs`. The response's `stored` field reports which happened (`redis`, `file`, or
`log-only`), so a deployment that is only logging is visible rather than silently assumed
durable. Configure Redis (or a CRM) before sending real traffic.

## Still to wire up

These are deliberately left as clearly-labeled placeholders rather than fake
implementations:

- **Resource downloads** — the fact sheet / deck / site plan buttons show a placeholder
  notice; no real files yet.
- **"Schedule a Consultation"** — not connected to a real scheduler (Calendly or
  similar). The intended flow: POST the lead → get the lead ID → pass it as a hidden
  param into the scheduler URL → merge the booking back onto the same record via
  webhook.
- **Lead destination** — currently Redis or a local file. If the client has a CRM, that
  belongs behind `app/api/leads/route.js`.
- **Government persona content** is thinner than the other two; the client may have
  permitting and tax-revenue data to add.

## Layout

```
app/
  page.js                  screen orchestration (landing → explorer → form → resources)
  layout.js, globals.css   brand shell and design tokens
  api/
    chat/route.js          Claude proxy + tool-calling loop (server-side API key)
    zones/route.js         zone list + portfolio stats
    lots/route.js          lot search with filters
    leads/route.js         lead capture (Redis, local-file fallback)
components/
  Landing.js               hero, count-up stats, persona picker
  MasterPlanExplorer.js    zone map + panel + lot table composition
  ZoneMap.js               SVG zone map — the only component that knows geometry
  LotTable.js              filterable/sortable lot list
  LotDetailDrawer.js       per-lot detail + register-interest CTA
  ConciergeChat.js         AI chat widget
  LeadForm.js              lead capture form
  ResourcesScreen.js       post-submit resources + consultation CTA
data/
  dataset.js               normalization, pricing derivation, zone shapes
  zones-raw.json           14 zones from the cost model
  lots-raw.json            1,233 lot records from the bill of quantities
  cad-parcel-vocabulary.json  parcel IDs recovered from the CAD/KML export
lib/
  queries.js               data access used by both the UI and the AI tools
  ai-tools.js              tool definitions + dispatch for the concierge
```

`ZoneMap.js` is the only component tied to geometry — swapping the schematic SVG for a
MapLibre view over real GeoJSON leaves the panel, lot table, pricing, and AI tools
untouched, since they address parcels by ID rather than position.
