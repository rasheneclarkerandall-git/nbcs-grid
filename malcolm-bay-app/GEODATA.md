# Geospatial data status — path to a georeferenced live twin

The current Master Plan Explorer renders **schematic** zone shapes: rectangles sized
proportionally by acreage, not true site geometry. This document records why, and
exactly what is needed to replace them with real parcel boundaries on a basemap.

## The KML we have

Source: `ACADMalcolm Bay Subdivision & Road Profiles Location Map2 Jan 14 2025.kml`
(~25 MB, 40,235 placemarks), produced by converting the AutoCAD subdivision drawing
in ArcGIS Pro.

**This file cannot currently be placed on a basemap.** The coordinate conversion
failed, in two separate ways:

1. **Latitude was never converted.** The Y values sit in the range `652,336 –
   656,742`. Valid latitudes run −90 to +90. These are still projected northings in
   metres, straight out of the CAD file — the drawing's coordinate system was never
   defined before export, so ArcGIS Pro passed the raw grid values through as if
   they were degrees.

2. **Longitude was wrapped.** The X values span exactly `−180.0 – +180.0`, which is
   the signature of eastings being wrapped modulo 360 into the legal longitude range.
   The damage is visible in the geometry: the site `BOUNDARY` polyline jumps from
   `x = −104.9` to `x = +84.3` and back to `x = −152.9` between consecutive vertices
   of what should be a continuous site edge. Points that are metres apart on the
   ground are now scattered across half the planet.

The wrapping is lossy in the sense that the original easting cannot be recovered from
the file alone — but it is fully recoverable *from the source CAD file*, which is
undamaged. The fix belongs upstream, not in this repo.

### What it would take to fix

1. Get the **coordinate reference system** of the original `.dwg` from the surveyor.
   For Jamaica this is almost certainly one of:
   - `EPSG:3448` — JAD2001 / Jamaica Metric Grid (modern, most likely)
   - `EPSG:24200` — JAD69 / Jamaica National Grid (older drawings)
2. Get **at least two known control points** (a surveyed monument or corner with both
   its CAD grid coordinate and its real-world lat/lon) so the assumed CRS can be
   verified rather than trusted.
3. Re-export: in ArcGIS Pro, run **Define Projection** on the CAD layer with the
   correct CRS *before* converting — then Project to `EPSG:4326`. Defining the
   projection is the step that was skipped; without it the reprojection is a no-op and
   the values pass through raw.
4. Export **GeoJSON**, not KML — smaller, no styling cruft, and directly consumable by
   MapLibre/Leaflet.

Worth telling the surveyor explicitly: the deliverable needed is *georeferenced parcel
polygons with their parcel IDs as an attribute*, not a drawing. That attribute is what
joins geometry to the cost model.

### Also note: most of this file is not site plan

Roughly 34,000 of the 40,235 placemarks are on `C-ROAD-PROF-*` layers — these are the
road **elevation profile sheets** from the CAD drawing (grid lines, tick marks, title
blocks, annotation), i.e. draughting artifacts that live off to the side of the
drawing space. They are not site features and should be filtered out on re-export.

The layers that actually matter:

| Layer | Placemarks | What it is |
|---|---|---|
| `C-ROAD-STAN`, `C-ROAD-STAN-MAJR/MINR` | ~4,600 | Road stationing / alignment |
| `C-ROAD-CNTR-N` | 103 | Road centrelines |
| `…$0$C-PROP-IDEN` | 130 | **Parcel ID labels** — see below |
| `…$0$G-ANNO-TEXT` | 23 | Site annotations |
| `BOUNDARY` | 2 | Site boundary |

## What we *did* salvage: the parcel ID vocabulary

Attribute data in the KML is intact even though geometry is not. The 130 parcel labels
on the `C-PROP-IDEN` layer are extracted to `data/cad-parcel-vocabulary.json`. This is
the real naming scheme used on the ground:

| Prefix | Count | Meaning | Cross-check vs. cost model |
|---|---|---|---|
| `C.*` | 62 | Commercial units | Cost model: 68 commercial units |
| `R.01–R.26` | 26 | Luxury villa lots | Annotation says "27 LOTS / 17 ACRES"; handoff says 27 villas on 17 ac |
| `PRC.1–PRC.11` | 11 | Public recreation & commerce | Cost model PRC zone: 17 units |
| `H.01–H.06` (+ `H.05a/b`) | 8 | Large resort hotels | Handoff: 7 large resort hotels |
| `BH.01–BH.07` | 7 | Boutique hotels | Handoff: 7 boutique hotels ✓ exact match |
| `CIV.*` | 4 | Civic |  |
| `SERVICE.*`, `SEWAGE`, `PARKING` | 7 | Infrastructure |  |
| `PB.01`, `PB.02` | 2 | Public beach |  |
| `LUX. B.01`, `MARINA BEACH CLUB` | 2 | Named features |  |

**This is a schema mismatch worth resolving with the client.** The CAD drawing names
parcels `H.01`, `BH.03`, `C.14`; the cost model organises the same site into
`DEV-01…DEV-09`, `Hotels`, `Commercial Units`, `PRC`, `Marina Homes`. Neither is wrong,
but nothing currently maps one to the other, and that mapping is a prerequisite for
clicking a real parcel polygon and getting its economics. Ask the client (or the
surveyor) for a parcel-ID ↔ zone crosswalk.

Site context annotations also recovered: `CARIBBEAN SEA`, `PROPOSED HIGHWAY LOCATION`
(the South Coast Highway tailwind referenced in the deck), `PUBLIC BEACH`,
`SANDY GROUND`, `LOOKOUT POINT`, `HODGES AGGREGATE PLANT`, `EXISTING DEVELOPMENT`,
`60' MAIN ROADWAY`, and named roads (`MARINA HOMES ROAD 2/3`, `PRC ROAD 2`,
`EAST COMM ZONE ROAD 2/3`, `EXIT ROAD`).

## Why no basemap is wired up yet

Rendering the site over satellite/street basemaps is a contained piece of work — but it
needs real coordinates first. Putting the development at a guessed location over a real
basemap would show investors a specific, wrong place on the map, which is worse than
showing an obviously schematic diagram. So the schematic stays until georeferenced
geometry exists.

The code is structured so this is a swap, not a rewrite: `components/ZoneMap.js` is the
only component that knows about geometry, and it reads shapes from `ZONE_SHAPES` in
`data/dataset.js`. Replacing it with a MapLibre view over GeoJSON leaves the zone panel,
lot table, lot drawer, pricing model, and the AI agent's tools untouched — they address
parcels by ID, not by position.
