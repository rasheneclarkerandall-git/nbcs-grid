import { ZONES, LOTS, PORTFOLIO_STATS } from "../data/dataset.js";

export function listZones() {
  return ZONES;
}

export function getZone(zoneId) {
  return ZONES.find((z) => z.zoneId.toLowerCase() === String(zoneId).toLowerCase()) || null;
}

export function getPortfolioStats() {
  return PORTFOLIO_STATS;
}

/**
 * Filter lots by any combination of zone, lot type, and price/area range.
 * All filters are optional and combine with AND.
 */
export function listLots({
  zone,
  lotType,
  minPriceUsd,
  maxPriceUsd,
  minAreaSqft,
  maxAreaSqft,
  includeNonSellable = false,
  limit = 60,
  offset = 0,
} = {}) {
  let results = includeNonSellable ? LOTS : LOTS.filter((l) => l.isSellable);

  if (zone) {
    const z = zone.toLowerCase();
    results = results.filter((l) => l.zone.toLowerCase() === z);
  }
  if (lotType) {
    const t = lotType.toLowerCase();
    results = results.filter((l) => l.lotType.toLowerCase().includes(t));
  }
  if (typeof minPriceUsd === "number") {
    results = results.filter((l) => l.indicativePriceUsd != null && l.indicativePriceUsd >= minPriceUsd);
  }
  if (typeof maxPriceUsd === "number") {
    results = results.filter((l) => l.indicativePriceUsd != null && l.indicativePriceUsd <= maxPriceUsd);
  }
  if (typeof minAreaSqft === "number") {
    results = results.filter((l) => l.areaSqft >= minAreaSqft);
  }
  if (typeof maxAreaSqft === "number") {
    results = results.filter((l) => l.areaSqft <= maxAreaSqft);
  }

  const total = results.length;
  const page = results.slice(offset, offset + limit);
  return { total, lots: page };
}

export function getLot(zone, lotNo) {
  return (
    LOTS.find(
      (l) => l.zone.toLowerCase() === String(zone).toLowerCase() && String(l.lotNo) === String(lotNo)
    ) || null
  );
}

export function getLotById(id) {
  return LOTS.find((l) => l.id === id) || null;
}

export function listLotTypes() {
  return [...new Set(LOTS.filter((l) => l.isSellable).map((l) => l.lotType))].sort();
}
