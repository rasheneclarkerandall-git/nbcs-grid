import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

const KV_LIST_KEY = "malcolm-bay:leads";
const LOCAL_FILE = path.join(process.cwd(), ".leads-dev.json");

function hasKv() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function saveToKv(lead) {
  const { Redis } = await import("@upstash/redis");
  const redis = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });
  await redis.lpush(KV_LIST_KEY, JSON.stringify(lead));
}

async function saveToLocalFile(lead) {
  let existing = [];
  try {
    const raw = await fs.readFile(LOCAL_FILE, "utf-8");
    existing = JSON.parse(raw);
  } catch {
    existing = [];
  }
  existing.unshift(lead);
  await fs.writeFile(LOCAL_FILE, JSON.stringify(existing, null, 2));
}

export async function POST(request) {
  const body = await request.json();
  const { name, email, phone, notes, interest, persona, lotId } = body;

  if (!name || !email) {
    return NextResponse.json({ error: "name and email are required" }, { status: 400 });
  }

  const lead = {
    id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    email,
    phone: phone || null,
    notes: notes || null,
    interest: interest || null,
    persona: persona || null,
    lotId: lotId || null,
    createdAt: new Date().toISOString(),
  };

  try {
    if (hasKv()) {
      await saveToKv(lead);
    } else {
      // No KV configured — durable only for local dev. In production, add the
      // Vercel KV integration and set KV_REST_API_URL / KV_REST_API_TOKEN.
      await saveToLocalFile(lead);
      console.warn("[leads] KV not configured — lead saved to local dev file only.");
    }
  } catch (err) {
    return NextResponse.json({ error: `Failed to store lead: ${err.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true, leadId: lead.id });
}
