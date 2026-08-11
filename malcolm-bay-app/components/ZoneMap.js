"use client";

import { ZONE_SHAPES, CATEGORY_LEGEND } from "../data/dataset";

export default function ZoneMap({ selectedZoneId, onSelectZone }) {
  return (
    <div className="map-pane">
      <div className="map-note">
        <b>Note:</b> zone shapes below are schematic — sized proportionally by acreage, not true
        site geometry. Real parcel boundaries will replace these once the CAD subdivision file is
        exported to GeoJSON. All attribute data shown on click is real, from the project cost
        model and bill of quantities.
      </div>
      <svg viewBox="0 0 1780 500" xmlns="http://www.w3.org/2000/svg">
        {ZONE_SHAPES.map((s) => (
          <rect
            key={s.zoneId}
            className={`zone-shape${selectedZoneId === s.zoneId ? " selected" : ""}`}
            data-zone={s.zoneId}
            x={s.x}
            y={s.y}
            width={s.w}
            height={s.h}
            rx={5}
            fill={s.color}
            fillOpacity={0.85}
            stroke="#023E74"
            strokeWidth={1.5}
            onClick={() => onSelectZone(s.zoneId)}
          />
        ))}
        {ZONE_SHAPES.map((s) => (
          <text
            key={s.zoneId + "-label"}
            className="zone-label"
            x={s.x + s.w / 2}
            y={s.y + s.h / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            onClick={() => onSelectZone(s.zoneId)}
            style={{ cursor: "pointer" }}
          >
            {s.zoneId}
          </text>
        ))}
      </svg>
      <div className="legend">
        {CATEGORY_LEGEND.map((c) => (
          <div className="legend-item" key={c.category}>
            <span className="swatch" style={{ background: c.color }} />
            {c.category}
          </div>
        ))}
      </div>
    </div>
  );
}
