export const dynamic = "force-dynamic";

/** Which live AI capabilities this deployment has (no secrets exposed). */
export function GET() {
  return Response.json({ chat: !!process.env.ANTHROPIC_API_KEY, voice: !!process.env.OPENAI_API_KEY }, { headers: { "Cache-Control": "no-store" } });
}