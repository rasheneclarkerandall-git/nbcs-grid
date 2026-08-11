import zonesRaw from "./zones-raw.json";
import lotsRaw from "./lots-raw.json";

// SVG zone shapes are schematic (non-georeferenced), sized proportionally by
// acreage, per the source master-plan tool. Real parcel boundaries will
// replace these once the CAD subdivision file is exported to GeoJSON.
export const ZONE_SHAPES = [
  { zoneId: "DEV-01", x: 60, y: 70, w: 130.1, h: 93.7, color: "#1E7A63" },
  { zoneId: "DEV-02a", x: 230, y: 70, w: 107.3, h: 77.3, color: "#1E7A63" },
  { zoneId: "DEV-02b", x: 230, y: 190, w: 107.3, h: 77.3, color: "#1E7A63" },
  { zoneId: "DEV-03", x: 380, y: 60, w: 152.6, h: 109.9, color: "#1E7A63" },
  { zoneId: "DEV-04", x: 580, y: 90, w: 103.7, h: 74.7, color: "#1E7A63" },
  { zoneId: "DEV-05", x: 740, y: 60, w: 150.8, h: 108.6, color: "#1E7A63" },
  { zoneId: "DEV-09", x: 960, y: 330, w: 98.7, h: 71.1, color: "#1E7A63" },
  { zoneId: "DEV-06", x: 1120, y: 90, w: 74.8, h: 53.9, color: "#1E7A63" },
  { zoneId: "DEV-07", x: 1220, y: 200, w: 115.9, h: 83.4, color: "#3E9B7D" },
  { zoneId: "DEV-08", x: 1120, y: 320, w: 98.5, h: 70.9, color: "#1E7A63" },
  { zoneId: "Commercial Units", x: 1360, y: 60, w: 161.2, h: 116.1, color: "#C98A2E" },
  { zoneId: "PRC", x: 1360, y: 340, w: 88.5, h: 63.7, color: "#5FAFA0" },
  { zoneId: "Marina Homes", x: 1560, y: 250, w: 96.0, h: 69.1, color: "#0A89A6" },
  { zoneId: "Hotels", x: 1560, y: 60, w: 170, h: 122.4, color: "#B5622E" },
];

export const CATEGORY_LEGEND = [
  { category: "Residential", color: "#1E7A63" },
  { category: "Mixed Use (Apartments)", color: "#3E9B7D" },
  { category: "Residential (Marina)", color: "#0A89A6" },
  { category: "Commercial", color: "#C98A2E" },
  { category: "Public Recreation & Commerce", color: "#5FAFA0" },
  { category: "Hospitality", color: "#B5622E" },
];

function shapeFor(zoneId) {
  return ZONE_SHAPES.find((s) => s.zoneId === zoneId) || null;
}

// --- Pricing model -------------------------------------------------------
// The source cost model gives a TOTAL development cost per zone, and either
// a flat cost-per-unit or a cost-per-sqft. Individual lots within a zone
// vary in area, so a flat per-unit figure understates small lots and
// overstates large ones. Instead we derive a zone-level cost-per-sqft
// (total cost / total modeled area of that zone's lots) and apply it to
// each lot's actual area. This keeps every lot price consistent with the
// zone total instead of inventing numbers.
//
// This is explicitly an INDICATIVE DEVELOPMENT COST BASIS, not a final
// sale price — surfaced as such everywhere it's displayed, per direction
// to use placeholder pricing until the client supplies real list prices.
const zoneAreaTotals = {};
for (const lot of lotsRaw) {
  zoneAreaTotals[lot.zone] = (zoneAreaTotals[lot.zone] || 0) + (lot.area_sqft || 0);
}

const zoneCostPerSqft = {};
for (const z of zonesRaw) {
  if (typeof z.cost_per_sqft_usd === "number") {
    zoneCostPerSqft[z.zone_id] = z.cost_per_sqft_usd;
  } else if (zoneAreaTotals[z.zone_id]) {
    zoneCostPerSqft[z.zone_id] = z.total_development_cost_usd / zoneAreaTotals[z.zone_id];
  }
}

export const ZONES = zonesRaw.map((z) => ({
  zoneId: z.zone_id,
  category: z.category,
  acreage: z.acreage,
  unitsOrLots: z.units_or_lots,
  totalDevelopmentCostUsd: z.total_development_cost_usd,
  costPerUnitUsd: z.cost_per_unit_usd ?? null,
  costPerSqftUsd: z.cost_per_sqft_usd ?? zoneCostPerSqft[z.zone_id] ?? null,
  drawScheduleByYear: z.draw_schedule_pct_by_year || {},
  note: z.note || null,
  shape: shapeFor(z.zone_id),
  hasLotDetail: Boolean(zoneAreaTotals[z.zone_id]),
}));

// The source bill of quantities contains 29 (zone, lot_no) pairs that repeat —
// some are genuinely distinct parcels sharing a number, others are zero-area
// placeholder rows. IDs are therefore index-based so every record is uniquely
// addressable, with the lot number kept as a display field.
//
// 27 records carry zero area (26 Open Space, 1 Commercial Unit). Those are not
// sellable inventory and get no price; `isSellable` keeps them out of the
// buyer-facing lot lists while preserving them in the underlying dataset.
export const LOTS = lotsRaw.map((l, i) => {
  const costPerSqft = zoneCostPerSqft[l.zone] || null;
  const hasArea = Boolean(l.area_sqft);
  const isSellable = hasArea && l.lot_type !== "Open Space";
  return {
    id: `${l.zone}-${l.lot_no}-${i}`,
    zone: l.zone,
    lotNo: l.lot_no,
    lotType: l.lot_type,
    areaSqm: l.area_sqm,
    areaSqft: l.area_sqft,
    buildingDetail: l.building_1st_or_detail,
    buildingSecondary: l.building_2nd_or_sqft_per_bldg,
    hardscape: l.hardscape,
    softscape: l.softscape,
    isSellable,
    indicativePriceUsd: isSellable && costPerSqft ? Math.round(costPerSqft * l.area_sqft) : null,
  };
});

export const PORTFOLIO_STATS = {
  totalAcres: 983,
  totalLots: LOTS.length,
  totalZones: ZONES.length,
  totalDevelopmentCostUsd: ZONES.reduce((s, z) => s + (z.totalDevelopmentCostUsd || 0), 0),
  totalJobs: 42543,
  beachfrontMiles: 4,
};
