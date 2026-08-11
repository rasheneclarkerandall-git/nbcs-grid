"use client";

import { useState } from "react";
import ZoneMap from "./ZoneMap";
import LotTable from "./LotTable";
import LotDetailDrawer from "./LotDetailDrawer";
import { ZONES } from "../data/dataset";
import { fmtNum, fmtUSD } from "../lib/format";

const PERSONA_COPY = {
  investor: {
    tag: "Investor View",
    title: "Development Economics, Zone by Zone",
    desc: "Click any zone for its full profile — acreage, unit count, total development cost, cost basis, phasing draw schedule, and individual lot detail.",
  },
  government: {
    tag: "Government Body View",
    title: "Infrastructure, Land Use & Public Space",
    desc: "The masterplan reserves 32% of the site as green/public space, with 1,233 modeled lots across residential, commercial, and hospitality zones supporting long-term tax base and employment.",
  },
  homeowner: {
    tag: "Future Homeowner View",
    title: "Find Your Lot",
    desc: "Browse residential neighborhoods and marina homes — filter by size and see indicative pricing for each lot.",
  },
};

function ZonePanel({ zone }) {
  if (!zone) {
    return (
      <div className="empty-state">
        Select a zone on the map to see its full profile — acreage, unit count, total
        development cost, cost basis, phasing draw schedule, and (where available)
        individual lot-level detail.
        <br />
        <br />
        <b>{ZONES.length} zones</b> · <b>1,233</b> individual lots/units modeled.
      </div>
    );
  }

  const costLabel = zone.costPerSqftUsd != null && zone.costPerUnitUsd == null ? "Cost / Sq Ft" : "Cost / Unit";
  const costValue =
    zone.costPerUnitUsd != null ? fmtUSD(zone.costPerUnitUsd) : fmtUSD(zone.costPerSqftUsd);

  const years = zone.drawScheduleByYear || {};
  const yearKeys = Object.keys(years).sort(
    (a, b) => parseInt(a.split("_")[1]) - parseInt(b.split("_")[1])
  );
  const maxPct = Math.max(...yearKeys.map((k) => years[k]), 0.01);

  return (
    <>
      <h2>{zone.zoneId}</h2>
      <div className="cat">{zone.category}</div>
      {zone.note && (
        <div className="note-box">
          <b>Note:</b> {zone.note}
        </div>
      )}
      <div className="stat-grid">
        <div className="stat">
          <div className="label">Acreage</div>
          <div className="value">{fmtNum(zone.acreage)}</div>
        </div>
        <div className="stat">
          <div className="label">Units / Lots</div>
          <div className="value">{fmtNum(zone.unitsOrLots, 0)}</div>
        </div>
        <div className="stat">
          <div className="label">Total Dev. Cost</div>
          <div className="value">{fmtUSD(zone.totalDevelopmentCostUsd)}</div>
        </div>
        <div className="stat">
          <div className="label">{costLabel}</div>
          <div className="value">{costValue}</div>
        </div>
      </div>

      {yearKeys.length > 0 && (
        <>
          <h3 className="section">Investment Draw Schedule</h3>
          <div className="draw-bar">
            {yearKeys.map((k) => {
              const pct = years[k];
              const h = Math.round((pct / maxPct) * 52) + 6;
              const yr = k.split("_")[1];
              return (
                <div
                  key={k}
                  className="col"
                  style={{ height: h }}
                  title={`Year ${yr}: ${Math.round(pct * 100)}%`}
                >
                  <span className="yr">Y{yr}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

export default function MasterPlanExplorer({ persona = "investor", onRegisterInterest }) {
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [selectedLot, setSelectedLot] = useState(null);

  const zone = ZONES.find((z) => z.zoneId === selectedZoneId) || null;
  const copy = PERSONA_COPY[persona] || PERSONA_COPY.investor;

  return (
    <div>
      <div className="explorer-banner">
        <div className="tag">{copy.tag}</div>
        <h2>{copy.title}</h2>
        <p>{copy.desc}</p>
      </div>

      <div className="explorer-layout">
        <ZoneMap selectedZoneId={selectedZoneId} onSelectZone={setSelectedZoneId} />
        <div className="panel">
          <ZonePanel zone={zone} />
          {zone && <LotTable zoneId={zone.zoneId} onSelectLot={setSelectedLot} />}
        </div>
      </div>

      <LotDetailDrawer
        lot={selectedLot}
        onClose={() => setSelectedLot(null)}
        onRegisterInterest={(lot) => {
          setSelectedLot(null);
          onRegisterInterest(lot);
        }}
      />
    </div>
  );
}
