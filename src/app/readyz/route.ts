export const dynamic = "force-dynamic";

/** Readiness probe for hosting/preview environments. Unauthenticated, side-effect free. */
export function GET() {
  return new Response("ok", { status: 200, headers: { "Cache-Control": "no-store" } });
}