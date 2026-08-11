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

// Last-resort sink. Serverless filesystems are read-only, so on a deployment
// with no store configured the file write fails. Dropping the lead and showing
// the prospect an error loses them entirely; writing it to the function log at
// least keeps it recoverable while the operator wires up a real store.
function saveToLog(lead, reason) {
  console.error(
    `[leads] NOT DURABLY STORED (${reason}). Configure KV_REST_API_URL/KV_REST_API_TOKEN. Lead follows:\n` +
      JSON.stringify(lead)
  );
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

  // `stored` reports where the lead actually landed, so a deployment that is
  // only logging leads is visible rather than silently assumed durable.
  let stored = "log-only";

  if (hasKv()) {
    try {
      await saveToKv(lead);
      stored = "redis";
    } catch (err) {
      saveToLog(lead, `redis write failed: ${err.message}`);
    }
  } else {
    try {
      await saveToLocalFile(lead);
      stored = "file";
    } catch (err) {
      // Expected on serverless (read-only FS) with no store configured.
      saveToLog(lead, `no store configured and file write failed: ${err.code || err.message}`);
    }
  }

  return NextResponse.json({ ok: true, leadId: lead.id, stored });
}
