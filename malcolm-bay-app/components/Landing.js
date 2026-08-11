"use client";

import Image from "next/image";
import StatCounter from "./StatCounter";
import { PORTFOLIO_STATS } from "../data/dataset";

// Drawn marks rather than emoji: emoji as section markers reads as generic,
// and these encode something about each view — a yield curve, a civic
// frontage, a plot boundary.
const MARKS = {
  investor: (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M3 25h26" />
      <path d="M5 21l7-7 5 4 9-11" />
      <circle cx="12" cy="14" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="17" cy="18" r="1.8" fill="currentColor" stroke="none" />
    </svg>
  ),
  government: (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M4 27h24" />
      <path d="M6 27V13m6 14V13m8 14V13m6 14V13" />
      <path d="M16 4L3 11h26L16 4z" />
    </svg>
  ),
  homeowner: (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M4 26V9l12-5 12 5v17" />
      <path d="M4 26h24" />
      <path d="M13 26v-8h6v8" />
    </svg>
  ),
};

const PERSONAS = [
  {
    id: "investor",
    title: "Investor",
    blurb: "Explore zone-by-zone development economics, draw schedules, and lot inventory across the portfolio.",
  },
  {
    id: "government",
    title: "Government Body",
    blurb: "Review employment impact, infrastructure alignment, and the public/green-space commitment.",
  },
  {
    id: "homeowner",
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
              <span className="persona-mark">{MARKS[p.id]}</span>
              <h3>{p.title}</h3>
              <p>{p.blurb}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
