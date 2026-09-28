# Hotel System — Project Status
Last updated: 2026-09-28T02:30:00+03:00 | Current phase: 2 → 3 | Overall: ~35% complete

> Read `MASTERPROMPT.md` first (product truth), then this file (progress truth).

## How to Run (always current)
```bash
npm install
npm run dev          # http://localhost:3000 → landing, /dashboard → app (zero keys, MOCK_MODE)
npm run check        # typecheck + lint + vitest
npm run e2e          # Playwright (Pixel 7 viewport)
```
Best viewed on a phone or Chrome DevTools mobile emulation. Settings → "Rudisha data ya demo" re-seeds.

## ⚠️ FIRST ACTION FOR THE NEXT SESSION
This code was authored in an environment without npm registry access, so `npm install` / `npm run build`
have NOT been executed yet. The pure logic (money, parseSwahiliAmount, intent parser, debt engine,
auto-match, planner, seed) WAS executed and verified with Node 22 (all §6.3 utterances pass).
1. `npm install && npm run check && npm run build` and fix any type/lint errors.
2. `npx shadcn@latest init` (Tailwind v4 mode) and migrate BottomSheet/Segmented/Toast onto shadcn
   primitives (Drawer/Tabs/Sonner) keeping the Jikoni look.
3. Then continue at Phase 3b below.

## Architecture Snapshot
- Next.js 15 App Router, one app. Mobile-first PWA: bottom tab bar (Leo, Mauzo, Madeni, Oda, Msaidizi), thumb-zone FAB + bottom sheets; desktop gets a sidebar.
- MOCK_MODE data = on-device Zustand store persisted to localStorage (`src/lib/store/app-store.ts`), seeded deterministically (`seed.ts`). Works offline and on Netlify with zero backend.
- Live mode = Supabase Postgres via Drizzle (`src/lib/db/schema.ts`, RLS in `drizzle/0001_rls.sql`). Repository layer to be added in Phase 4.
- Brain = rule-based Swahili/Sheng parser (`src/lib/ai/intents.ts`) + offline agent executing tools against the store (`offline-agent.ts`). Anthropic adapter will call the same tools.
- Pure domain modules (`src/lib/domain/*`): debts (oldest-first allocation, overpay guard, aging, SMS copy), automatch (M-Pesa), planner (plan_tomorrow, money-left-on-table).
- Design system "Jikoni": tokens in `src/styles/tokens.css`, motion in `src/lib/motion.ts`, i18n sw/en in `src/lib/i18n`.

## Phase Progress
- [x] Phase 0: Foundation — scaffold, TS strict (`noUncheckedIndexedAccess`), Tailwind 4 tokens, i18n, .env.example, Netlify config, MASTERPROMPT.md
  - [ ] shadcn CLI init (needs network) ← do first next session
- [x] Phase 1: Data core — full Drizzle schema (§5), RLS migration, deterministic seed (1 hotel, 14 menu items, 25 customers, 60 days sales ≈2.8k, 18 debts, 60 days expenses, 6 suppliers, 10 inventory, 12 orders, 330 M-Pesa txns), mock session shim (on-device), app shell, page transitions, dark/light
- [x] Phase 2: Madeni flagship + Mauzo + Matumizi
  - [x] Madeni: summary header, aging tabs (30d+ red), debtor cards w/ swipe-right pay / swipe-left SMS remind, history timeline sheet, payment sheet w/ custom keypad + Cash/M-Pesa, confetti + "Deni Limelipwa!" stamp, auto SMS receipt to outbox, new debt ≤3 taps
  - [x] Mauzo: POS photo-tile grid, running total bar in thumb zone, method toggle, "Weka kwa deni", day-grouped history w/ filters
  - [x] Matumizi: Soko ya Leo chips w/ 14-day sparkline + week-over-week %, keypad sheet, category donut, recent list
  - [x] SMS Outbox screen (`/dashboard/settings/outbox`)
  - [ ] Receipt photo attach (Matumizi)
  - [ ] Virtualized sales list (currently paged "show more")
  - [x] E2E test #2 written (`tests/e2e/madeni.spec.ts`), not yet run
- [ ] Phase 3: Msaidizi AI — IN PROGRESS
  - [x] parseSwahiliAmount + intent parser, 38 unit cases incl. all §6.3 utterances
  - [x] Offline agent w/ tools: log_sale, log_debt, record_debt_payment, log_expense, get_daily_summary, get_week_report, get_debts_report, set_item_soldout, check_stock, get_best_sellers, plan_tomorrow, send_debt_reminder; >KES 5,000 confirmation
  - [x] Chat UI: tool-activity chips, rich P&L / receipt / debts / list cards, suggestion pills, hold-to-record mic w/ animated waveform (mock transcripts)
  - [ ] ← CURRENTLY HERE: `src/lib/ai/agent.ts` Anthropic tool-use loop + `prompts.ts`; `/api/ai/chat` (streaming) and `/api/ai/transcribe` (Whisper, language "sw")
  - [ ] Floating Msaidizi launcher on every dashboard page
  - [ ] Remaining tools: get_customer_profile, update_stock, create_order, add_menu_item, log_supplier_purchase, search_anything
  - [ ] `/api/cron/daily`: 18:30 Evening Pulse, 05:30 Morning Brief, debt nudges w/ 1-tap approve
- [ ] Phase 4: Money layer — integrations/mpesa (adapter/mock/live), `/api/mpesa/c2b/confirm|validate`, `/api/mpesa/stk/push|callback`, Reconcile inbox w/ one-tap suggestions (automatch engine + simulator already exist; simulator button lives in Settings)
- [ ] Phase 5: Menu CRUD + Mpango wa Kesho planner UI (planner logic done), Stock, Wasambazaji, Wafanyakazi (+ staff PIN lock screen)
- [ ] Phase 6: Public menu `/m/[slug]`, checkout + STK modal, order tracker, QR A5 poster; E2E #3 (Oda queue + ding already built)
- [ ] Phase 7: Ripoti (Recharts) + CSV + print Bank Statement
- [ ] Phase 8: Cinematic landing (R3F jiko/sufuria vignette, GSAP ScrollTrigger scenes, bento, testimonials, pricing) + onboarding wizard; E2E #1
- [ ] Phase 9: IndexedDB offline queue + sync (chip already wired to `pendingSync`), WhatsApp webhook + simulator, polish pass
- [ ] Phase 10: Hardening, Lighthouse, README diagram, COMPLETION_REPORT.md, tag v1.0.0

## Decisions Log
| Date | Decision | Why |
|---|---|---|
| 2026-09-28 | Mobile-app-first everywhere: bottom tabs, thumb-zone FAB/sheets, 44–56px targets, headers carry info not actions | Owner addendum in MASTERPROMPT §0 |
| 2026-09-28 | MOCK_MODE persistence = on-device Zustand + localStorage instead of SQLite | Netlify functions have no persistent disk and better-sqlite3 needs native builds; on-device data also makes the offline story real. Supabase is the live backend. |
| 2026-09-28 | Business day starts 05:00 local | Hotels trade past midnight; opening the app at 2am shows yesterday instead of an empty day |
| 2026-09-28 | Profit = cash + M-Pesa + food sold on credit − expenses | Credit sales are earned revenue; outstanding debt is tracked separately in Madeni |
| 2026-09-28 | Debt payments allocate oldest-first; overpay throws unless explicitly allowed | Matches how owners reason about a daftari; prevents fat-finger entries |
| 2026-09-28 | Demo store re-seeds when snapshot > 2 days old | Keeps the demo alive; must be disabled in live mode |
| 2026-09-28 | Order ding synthesized with WebAudio | No binary asset needed; `public/sounds/` optional later |
| 2026-09-28 | Fonts: Inter via next/font, Clash Display via Fontshare CSS | Per §9.4 |
| 2026-09-28 | Staff role cannot read expenses (RLS) | §1.4: staff log sales only, no reports |

## Environment Variables Needed
| Var | Purpose | Mock available? |
|---|---|---|
| MOCK_MODE / NEXT_PUBLIC_MOCK_MODE | Zero-key demo mode | n/a (default true) |
| NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL | Live DB/Auth | Yes (on-device store) |
| ANTHROPIC_API_KEY, ANTHROPIC_MODEL | LLM brain | Yes (rule-based parser) |
| OPENAI_API_KEY | Whisper voice notes | Yes (canned transcripts) |
| MPESA_* | Daraja C2B + STK | Yes (simulator) |
| AT_USERNAME, AT_API_KEY, AT_SENDER_ID | SMS | Yes (outbox) |
| WHATSAPP_* | WhatsApp Cloud API | Planned (simulator, Phase 9) |
| CRON_SECRET | Protect /api/cron/daily | n/a |

## Known Issues / TODO
- Build/lint not yet executed (see FIRST ACTION).
- shadcn/ui not installed yet; current primitives are hand-rolled in `src/components/ui`.
- Sale quantities written before the item ("2 chapati") parse as qty 1; Swahili order ("chapati mbili") works. Add prefix-number support.
- "What should I cook tomorrow" (cook before tomorrow) isn't matched; "Plan for tomorrow" / "Kesho nipike nini" are.
- Reference images from the original brief were not attached to the repo; add to `/docs/reference/` if available.

## What Remains (ordered)
1. Install + green `npm run check` / `build`; shadcn init.
2. Phase 3b: Anthropic agent + API routes + cron + floating launcher.
3. Phase 4 money layer; 5 ops screens; 6 public menu; 7 reports; 8 landing/3D/onboarding; 9 offline queue + WhatsApp + polish; 10 hardening + COMPLETION_REPORT.md.
