import { NextResponse } from "next/server";
import { TOOLS, runTool } from "../../../lib/ai-tools";

export const runtime = "nodejs";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
const MAX_TOOL_ROUNDS = 4;

const PERSONA_ADDENDUM = {
  investor:
    "This visitor identified as an INVESTOR. Lead with development economics: zone-level cost basis, draw schedules, lot inventory, and portfolio totals. They may ask to compare zones or find lots in a price range.",
  government:
    "This visitor identified as a GOVERNMENT BODY contact. Lead with employment impact, infrastructure alignment, and public/green space — 32% of the site is reserved as green/public space. Be precise about what is and isn't in the dataset; permitting and tax-revenue detail beyond the dataset should be deferred to a human contact.",
  homeowner:
    "This visitor identified as a FUTURE HOMEOWNER. Lead with residential lots, floor plans, and lifestyle — help them find a lot that fits their size/price needs using search_lots.",
};

const SYSTEM_PROMPT = `You are the AI concierge for Malcolm Bay Resorts, a 983-acre mixed-use coastal development in St. Elizabeth, Jamaica.

You have tools to query the real, current project dataset: portfolio stats, zones, and individual lots with indicative pricing. ALWAYS use the tools to answer any factual question about acreage, zones, lot counts, specs, or pricing — never guess or invent numbers.

Indicative lot pricing in this dataset is an ESTIMATED DEVELOPMENT-COST BASIS derived from the project cost model, scaled by each lot's area — it is explicitly NOT a final sale price. Always say so when you quote a price, and encourage the visitor to confirm current pricing via a consultation.

For anything outside this dataset — legal terms, financing/mortgage details, firm delivery timelines, contracts, or final pricing — say plainly that you don't have that information and direct the visitor to schedule a consultation with the team. Do not speculate.

Keep answers concise and conversational, suited to a website chat widget. Use tools before answering factual questions; don't ask the visitor to repeat information you can look up yourself.`;

function buildSystemPrompt(persona) {
  const addendum = PERSONA_ADDENDUM[persona];
  return addendum ? `${SYSTEM_PROMPT}\n\n${addendum}` : SYSTEM_PROMPT;
}

// Lets the chat widget find out whether the concierge is live *before* a
// visitor types, so a deployment without an API key can present a labelled
// example instead of erroring at them. Reports only whether a key is set —
// never any part of the key itself.
export async function GET() {
  return NextResponse.json({ configured: Boolean(process.env.ANTHROPIC_API_KEY) });
}

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI concierge is not configured (missing ANTHROPIC_API_KEY on the server)." },
      { status: 503 }
    );
  }

  const body = await request.json();
  const { messages = [], persona } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages is required" }, { status: 400 });
  }

  let conversation = messages;

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const res = await fetch(ANTHROPIC_API_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1024,
          system: buildSystemPrompt(persona),
          tools: TOOLS,
          messages: conversation,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json({ error: `Anthropic API error: ${text}` }, { status: 502 });
      }

      const data = await res.json();
      const assistantMessage = { role: "assistant", content: data.content };
      conversation = [...conversation, assistantMessage];

      if (data.stop_reason !== "tool_use") {
        const textBlock = data.content.find((b) => b.type === "text");
        return NextResponse.json({
          reply: textBlock ? textBlock.text : "",
          messages: conversation,
        });
      }

      const toolUseBlocks = data.content.filter((b) => b.type === "tool_use");
      const toolResults = [];
      for (const block of toolUseBlocks) {
        const result = await runTool(block.name, block.input);
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      }
      conversation = [...conversation, { role: "user", content: toolResults }];
    }

    return NextResponse.json(
      { error: "The concierge took too many steps to answer — please rephrase your question." },
      { status: 502 }
    );
  } catch (err) {
    return NextResponse.json({ error: `Concierge request failed: ${err.message}` }, { status: 500 });
  }
}
