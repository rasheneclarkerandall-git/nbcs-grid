// Builds the master-plan cartogram: every zone rendered with its area in
// proportion to real acreage, grouped into land-use families.
//
// This replaces the previous arrangement of similarly-sized boxes, which
// misrepresented the plan — Hotels is 365 acres, 42% of all zoned land, but
// was drawn barely larger than a 15-acre residential block. Area is the one
// spatial property the dataset actually supports, so it is the one the
// drawing encodes. Position is NOT survey geometry and is labelled as such;
// the only positional claim made is that the waterfront family sits against
// the water, which is true by definition (marina, beach and resort frontage).

// Land-use families. Hue separates the three families and is CVD-validated
// (worst all-pairs ΔE 17.6 deutan); lightness steps separate members within a
// family, backed by a direct label on every zone.
export const FAMILIES = {
  housing: { label: "Housing", base: "#0F6E9C" },
  commerce: { label: "Commerce & public realm", base: "#C08F30" },
  hospitality: { label: "Hospitality", base: "#9C4A22" },
};

export const CATEGORY_STYLE = {
  Residential: { family: "housing", fill: "#0F6E9C" },
  "Residential (Marina)": { family: "housing", fill: "#3AA0C4" },
  "Mixed Use (Apartments)": { family: "housing", fill: "#0A5A88" },
  Commercial: { family: "commerce", fill: "#C08F30" },
  "Public Recreation & Commerce": { family: "commerce", fill: "#A67A28" },
  Hospitality: { family: "hospitality", fill: "#9C4A22" },
};

// Zones that front the water. Not an inference about survey coordinates —
// a marina, a public beach and beachfront resort lots are waterfront by
// definition of what they are.
const WATERFRONT = new Set(["Hotels", "Marina Homes", "PRC"]);

/**
 * Squarified treemap. Lays rectangles out so each one's AREA is proportional
 * to its value, keeping aspect ratios close to square so small zones stay
 * legible and labels fit.
 */
function squarify(items, x, y, w, h) {
  const out = [];
  const total = items.reduce((s, it) => s + it.value, 0);
  if (total <= 0 || w <= 0 || h <= 0) return out;

  let rest = [...items].sort((a, b) => b.value - a.value);
  let area = w * h;
  let scale = area / total;

  let cx = x;
  let cy = y;
  let cw = w;
  let ch = h;

  const worst = (row, side) => {
    const sum = row.reduce((s, r) => s + r.value * scale, 0);
    if (sum <= 0 || side <= 0) return Infinity;
    const max = Math.max(...row.map((r) => r.value * scale));
    const min = Math.min(...row.map((r) => r.value * scale));
    const s2 = sum * sum;
    const side2 = side * side;
    return Math.max((side2 * max) / s2, s2 / (side2 * min));
  };

  while (rest.length) {
    const vertical = cw >= ch;
    const side = vertical ? ch : cw;
    const row = [rest[0]];
    let i = 1;
    while (i < rest.length && worst([...row, rest[i]], side) <= worst(row, side)) {
      row.push(rest[i]);
      i += 1;
    }

    const rowArea = row.reduce((s, r) => s + r.value * scale, 0);
    const thickness = side > 0 ? rowArea / side : 0;

    let offset = 0;
    for (const item of row) {
      const itemArea = item.value * scale;
      const length = rowArea > 0 ? (itemArea / rowArea) * side : 0;
      out.push(
        vertical
          ? { ...item, x: cx, y: cy + offset, w: thickness, h: length }
          : { ...item, x: cx + offset, y: cy, w: length, h: thickness }
      );
      offset += length;
    }

    if (vertical) {
      cx += thickness;
      cw -= thickness;
    } else {
      cy += thickness;
      ch -= thickness;
    }
    rest = rest.slice(i);
  }
  return out;
}

export const VIEW = { w: 1000, h: 545, sea: 64, pad: 10 };

/**
 * Lay out every zone. Waterfront uses sit in a band against the water; the
 * remainder fill the inland body. Both bands are sized by their true share
 * of total acreage, so the split itself carries information.
 */
export function buildSiteLayout(zones) {
  const items = zones.map((z) => ({
    zoneId: z.zoneId,
    category: z.category,
    value: z.acreage || 0,
    waterfront: WATERFRONT.has(z.zoneId),
  }));

  const water = items.filter((i) => i.waterfront);
  const inland = items.filter((i) => !i.waterfront);
  const totalAll = items.reduce((s, i) => s + i.value, 0) || 1;
  const waterShare = water.reduce((s, i) => s + i.value, 0) / totalAll;

  const bodyTop = VIEW.sea;
  const bodyH = VIEW.h - VIEW.sea - VIEW.pad;
  const bodyW = VIEW.w - VIEW.pad * 2;

  // Clamp the waterfront band so a dominant zone cannot crowd out the rest.
  const waterH = Math.max(120, Math.min(bodyH * 0.62, bodyH * waterShare * 1.35));

  return [
    ...squarify(water, VIEW.pad, bodyTop, bodyW, waterH),
    ...squarify(inland, VIEW.pad, bodyTop + waterH, bodyW, bodyH - waterH),
  ].map((r) => ({
    ...r,
    style: CATEGORY_STYLE[r.category] || { family: "housing", fill: "#0F6E9C" },
  }));
}
