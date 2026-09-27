/** Canned Whisper transcripts for MOCK_MODE voice notes (§6.4). Rotates deterministically. */
export const MOCK_TRANSCRIPTS = [
  "Nimeuza ugali samaki mbili na chai moja, cash",
  "Andika deni ya Otieno mia mbili hamsini",
  "Leo nimepataje?",
  "Nimenunua nyama elfu mbili na sukuma mia tatu",
  "Wali imeisha",
  "Mafuta imebaki lita ngapi?",
  "Otieno amelipa deni yote",
  "Nani ananidai?",
] as const;
let i = 0;
export function nextMockTranscript(): string {
  const t = MOCK_TRANSCRIPTS[i % MOCK_TRANSCRIPTS.length]!;
  i++;
  return t;
}
