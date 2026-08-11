"use client";

import { fmtNum, fmtUSD } from "../lib/format";

export default function LotDetailDrawer({ lot, onClose, onRegisterInterest }) {
  if (!lot) return null;
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <div className="cat">{lot.zone}</div>
        <h2>Lot {lot.lotNo}</h2>
        <p style={{ color: "var(--muted)", fontSize: 13.5 }}>{lot.lotType}</p>

        <div className="stat-grid" style={{ marginTop: 18 }}>
          <div className="stat">
            <div className="label">Area</div>
            <div className="value">{fmtNum(lot.areaSqft, 0)} sq ft</div>
          </div>
          <div className="stat">
            <div className="label">Area (m²)</div>
            <div className="value">{fmtNum(lot.areaSqm, 0)}</div>
          </div>
          {typeof lot.buildingDetail === "number" && (
            <div className="stat">
              <div className="label">Building</div>
              <div className="value">{fmtNum(lot.buildingDetail, 0)} sq ft</div>
            </div>
          )}
          {typeof lot.buildingDetail === "string" && (
            <div className="stat">
              <div className="label">Building</div>
              <div className="value">{lot.buildingDetail}</div>
            </div>
          )}
          <div className="stat">
            <div className="label">Indicative Price</div>
            <div className="value">{fmtUSD(lot.indicativePriceUsd)}</div>
          </div>
        </div>

        <p className="disclaimer">
          Indicative pricing is an estimated development-cost basis, not a final sale price —
          confirm current figures with a consultation.
        </p>

        <button
          className="btn btn-primary"
          style={{ width: "100%", marginTop: 22 }}
          onClick={() => onRegisterInterest(lot)}
        >
          Register Interest in This Lot
        </button>
      </div>
    </div>
  );
}
