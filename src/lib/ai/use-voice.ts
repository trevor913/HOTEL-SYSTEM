"use client";
import { useRef, useState } from "react";
import { liveStatus } from "./agent";
import { nextMockTranscript } from "./transcripts";

/** Hold-to-record voice note (§6.4). Live: MediaRecorder → /api/ai/transcribe (Whisper, sw). Mock: canned transcripts. */
export function useVoice(onText: (text: string) => void) {
  const [recording, setRecording] = useState(false);
  const active = useRef(false);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  const start = async () => {
    if (active.current) return;
    active.current = true;
    setRecording(true);
    if ("vibrate" in navigator) navigator.vibrate(12);
    const st = await liveStatus();
    if (!st.voice || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!active.current) { stream.getTracks().forEach((x) => x.stop()); return; }
      const mr = new MediaRecorder(stream);
      chunks.current = [];
      mr.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
      mr.start();
      rec.current = mr;
    } catch { /* permission denied → mock transcript on release */ }
  };

  const stop = async () => {
    if (!active.current) return;
    active.current = false;
    setRecording(false);
    const mr = rec.current;
    rec.current = null;
    if (!mr) { onText(nextMockTranscript()); return; }
    const blob = await new Promise<Blob>((res) => { mr.onstop = () => res(new Blob(chunks.current, { type: mr.mimeType || "audio/webm" })); mr.stop(); });
    mr.stream.getTracks().forEach((x) => x.stop());
    onText((await transcribe(blob)) ?? nextMockTranscript());
  };

  return { recording, start, stop };
}

async function transcribe(blob: Blob): Promise<string | null> {
  try {
    const fd = new FormData();
    fd.append("audio", blob, "note.webm");
    const r = await fetch("/api/ai/transcribe", { method: "POST", body: fd });
    if (!r.ok) return null;
    const j = (await r.json()) as { text?: string };
    return j.text?.trim() || null;
  } catch { return null; }
}