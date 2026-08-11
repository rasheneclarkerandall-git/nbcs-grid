import { listZones, getZone, listLots, getLot, getPortfolioStats, listLotTypes } from "./queries.js";

export const TOOLS = [
  {
    name: "get_portfolio_overview",
    description:
      "Get top-level Malcolm Bay Resorts portfolio stats: total acreage, total lots, total zones, total jobs at build-out, beachfront miles, and total development cost across all zones. Use this for any high-level 'tell me about the development' question.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "list_zones",
    description:
      "List all development zones with their category, acreage, unit/lot count, total development cost, and cost basis (per unit or per sq ft). Use this to answer questions comparing zones or asking what zones exist.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_zone_summary",
    description:
      "Get the full profile for one specific zone by its zone ID (e.g. 'DEV-01', 'Marina Homes', 'Hotels', 'Commercial Units', 'PRC'), including its investment draw schedule by year.",
    input_schema: {
      type: "object",
      properties: {
        zoneId: { type: "string", description: "The zone ID, e.g. DEV-03 or Marina Homes" },
      },
      required: ["zoneId"],
    },
  },
  {
    name: "search_lots",
    description:
      "Search individual lots across the development, optionally filtered by zone, lot type, price range (USD), or area range (sq ft). Returns lot number, type, area, and indicative price for each match. Use this for any 'find me a lot' or 'what's available' style question.",
    input_schema: {
      type: "object",
      properties: {
        zone: { type: "string", description: "Zone ID to restrict the search to, e.g. DEV-01" },
        lotType: {
          type: "string",
          description: "Lot type to filter by, e.g. Residential, Commercial Unit, Open Space, Mixed Used",
        },
        minPriceUsd: { type: "number" },
        maxPriceUsd: { type: "number" },
        minAreaSqft: { type: "number" },
        maxAreaSqft: { type: "number" },
        limit: { type: "number", description: "Max results to return, default 10, max 25" },
      },
    },
  },
  {
    name: "get_lot",
    description: "Get full detail for one specific lot by zone ID and lot number.",
    input_schema: {
      type: "object",
      properties: {
        zone: { type: "string" },
        lotNo: { type: "string", description: "Lot number, as a string (some are like '884a')" },
      },
      required: ["zone", "lotNo"],
    },
  },
];

export async function runTool(name, input = {}) {
  switch (name) {
    case "get_portfolio_overview":
      return getPortfolioStats();

    case "list_zones":
      return listZones().map((z) => ({
        zoneId: z.zoneId,
        category: z.category,
        acreage: z.acreage,
        unitsOrLots: z.unitsOrLots,
        totalDevelopmentCostUsd: z.totalDevelopmentCostUsd,
        costPerUnitUsd: z.costPerUnitUsd,
        costPerSqftUsd: z.costPerSqftUsd,
        note: z.note,
      }));

    case "get_zone_summary": {
      const zone = getZone(input.zoneId);
      if (!zone) return { error: `No zone found matching "${input.zoneId}".`, availableZones: listZones().map((z) => z.zoneId) };
      return zone;
    }

    case "search_lots": {
      const limit = Math.min(input.limit || 10, 25);
      const { total, lots } = listLots({ ...input, limit });
      return { totalMatches: total, returned: lots.length, lots, availableLotTypes: listLotTypes() };
    }

    case "get_lot": {
      const lot = getLot(input.zone, input.lotNo);
      if (!lot) return { error: `No lot found for zone "${input.zone}", lot number "${input.lotNo}".` };
      return lot;
    }

    default:
      return { error: `Unknown tool "${name}".` };
  }
}
