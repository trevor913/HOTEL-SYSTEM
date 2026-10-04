import { liveMpesa, mpesaConfigured } from "./live";
import { mockMpesa } from "./mock";
import type { MpesaAdapter } from "./types";

/** Live only when MOCK_MODE=false AND Daraja keys exist; otherwise the mock. */
export function mpesa(): MpesaAdapter {
  return process.env.MOCK_MODE === "false" && mpesaConfigured() ? liveMpesa : mockMpesa;
}

/** Optional shared secret appended to callback URLs (Daraja does not sign webhooks). */
export function webhookAuthorized(req: Request): boolean {
  const secret = process.env.MPESA_WEBHOOK_SECRET;
  return !secret || new URL(req.url).searchParams.get("secret") === secret;
}