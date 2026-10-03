export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Voice note → Whisper (language "sw") → text (§6.4). 501 without OPENAI_API_KEY → client uses mock transcripts. */
export async function POST(req: Request) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return Response.json({ error: "voice_unavailable" }, { status: 501 });
  const form = await req.formData().catch(() => null);
  const audio = form?.get("audio");
  if (!(audio instanceof Blob)) return Response.json({ error: "no_audio" }, { status: 400 });
  if (audio.size > 10 * 1024 * 1024) return Response.json({ error: "too_large" }, { status: 413 });
  const fd = new FormData();
  fd.append("file", audio, "note.webm");
  fd.append("model", process.env.OPENAI_TRANSCRIBE_MODEL || "whisper-1");
  fd.append("language", "sw");
  fd.append("prompt", "Nimeuza chapati, ugali samaki, sukuma, madondo, chai. Deni ya Otieno mia mbili hamsini. M-Pesa, cash, elfu.");
  const r = await fetch("https://api.openai.com/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: fd });
  if (!r.ok) return Response.json({ error: "transcribe_failed" }, { status: 502 });
  const j = (await r.json()) as { text?: string };
  return Response.json({ text: j.text ?? "" });
}