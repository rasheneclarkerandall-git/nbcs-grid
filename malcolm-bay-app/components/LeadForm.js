"use client";

import { useState } from "react";

export default function LeadForm({ persona, prefillLot, onBack, onSubmitted }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    interest: prefillLot ? "Residential" : "Residential",
    notes: prefillLot ? `Interested in lot ${prefillLot.zone} #${prefillLot.lotNo}.` : "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, persona, lotId: prefillLot?.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      onSubmitted();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="form-screen">
      <button className="back-link" onClick={onBack}>
        ← Back to explorer
      </button>
      <h2>Let's Connect</h2>
      <p style={{ color: "var(--muted)", marginTop: 6 }}>
        Tell us a bit about your interest and a member of the Malcolm Bay team will follow up.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label>Full Name *</label>
          <input required value={form.name} onChange={(e) => update("name", e.target.value)} />
        </div>
        <div className="form-field">
          <label>Email *</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </div>
        <div className="form-field">
          <label>Phone</label>
          <input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
        </div>
        <div className="form-field">
          <label>What are you interested in?</label>
          <select value={form.interest} onChange={(e) => update("interest", e.target.value)}>
            <option>Residential</option>
            <option>Tourism / Hotel Lot</option>
            <option>Commercial</option>
            <option>Other</option>
          </select>
        </div>
        <div className="form-field">
          <label>Notes</label>
          <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} />
        </div>

        {error && <p style={{ color: "#c0392b", marginTop: 12, fontSize: 13.5 }}>{error}</p>}

        <button className="btn btn-primary" type="submit" disabled={submitting} style={{ marginTop: 22, width: "100%" }}>
          {submitting ? "Sending…" : "Submit"}
        </button>
      </form>
    </div>
  );
}
