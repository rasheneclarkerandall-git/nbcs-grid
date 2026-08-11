export function fmtUSD(v) {
  if (v === null || v === undefined) return "—";
  return "$" + Number(v).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function fmtNum(v, digits = 1) {
  if (v === null || v === undefined) return "—";
  return Number(v).toLocaleString("en-US", { maximumFractionDigits: digits });
}
