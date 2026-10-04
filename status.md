# Hotel System: Project Status
Last updated: 2026-10-04T03:30:00+03:00 | Current phase: 10 (done) | Overall: v1.0.0 feature-complete in mock mode

> Read `MASTERPROMPT.md` first (product truth), then this file (progress truth).

## How to Run (always current)
```bash
npm install
npm run dev          # zero keys, MOCK_MODE
npm run check        # tsc + eslint + vitest (100 tests)
npm run build && npm run start
npm run e2e          # 3 Playwright journeys against :3000
```
Settings → "Rudisha data ya demo" re-seeds the demo. `/onboarding` creates a fresh hotel instead.

## Phase Progress
- [x] 0 Foundation: scaffold, TS strict, Tailwind 4 tokens, i18n, Netlify config
- [x] 1 Data core: Drizzle schema + RLS, deterministic seed, on-device store, selectors, app shell
- [x] 2 Madeni + Mauzo + Matumizi + SMS outbox
- [x] 3 Msaidizi:
  - Rule parser covering all §6.3 utterances, plus prefix quantities ("2 chapati").
  - 18 tools with confirmation above KSh 5,000.
  - Anthropic tool loop through the stateless `/api/ai/chat`, and Whisper `/api/ai/transcribe`.
  - Floating launcher.
  - Evening Pulse, Morning Brief and debt nudges, with 1-tap approve and cron.
- [x] 4 Money layer:
  - Daraja parsers with mock/live adapters.
  - C2B/STK routes.
  - Idempotent `ingestMpesa` with auto-match.
  - Reconcile inbox.
  - SMS (Africa's Talking) and WhatsApp (Cloud API) adapters, webhook and simulator.
- [x] 5 Ops:
  - Zaidi hub.
  - Menu CRUD with photos.
  - Mpango wa Kesho, including sold-out times, waste and money left on the table.
  - Stock, Wasambazaji, Wafanyakazi (shifts, wages).
  - PIN lock.
- [x] 6 Public menu `/m/[slug]`: checkout, STK modal, order tracker, A5 QR poster. New-order ding and notification.
- [x] 7 Ripoti:
  - Leo/Wiki/Mwezi/Custom periods with deltas.
  - 7 Recharts views and CSV export.
  - A4 Bank/SACCO statement.
- [x] 8 Landing:
  - R3F night-market hero (lazy, lite on phones, static fallback).
  - GSAP problem storyboard and Magic scene.
  - Bento demos, numbers, personas, pricing.
  - 5-step onboarding with confetti and a first-run tour.
- [x] 9 PWA/offline:
  - IndexedDB sync queue, `/api/sync`, pending chip.
  - Precached shell and PNG icons.
  - App-wide reduced-motion support.
- [x] 10 Hardening: README, COMPLETION_REPORT.md, e2e green, tag v1.0.0

## Decisions Log
| Date | Decision | Why |
|---|---|---|
| 2026-09-28 | Mobile-app-first everywhere: bottom tabs, thumb-zone FAB/sheets, 44–56px targets | Owner addendum §0 |
| 2026-09-28 | MOCK_MODE persistence = on-device Zustand + localStorage (not SQLite) | Netlify has no persistent disk; makes offline real. Supabase is live backend |
| 2026-09-28 | Business day starts 05:00 | Hotels trade past midnight |
| 2026-09-28 | Profit = cash + M-Pesa + credit sales − expenses | Credit sales are earned revenue |
| 2026-09-28 | Debt payments allocate oldest-first; overpay guarded | Matches the daftari mental model |
| 2026-09-28 | Demo re-seeds when snapshot > 2 days old (only before onboarding) | Keeps demo fresh; never wipes a real hotel |
| 2026-10-04 | shadcn/ui NOT adopted; hand-rolled Jikoni primitives (BottomSheet, Segmented, Keypad, Toast, Field) | Already built, accessible, on-brand; avoids a mid-build restyle. Can migrate later without API changes |
| 2026-10-04 | AI tools execute on the client; `/api/ai/chat` is a stateless proxy | Data lives on-device in mock/offline mode; same tool code serves offline and live agents |
| 2026-10-04 | Offline queue mirrors money mutations (sale/debt/payment/expense) to `/api/sync`, idempotent by op id | Safe retries; server can rebuild ledger in live mode |
| 2026-10-04 | "chapati na madondo" resolves to the combo dish (longest alias wins) | Matches how customers order |
| 2026-10-04 | Landing hero: photo first, 3D faded in after load | LCP budget; reduced-motion/no-WebGL keep the photo |

## Environment Variables
See `.env.example` and README → "Mock mode vs live mode". Every integration has a mock.

## Known Issues / Limitations
- Live integrations (Anthropic, Whisper, Daraja, Africa's Talking, WhatsApp, Supabase) are implemented against their documented APIs. They are unit-tested at the parser level only and still need real keys to run end to end.
- In live mode the client still reads from the on-device store. Server data is written via `/api/sync` and the M-Pesa routes. A server-side read repository is the next step for multi-device hotels.
- Not done yet:
  - Receipt photo attachment on Matumizi.
  - Virtualization for very long sales lists (it uses "show more" paging).
  - A Lighthouse run (budgets were designed for, not measured).

## What Remains (next)
1. Supabase read repository and auth (phone OTP) for multi-device live mode.
2. Run Lighthouse and tune it.
3. Matumizi receipt photos.