"use client";

import { useEffect, useState } from "react";
import { fmtNum, fmtUSD } from "../lib/format";

export default function LotTable({ zoneId, onSelectLot }) {
  const [lotType, setLotType] = useState("");
  const [sort, setSort] = useState("lotNo");
  const [data, setData] = useState({ total: 0, lots: [], lotTypes: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!zoneId) return;
    setLoading(true);
    const params = new URLSearchParams({ zone: zoneId, limit: "200" });
    if (lotType) params.set("lotType", lotType);
    fetch(`/api/lots?${params.toString()}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [zoneId, lotType]);

  if (!zoneId) return null;

  const sorted = [...data.lots].sort((a, b) => {
    if (sort === "price") return (b.indicativePriceUsd || 0) - (a.indicativePriceUsd || 0);
    if (sort === "area") return b.areaSqft - a.areaSqft;
    return String(a.lotNo).localeCompare(String(b.lotNo), undefined, { numeric: true });
  });

  return (
    <div>
      <h3 className="section">Lot-Level Detail</h3>
      {data.lotTypes.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          <select value={lotType} onChange={(e) => setLotType(e.target.value)}>
            <option value="">All types</option>
            {data.lotTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="lotNo">Sort: Lot #</option>
            <option value="price">Sort: Price (high–low)</option>
            <option value="area">Sort: Area (large–small)</option>
          </select>
        </div>
      )}
      {loading ? (
        <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 8 }}>Loading lots…</p>
      ) : sorted.length === 0 ? (
        <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 8 }}>
          No individual lot records for this zone — pricing available on request.
        </p>
      ) : (
        <>
          <div className="lot-scroll">
            <table className="lot-table">
              <thead>
                <tr>
                  <th>Lot</th>
                  <th>Type</th>
                  <th>Area (sq ft)</th>
                  <th>Indicative Price</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((l) => (
                  <tr key={l.id} onClick={() => onSelectLot(l)}>
                    <td>{l.lotNo}</td>
                    <td>{l.lotType}</td>
                    <td>{fmtNum(l.areaSqft, 0)}</td>
                    <td className="price-tag">{fmtUSD(l.indicativePriceUsd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
            Showing {sorted.length} of {data.total} records.
          </p>
          <p className="disclaimer">
            Indicative pricing is an estimated development-cost basis derived from the project cost
            model, scaled by lot area — not a final sale price. Confirm current pricing with a
            consultation.
          </p>
        </>
      )}
    </div>
  );
}
