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

export default function ConciergeChat({ persona }) {
  const [open, setOpen] = useState(false);
  const [display, setDisplay] = useState([]); // [{role, text}] for rendering
  const [history, setHistory] = useState([]); // raw Anthropic message history
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persona]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [display, open]);

  function reset() {
    setHistory([]);
    setDisplay([{ role: "assistant", text: GREETING[persona] || GREETING.default }]);
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
        setLoading(false);
        return;
      }
      setHistory(data.messages);
      setDisplay((d) => [...d, { role: "assistant", text: data.reply || "…" }]);
    } catch (err) {
      setDisplay((d) => [...d, { role: "assistant", text: "Connection error — please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button className="chat-toggle" onClick={() => setOpen((o) => !o)} aria-label="Toggle concierge chat">
        {open ? "✕" : "💬"}
      </button>
      {open && (
        <div className="chat-window">
          <div className="chat-header">
            <span className="title">Malcolm Bay Concierge</span>
            <button onClick={reset}>Clear</button>
          </div>
          <div className="chat-messages" ref={scrollRef}>
            {display.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`}>
                {m.text}
              </div>
            ))}
            {loading && <div className="chat-msg assistant">…</div>}
          </div>
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
        </div>
      )}
    </>
  );
}
