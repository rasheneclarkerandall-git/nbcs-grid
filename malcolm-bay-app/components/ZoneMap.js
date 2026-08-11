"use client";

import { useMemo, useState } from "react";
import { ZONES } from "../data/dataset";
import { buildSiteLayout, VIEW, CATEGORY_STYLE, FAMILIES } from "../lib/site-layout";
import { fmtNum, fmtUSD } from "../lib/format";

const GAP = 2; // surface gap between adjacent fills

export default function ZoneMap({ selectedZoneId, onSelectZone }) {
  const [hover, setHover] = useState(null);
  const rects = useMemo(() => buildSiteLayout(ZONES), []);
  const byId = useMemo(() => Object.fromEntries(ZONES.map((z) => [z.zoneId, z])), []);

  const hovered = hover ? byId[hover] : null;

  return (
    <div className="map-pane">
      <div className="map-head">
        <h3 className="map-title">Land use by area</h3>
        <p className="map-sub">
          Each zone is drawn at its true share of the 859 zoned acres. Arrangement is
          indicative, not survey geometry — real parcel boundaries follow once the
          subdivision file is georeferenced.
        </p>
      </div>

      <div className="map-frame">
        <svg
          viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Malcolm Bay master plan, zones sized by acreage"
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8ecfdc" />
              <stop offset="100%" stopColor="#cfe8ee" />
            </linearGradient>
            <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
              <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* water */}
          <rect x="0" y="0" width={VIEW.w} height={VIEW.sea} fill="url(#sea)" />
          <path
            d={`M0 ${VIEW.sea - 30} Q 125 ${VIEW.sea - 40}, 250 ${VIEW.sea - 30} T 500 ${
              VIEW.sea - 30
            } T 750 ${VIEW.sea - 30} T 1000 ${VIEW.sea - 30}`}
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.55"
            strokeWidth="2"
          />
          <path
            d={`M0 ${VIEW.sea - 16} Q 140 ${VIEW.sea - 26}, 280 ${VIEW.sea - 16} T 560 ${
              VIEW.sea - 16
            } T 840 ${VIEW.sea - 16} T 1120 ${VIEW.sea - 16}`}
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.35"
            strokeWidth="2"
          />
          <text x="16" y="22" className="map-water-label">
            CARIBBEAN SEA · 4 MILES OF FRONTAGE
          </text>
          {/* shoreline */}
          <rect x="0" y={VIEW.sea - 4} width={VIEW.w} height="4" fill="#e8d8b4" />

          {/* zones */}
          {rects.map((r) => {
            const isSel = selectedZoneId === r.zoneId;
            const isHov = hover === r.zoneId;
            const x = r.x + GAP / 2;
            const y = r.y + GAP / 2;
            const w = Math.max(0, r.w - GAP);
            const h = Math.max(0, r.h - GAP);
            const showAcres = w > 74 && h > 46;
            return (
              <g
                key={r.zoneId}
                className={`zone${isSel ? " selected" : ""}`}
                onClick={() => onSelectZone(r.zoneId)}
                onMouseEnter={() => setHover(r.zoneId)}
                tabIndex={0}
                role="button"
                aria-label={`${r.zoneId}, ${r.category}, ${r.value} acres`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectZone(r.zoneId);
                  }
                }}
              >
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  rx="3"
                  fill={r.style.fill}
                  fillOpacity={isHov || isSel ? 1 : 0.92}
                />
                <rect x={x} y={y} width={w} height={Math.min(h, 30)} rx="3" fill="url(#sheen)" />
                {isSel && (
                  <rect
                    x={x + 1.25}
                    y={y + 1.25}
                    width={Math.max(0, w - 2.5)}
                    height={Math.max(0, h - 2.5)}
                    rx="3"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                  />
                )}
                {w > 44 && h > 22 && (
                  <text
                    x={x + w / 2}
                    y={y + h / 2 - (showAcres ? 7 : 0)}
                    className="zone-label"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {r.zoneId}
                  </text>
                )}
                {showAcres && (
                  <text
                    x={x + w / 2}
                    y={y + h / 2 + 12}
                    className="zone-acres"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {fmtNum(r.value, 1)} ac
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {hovered && (
          <div className="map-tip" role="status">
            <div className="map-tip-id">{hovered.zoneId}</div>
            <div className="map-tip-cat">{hovered.category}</div>
            <dl className="map-tip-rows">
              <div>
                <dt>Acreage</dt>
                <dd>{fmtNum(hovered.acreage, 2)}</dd>
              </div>
              <div>
                <dt>Units / lots</dt>
                <dd>{fmtNum(hovered.unitsOrLots, 0)}</dd>
              </div>
              <div>
                <dt>Dev. cost</dt>
                <dd>{fmtUSD(hovered.totalDevelopmentCostUsd)}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      <div className="legend">
        {Object.entries(FAMILIES).map(([key, fam]) => (
          <div className="legend-family" key={key}>
            <span className="legend-family-name">{fam.label}</span>
            {Object.entries(CATEGORY_STYLE)
              .filter(([, s]) => s.family === key)
              .map(([cat, s]) => (
                <span className="legend-item" key={cat}>
                  <span className="swatch" style={{ background: s.fill }} />
                  {cat}
                </span>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
