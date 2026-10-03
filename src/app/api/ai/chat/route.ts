import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages/messages";
import { z } from "zod";
import { TOOL_DEFS } from "@/lib/ai/tool-defs";
import { systemPrompt } from "@/lib/ai/prompts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.union([z.string().max(4000), z.array(z.record(z.string(), z.unknown())).max(24)]),
  })).min(1).max(40),
  context: z.object({ hotelName: z.string().max(80), ownerName: z.string().max(80), tillNumber: z.string().max(20), nowIso: z.string().max(40), lang: z.enum(["sw", "en"]) }),
});

/** Stateless Anthropic proxy. Tools run on the client (src/lib/ai/tools.ts). 501 = no key → offline agent. */
export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return Response.json({ error: "llm_unavailable" }, { status: 501 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad_request" }, { status: 400 });
  try {
    const client = new Anthropic({ apiKey: key });
    const res = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
      max_tokens: 1024,
      system: systemPrompt(parsed.data.context),
      tools: TOOL_DEFS,
      messages: parsed.data.messages as MessageParam[],
    });
    return Response.json({ content: res.content, stop_reason: res.stop_reason });
  } catch (e) {
    console.error("[ai/chat]", e);
    return Response.json({ error: "llm_failed" }, { status: 502 });
  }
}