"use client";

import { useEffect, useRef, useState } from "react";

const GREETING = {
  investor:
    "Hi, I'm the Malcolm Bay concierge. Ask me about zone economics, draw schedules, or lot inventory — I'm grounded in the live project data.",
  government:
    "Hi, I'm the Malcolm Bay concierge. Ask me about employment impact, land use, or public/green space commitments across the masterplan.",
  homeowner:
    "Hi, I'm the Malcolm Bay concierge. Tell me what you're looking for — lot size, zone, or budget — and I'll help you find a match.",
  default:
    "Hi, I'm the Malcolm Bay concierge. Ask me anything about the development's zones, lots, or specs.",
};

// Shown when no ANTHROPIC_API_KEY is set on the server. Every figure below is
// real, taken from the project dataset, so the example demonstrates the
// concierge honestly rather than inventing plausible-looking numbers.
const SAMPLE_EXCHANGE = [
  { role: "assistant", text: GREETING.default },
  { role: "user", text: "What residential lots are under $400k?" },
  {
    role: "assistant",
    tool: "search_lots · maxPriceUsd 400000",
    text: "There are 494 residential lots with an indicative basis under $400,000. The largest are DEV-01 lot 19 at 13,476 sq ft (~$399,977) and DEV-02b lot 302 at 13,229 sq ft (~$398,448) — so the budget still reaches quarter-acre-plus parcels. These are development-cost estimates rather than sale prices; the team can confirm current pricing on a consultation.",
  },
  { role: "user", text: "How does DEV-05 compare to DEV-03?" },
  {
    role: "assistant",
    tool: "get_zone_summary ×2",
    text: "DEV-03 is the larger scheme: 64.5 acres, 254 units, $132.4M total development cost at $521,320 per unit. DEV-05 is 63.0 acres but far less dense — 102 units, $66.3M, and $650,457 per unit. So DEV-05 trades unit count for larger, higher-value lots on a near-identical footprint.",
  },
];

export default function ConciergeChat({ persona }) {
  const [open, setOpen] = useState(false);
  const [configured, setConfigured] = useState(null); // null = still checking
  const [display, setDisplay] = useState([]);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/chat")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setConfigured(Boolean(d.configured));
      })
      .catch(() => {
        if (!cancelled) setConfigured(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persona, configured]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [display, open]);

  function reset() {
    setHistory([]);
    if (configured === false) {
      setDisplay(SAMPLE_EXCHANGE);
    } else {
      setDisplay([{ role: "assistant", text: GREETING[persona] || GREETING.default }]);
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setDisplay((d) => [...d, { role: "user", text }]);
    setLoading(true);

    const nextHistory = [...history, { role: "user", content: text }];

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: nextHistory, persona }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDisplay((d) => [...d, { role: "assistant", text: data.error || "Something went wrong." }]);
        return;
      }
      setHistory(data.messages);
      setDisplay((d) => [...d, { role: "assistant", text: data.reply || "…" }]);
    } catch {
      setDisplay((d) => [...d, { role: "assistant", text: "Connection error — please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  const isExample = configured === false;

  return (
    <>
      <button className="chat-toggle" onClick={() => setOpen((o) => !o)} aria-label="Toggle concierge chat">
        {open ? "✕" : "💬"}
      </button>
      {open && (
        <div className="chat-window">
          <div className="chat-header">
            <div>
              <div className="title">Malcolm Bay Concierge</div>
              {isExample && <div className="chat-sub">Example exchange — not live on this deployment</div>}
            </div>
            {!isExample && <button onClick={reset}>Clear</button>}
          </div>

          <div className="chat-messages" ref={scrollRef}>
            {display.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`}>
                {m.tool && <span className="chat-toolcall">↳ {m.tool}</span>}
                {m.text}
              </div>
            ))}
            {loading && <div className="chat-msg assistant">…</div>}
          </div>

          {isExample ? (
            <div className="chat-note">
              The concierge answers by calling tools against the real dataset —{" "}
              <b>search_lots</b>, <b>get_zone_summary</b>, <b>get_lot</b> — so figures come from
              the cost model, not a written summary. It needs an <code>ANTHROPIC_API_KEY</code> set
              on the server. The numbers above are real; everything else on this site is fully live.
            </div>
          ) : (
            <div className="chat-input-row">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask about a zone, lot, or price…"
              />
              <button onClick={send} disabled={loading}>
                Send
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
