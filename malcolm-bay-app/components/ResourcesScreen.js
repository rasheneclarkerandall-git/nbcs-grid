"use client";

const RESOURCES = [
  { title: "Development Fact Sheet", icon: "📄" },
  { title: "Investor Deck", icon: "📊" },
  { title: "Site Plan (PDF)", icon: "🗺️" },
];

export default function ResourcesScreen({ onBack, onBackToExplorer }) {
  return (
    <div className="form-screen">
      <button className="back-link" onClick={onBack}>
        ← Back
      </button>
      <h2>Thank You</h2>
      <p style={{ color: "var(--muted)", marginTop: 6 }}>
        We've received your details. Here are a few resources in the meantime — a member of the
        team will be in touch shortly.
      </p>

      <div className="resource-grid">
        {RESOURCES.map((r) => (
          <div className="resource-card" key={r.title}>
            <div style={{ fontSize: 28 }}>{r.icon}</div>
            <h4 style={{ marginTop: 8, fontSize: 15 }}>{r.title}</h4>
            <button
              className="btn btn-ghost btn-small"
              onClick={() => alert(`"${r.title}" isn't wired to a real file yet — placeholder for the production build.`)}
            >
              Download
            </button>
          </div>
        ))}
      </div>

      <button
        className="btn btn-primary"
        style={{ width: "100%", marginTop: 28 }}
        onClick={() => alert("Scheduling isn't wired to a real calendar yet — placeholder for the production build (e.g. Calendly).")}
      >
        Schedule a Consultation
      </button>

      <button className="btn btn-ghost" style={{ width: "100%", marginTop: 12 }} onClick={onBackToExplorer}>
        Keep Exploring the Master Plan
      </button>
    </div>
  );
}
