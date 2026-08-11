"use client";

import Image from "next/image";
import StatCounter from "./StatCounter";
import { PORTFOLIO_STATS } from "../data/dataset";

const PERSONAS = [
  {
    id: "investor",
    icon: "📈",
    title: "Investor",
    blurb: "Explore zone-by-zone development economics, draw schedules, and lot inventory across the portfolio.",
  },
  {
    id: "government",
    icon: "🏛️",
    title: "Government Body",
    blurb: "Review employment impact, infrastructure alignment, and the public/green-space commitment.",
  },
  {
    id: "homeowner",
    icon: "🏡",
    title: "Future Homeowner",
    blurb: "Browse residential lots, floor plans, and what life on a 4-mile stretch of coastline looks like.",
  },
];

export default function Landing({ onSelectPersona }) {
  return (
    <div>
      <header className="site-header">
        <div className="brand">
          <Image src="/logo.png" alt="Malcolm Bay Resorts" width={140} height={38} priority style={{ height: 38, width: "auto" }} />
        </div>
        <a href="#explore" className="btn btn-ghost btn-small" onClick={(e) => { e.preventDefault(); onSelectPersona("investor"); }}>
          Skip to explorer →
        </a>
      </header>

      <section className="hero">
        <h1>A 983-Acre Coastal Development, Modeled Down to the Lot.</h1>
        <p className="lead">
          Malcolm Bay Resorts is a mixed-use masterplan in St. Elizabeth, Jamaica — residential
          neighborhoods, a marina, boutique and large-format resort hotels, and commercial
          zones, built along four miles of beachfront. This is the live development twin: every
          zone, every lot, real cost-model data.
        </p>

        <div className="stat-row">
          <div className="stat-card">
            <div className="value"><StatCounter value={PORTFOLIO_STATS.totalAcres} />+</div>
            <div className="label">Acres</div>
          </div>
          <div className="stat-card">
            <div className="value"><StatCounter value={PORTFOLIO_STATS.totalLots} /></div>
            <div className="label">Lots Modeled</div>
          </div>
          <div className="stat-card">
            <div className="value"><StatCounter value={PORTFOLIO_STATS.totalJobs} /></div>
            <div className="label">Jobs at Build-Out</div>
          </div>
          <div className="stat-card">
            <div className="value"><StatCounter value={PORTFOLIO_STATS.beachfrontMiles} />mi</div>
            <div className="label">Beachfront</div>
          </div>
        </div>

        <div className="persona-picker">
          {PERSONAS.map((p) => (
            <button key={p.id} className="persona-card" onClick={() => onSelectPersona(p.id)}>
              <div className="icon">{p.icon}</div>
              <h3>{p.title}</h3>
              <p>{p.blurb}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
