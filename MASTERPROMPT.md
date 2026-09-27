# Current identity

Application: **Hotel System**. Hotel: **Nourish Hotel**. Owner: **Mama Mary**.

# Hotel System — MASTER BUILD PROMPT
### The Operating System for Kenya's Hotel Food Hotels
**Version 1.0 — Autonomous Build Directive**

> READ THIS FILE BEFORE EVERY WORK SESSION. It is the single source of product truth.
> `status.md` is the single source of *progress* truth. If context is compacted, re-read both.

---

## 0. OWNER ADDENDUM (added by Trevor, overrides anything below where they conflict)

1. **This is a MOBILE APP, not a web app.** Design every screen for a phone first: mobile screen
   design, spacing, native-feeling gestures, bottom sheets, bottom tab bar, safe-area insets,
   44–48px min touch targets, and the **Thumb Rule**: every primary action must sit in the
   bottom 40% of the screen (thumb zone). Headers carry info, not actions. FAB + bottom sheets
   carry actions. Desktop is a graceful secondary layout, never the design target.
2. **Hosting:** Netlify (frontend + Next.js functions) and **Supabase** (Postgres, Auth, Storage).
   Build the full app first; deployment happens after completion.
3. **Skills / design references to follow:**
   - GSAP skills — https://github.com/greensock/gsap-skills
   - Material 3 skill — https://github.com/hamen/material-3-skill (use M3 motion/elevation/touch
     principles, NOT the default M3 look; Jikoni tokens win)
   - frontend-ui-ux — https://github.com/code-yeongyu/oh-my-openagent (skill: frontend-ui-ux)
   - premium-frontend-ui — https://github.com/github/awesome-copilot (skill: premium-frontend-ui)
   - Anthropic frontend-design skill — https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md
   - shadcn skill — https://github.com/shadcn-ui/ui/blob/main/skills/shadcn/SKILL.md
4. **Reference images** were shared with the original prompt (6 uploads). If they are available
   locally, store them in `/docs/reference/` and check them each session.
5. Do not ask the owner anything. Decide, log it in status.md, keep building.

---

# /goal — PRIME DIRECTIVE

You are the sole engineer, architect, designer, and product owner of this project.
Mission: **Build the ENTIRE Hotel System platform described in this document, end to end,
autonomously, without asking the human for input**, except for the 3 cases below.

RULES OF AUTONOMY:
1. **Do NOT ask questions.** If something is ambiguous, make the most professional decision
   consistent with this document, record it in `status.md` under "Decisions Log", and continue.
2. **Only stop and ask when:** (a) a real secret/API key is needed AND mock mode (§12) cannot
   cover it, (b) a paid account action is required, or (c) everything is FINISHED.
3. **Work in phases (§14).** Complete each phase fully (code, styling, tests, seed data).
4. **After EVERY meaningful unit of work**, update `status.md` (§2) and commit with a
   conventional-commit message (`feat:`, `fix:`, `style:`, `docs:`, `chore:`).
5. **The build must RUN.** End of every phase: `npm run build` passes, dev server starts, key
   routes verified.
6. **Never ship placeholder junk.** No lorem ipsum, no "Coming soon", no empty pages, no broken
   links, no default favicons. Realistic Kenyan data everywhere.
7. When 100% complete, write `COMPLETION_REPORT.md` (features, run, deploy, keys needed).

---

# 1. PROJECT VISION & CONTEXT

## 1.1 What is a Hotel?
A small, informal, open-air or semi-permanent food hotel in Kenya, run by "Mama Hotel" or
"Baba Hotel". Affordable local food: ugali, sukuma wiki, beans (madondo), githeri, chapati,
rice (wali), pilau, matumbo, beef stew, fried fish (samaki), ndengu, mandazi, chai, uji.
Everything runs on **memory, a paper exercise book (daftari), cash, and M-Pesa on a personal phone**.

## 1.2 The Pain (priority order)
1. **MADENI (customer debts)** — forgotten, disputed, lost. 10–20% revenue leak. Heart of the product.
2. **No daily profit visibility.**
3. **M-Pesa reconciliation** — manual matching; staff pocket cash.
4. **Food planning guesswork** — spoilage vs lost sales.
5. Supplier credit chaos, stock blindness (gas, unga, oil), staff wages, no order channel,
   no records for SACCO/bank loans.

## 1.3 The Product — three layers
- **Layer A — The Owner's Brain**: conversational AI (in-app chat + WhatsApp webhook-ready),
  Swahili/Sheng/English, text AND voice notes. Log sales/debts/expenses, answer
  "leo nimepataje?", evening summaries, morning shopping lists, debt reminders.
- **Layer B — The Money Layer**: M-Pesa Daraja (C2B confirmation webhooks + STK Push),
  auto-reconciliation, cash-vs-M-Pesa leakage detection.
- **Layer C — Customer-Facing**: public digital menu per hotel (QR), WhatsApp-style ordering,
  order queue, delivery tracking, loyalty.

## 1.4 Users
- **Owner** — smartphone, WhatsApp-fluent, busy, non-technical. Primary user.
- **Staff** — limited (log sales only, no reports).
- **Customer** — public menu, ordering, debt-balance SMS receipts. No login.
- **Admin** — super-admin view of all hotels (multi-tenant).

## 1.5 Language
Bilingual EN + SW, Swahili-first money labels: Mauzo (sales), Matumizi (expenses), Madeni
(debts), Faida (profit), Soko (market), Karo (wages), Akiba (savings). Proper i18n, no
hardcoded strings.

---

# 2. STATUS.MD PROTOCOL (MANDATORY)

`status.md` at repo root, created BEFORE code. Any agent must be able to pick up cold:

```md
# Hotel System — Project Status
Last updated: <ISO> | Current phase: <N> | Overall: <X>% complete
## How to Run (always current)
## Architecture Snapshot
## Phase Progress   (- [x] done (commit), - [ ] sub-task ← CURRENTLY HERE)
## Decisions Log    | Date | Decision | Why |
## Environment Variables Needed | Var | Purpose | Mock available? |
## Known Issues / TODO
## What Remains (ordered)
```
Update after every sub-task. Never let it drift.

---

# 3. TECH STACK (EXACT)

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript, `src/`) |
| Styling | Tailwind CSS v4 + CSS custom-property tokens |
| Components | shadcn/ui (heavily customized, never default look) |
| Animation | Framer Motion (motion) + GSAP ScrollTrigger (landing) |
| 3D | React Three Fiber + drei |
| Charts | Recharts (custom theme) |
| State | Zustand + TanStack Query v5 |
| DB & Auth | Supabase (Postgres + RLS + Auth phone/email) |
| ORM | Drizzle ORM, SQL migrations in `/drizzle` |
| AI | Anthropic API (claude-sonnet-4-5 or latest) tool-use; OpenAI Whisper for Swahili voice |
| Payments | Safaricom Daraja (sandbox): C2B register/confirm/validate + STK Push |
| SMS | Africa's Talking (sandbox) |
| WhatsApp | Meta WhatsApp Cloud API webhook (mock-tested) |
| PWA | manifest + service worker (installable, offline shell) |
| Testing | Vitest (money, debt engine, intent parser) + Playwright (3 smoke E2E) |
| Quality | ESLint + Prettier + strict TS (`noUncheckedIndexedAccess: true`) |

**MOCK-FIRST RULE:** every external service has a mock adapter selected by env var so the
whole app demos with zero keys. Real adapters behind the same interface. `MOCK_MODE=true` default.

---

# 4. REPOSITORY STRUCTURE

```
├── MASTERPROMPT.md  status.md  COMPLETION_REPORT.md  README.md  .env.example
├── drizzle/                   # SQL migrations (+ RLS policies)
├── public/                    # icons, manifest, og-image, sounds
├── src/
│   ├── app/
│   │   ├── (marketing)/page.tsx
│   │   ├── (auth)/login, register, onboarding/
│   │   ├── (dashboard)/dashboard/  page.tsx (Leo), mauzo/, madeni/, matumizi/, menu/, stock/,
│   │   │                           wasambazaji/, wafanyakazi/, oda/, ripoti/, msaidizi/, settings/
│   │   ├── m/[slug]/page.tsx       # PUBLIC customer menu
│   │   ├── m/[slug]/order/[id]/    # public order tracking
│   │   └── api/ ai/chat, ai/transcribe, mpesa/c2b/confirm|validate, mpesa/stk/push|callback,
│   │            whatsapp/webhook, sms/send, sms/reminders/cron, cron/daily, orders, debts, sales
│   ├── components/ (ui/, dashboard/, landing/, three/, charts/, chat/)
│   ├── lib/
│   │   ├── db/ (schema.ts, queries/)
│   │   ├── ai/ (agent.ts, tools.ts, intents.ts, prompts.ts, transcribe.ts)
│   │   ├── integrations/ (mpesa/, sms/, whatsapp/ — adapter.ts, mock.ts, live.ts)
│   │   ├── i18n/ (en.ts, sw.ts, index.ts)
│   │   └── utils/ (money.ts integer cents ONLY, dates.ts, phone.ts 2547XX normalize)
│   └── styles/ (globals.css, tokens.css)
└── tests/ (unit/, e2e/)
```

---

# 5. DATABASE SCHEMA

Money = **integer cents (KES × 100)**. Phones = `2547XXXXXXXX`. Every tenant table has
`hotel_id` + RLS (owner sees own hotel only).

```
hotels          id, slug (unique), name, tagline, owner_id, phone, till_number, location_text,
                lat, lng, logo_url, currency='KES', open_hours jsonb, settings jsonb, created_at
profiles        id (auth uid), hotel_id, full_name, phone, role('owner','staff','admin'),
                avatar_url, pin_hash, created_at
customers       id, hotel_id, name, nickname, phone, photo_url, notes, total_spent_cents,
                visit_count, loyalty_points, last_seen_at, created_at
debts           id, hotel_id, customer_id, amount_cents, balance_cents,
                status('open','partial','paid','written_off'), description, items jsonb,
                due_date, created_by, created_at, settled_at
debt_payments   id, debt_id, amount_cents, method('cash','mpesa','other'), mpesa_tx_id, note, created_at
menu_items      id, hotel_id, name, name_sw, category('breakfast','main','side','drink','snack'),
                price_cents, image_url, is_available, sort_order, created_at
daily_menus     id, hotel_id, date, item_id, planned_qty, cooked_qty, sold_qty, soldout_at, waste_qty, notes
sales           id, hotel_id, customer_id?, staff_id, total_cents, payment_method('cash','mpesa',
                'debt','split'), mpesa_tx_id, channel('walk_in','whatsapp','phone','app'), note, created_at
sale_items      id, sale_id, menu_item_id, qty, unit_price_cents, line_total_cents
expenses        id, hotel_id, category('soko','gas','charcoal','rent','wages','transport','license',
                'equipment','other'), description, amount_cents, supplier_id?, receipt_photo_url,
                incurred_on, created_by, created_at
suppliers       id, hotel_id, name, phone, what_they_supply, balance_owed_cents, created_at
supplier_txns   id, supplier_id, type('purchase','payment'), amount_cents, note, created_at
inventory_items id, hotel_id, name, unit('kg','ltr','pcs','sack','cylinder'), current_qty,
                low_threshold, last_price_cents, created_at
stock_moves     id, inventory_item_id, delta, reason('purchase','usage','waste','adjust'), note, created_at
orders          id, hotel_id, customer_id, code ('KB-1042'), status('new','confirmed','preparing',
                'ready','out_for_delivery','delivered','cancelled'), type('pickup','delivery'),
                address_text, total_cents, payment_status('unpaid','paid','pay_on_delivery'),
                mpesa_tx_id, rider_name, rider_phone, placed_via('public_menu','whatsapp','manual'),
                created_at, updated_at
order_items     id, order_id, menu_item_id, qty, unit_price_cents
mpesa_txns      id, hotel_id, provider_tx_id (unique), type('c2b','stk'), phone, amount_cents,
                payer_name, raw jsonb, matched_entity('sale','debt','order'), matched_id,
                status('unmatched','matched','ignored'), created_at
staff_shifts    id, hotel_id, staff_id, date, present, wage_cents, paid, note
ai_messages     id, hotel_id, user_id, role('user','assistant','tool'), content, audio_url,
                intent, tool_calls jsonb, created_at
notifications   id, hotel_id, kind, title, body, read, created_at
audit_log       id, hotel_id, actor_id, action, entity, entity_id, diff jsonb, created_at
```

**Seed data (mandatory):** 1 hotel "Nourish Hotel" (slug `nourish-hotel`), 14 menu items with
real Kenyan prices (Ugali Beef 180/=, Chapati 20/=, Madondo 80/=, Pilau 150/=, Chai 30/=,
Samaki Wet Fry 250/= …), 25 customers with Kenyan names, 60 days of sales with weekday/
Friday-pilau patterns, 18 debts in mixed states, 60 days expenses, 6 suppliers, 10 inventory
items, 12 orders in various states, 200+ mock M-Pesa txns. The demo must feel ALIVE.

---

# 6. THE AI ASSISTANT — "MSAIDIZI"

## 6.1 Architecture
`src/lib/ai/agent.ts`: Anthropic tool-use loop. System prompt in `prompts.ts`: persona
"Msaidizi wa Hotel System" — sharp, warm, trustworthy Kenyan business assistant; mirrors
Swahili/Sheng/English; ALWAYS confirms money actions > KES 5,000 before committing; NEVER
invents figures (always calls tools); money formatted "KSh 1,250".

## 6.2 Tools
`log_sale`, `log_debt`, `record_debt_payment`, `log_expense`, `get_daily_summary`,
`get_debts_report` (aging buckets), `get_customer_profile`, `check_stock`, `update_stock`,
`get_best_sellers`, `plan_tomorrow`, `send_debt_reminder`, `create_order`, `get_week_report`,
`add_menu_item`, `set_item_soldout`, `log_supplier_purchase`, `search_anything`.

## 6.3 Swahili/Sheng — EXACT utterances that must pass unit tests
- "Nimeuza ugali samaki mbili na chai moja, cash" → sale: 2× Ugali Samaki + 1× Chai, cash
- "Andika deni ya Otieno mia mbili hamsini" → debt: Otieno, KSh 250
- "Otieno amelipa deni yote" → settle Otieno's balance
- "Nimenunua nyama elfu mbili na sukuma mia tatu" → expenses: meat 2000, sukuma 300
- "Leo nimepataje?" → daily summary (mauzo, matumizi, madeni mpya, faida)
- "Nani ananidai... eeh, nani nina madeni yao?" → debts report
- "Wali imeisha" → mark rice sold out today
- "Mafuta imebaki lita ngapi?" → stock check
Swahili number words (mia, elfu, hamsini…) must parse: `parseSwahiliAmount()` with tests.

## 6.4 Voice notes
`/api/ai/transcribe`: audio → Whisper (`language: 'sw'`) → text → agent. Mock: canned transcripts.

## 6.5 Proactive intelligence (`/api/cron/daily`, manual button too)
- **18:30 Evening Pulse**: daily P&L narrative → notification + (mock) WhatsApp
- **05:30 Morning Brief**: shopping list from usage + low stock + today's plan
- **Debt nudges**: debts > 7 days → polite Swahili SMS ("Habari Otieno! Kumbusho ya deni KSh 250
  ya Mama Mary's. Lipa kwa M-Pesa Till 832100. Asante! 🙏") — owner approves with 1 tap.

## 6.6 Chat UI (`msaidizi/` + floating launcher on every dashboard page)
Streaming, tool-call chips ("📒 Naandika deni…"), hold-to-record voice with animated waveform,
suggestion pills ("Leo nimepataje?", "Madeni yote", "Ongeza mauzo"), Kenyan-time greetings.
Rich cards: mini P&L card for summaries; receipt-style cards for debts.

---

# 7. INTEGRATIONS (adapter pattern: mock.ts + live.ts behind one interface)

## 7.1 M-Pesa Daraja
- `POST /api/mpesa/c2b/confirm` + `/validate`: upsert `mpesa_txns` → auto-match (phone→customer,
  amount→open order/debt); unmatched go to a "Reconcile" inbox with one-tap suggestions.
- `POST /api/mpesa/stk/push`; `/stk/callback` finalizes.
- Live: OAuth token caching, sandbox URLs, env shortcode/passkey.
- Mock: "Simulate M-Pesa payment" button in Reconcile fires a fake C2B webhook.

## 7.2 Africa's Talking SMS — receipts, reminders, order updates. Mock → "SMS Outbox" at
`/dashboard/settings/outbox`.

## 7.3 WhatsApp Cloud API — `GET /api/whatsapp/webhook` (verify) + `POST` (→ same agent).
Mock: "WhatsApp Simulator" at `/dashboard/settings/whatsapp-sim` (beautiful WhatsApp-look chat).

---

# 8. FEATURE SPECS — SCREEN BY SCREEN

Mobile-first, thumb-reachable actions, bottom tab bar (Home, Mauzo, Madeni, Oda, Msaidizi) +
collapsible sidebar on desktop.

## 8.1 Home — "Leo"
Animated hero stats (Mauzo ya Leo, Matumizi, Faida green/red, Madeni Mpya); "Faida Meter"
radial SVG gauge vs 7-day avg; live feed of last 10 events (staggered); sold-out alerts,
low-stock chips, pending orders pulse; floating "＋" speed-dial (Sale / Debt / Expense / Voice).

## 8.2 Madeni (FLAGSHIP — extraordinary)
Summary header (outstanding, # debtors, oldest age, recovered this week). Aging tabs Zote /
0–7d / 8–30d / 30d+ (red accents). Debtor cards: initials avatar w/ warm color hash, name, big
tabular balance, age badge, last payment; swipe-right = pay, swipe-left = remind; tap →
timeline. Payment bottom sheet: custom big keypad w/ press animations, Cash/M-Pesa toggle;
full settle → **confetti + "Deni Limelipwa! 🎉" stamp** + auto SMS receipt (outbox).
New debt ≤ 3 taps.

## 8.3 Mauzo
POS grid of photo tiles, running total bar, payment selector, "Weka kwa deni" shortcut.
Day-grouped virtualized list; filter by method/staff/channel.

## 8.4 Matumizi
"Soko ya Leo" chips (Nyama, Sukuma, Nyanya, Unga, Mafuta, Gas, Makaa) → amount → done.
Price sparkline per item ("Nyama ↑12% wiki hii"). Receipt photo. Category donut.

## 8.5 Menu & Production Planner
Menu CRUD with image upload, availability toggles (instant on public page). "Mpango wa Kesho":
AI-suggested qty, sold-out time tracking, waste logging, "money left on the table" estimate.

## 8.6 Stock, Wasambazaji, Wafanyakazi
Stock cards w/ animated level bar, threshold editor, +/- moves. Supplier ledger + payments.
Staff shift grid, wage tally, "Lipa", per-staff sales.

## 8.7 Oda
Kanban (New → Preparing → Ready → Out → Delivered), drag or one-tap advance; new-order ding +
browser notification; rider assign sheet; customer SMS on status change (mock).

## 8.8 Ripoti
Period switcher (Leo/Wiki/Mwezi/Custom). Revenue vs expenses area, profit bars, best sellers,
payment donut, hour heat strip, top customers, debt recovery trend. CSV export + print
"Bank Statement" view for SACCO loans.

## 8.9 Public Menu `/m/[slug]` (GORGEOUS)
Warm hero, "Open now", menu by category, item cards (image, SW + EN, price), sticky cart,
checkout (name, phone, pickup/delivery) → mock STK modal with animated phone illustration →
order code + live tracker. QR poster generator in settings (A5 "Menyu Yetu 📱 Scan hapa").

## 8.10 Onboarding
5 steps: hotel name → location → dishes checklist (20 dishes w/ default prices) → M-Pesa
(skippable) → "Karibu Hotel System 🎉" + tour. Zero to first sale < 2 minutes.

---

# 9. DESIGN SYSTEM — "JIKONI"

## 9.1 Anti-AI-Slop Constitution
- ❌ NO purple-blue gradients, NO glassmorphism-everywhere, NO floating-blob heroes, NO emoji
  icons in UI chrome (Lucide only; emoji only in chat/notification copy), NO identical
  rounded-2xl-shadow-md grids everywhere, NO centered-everything, NO placeholder text.
- ✅ ONE focal point per screen, real hierarchy, natural asymmetry, sharp Kenyan brand copy.

## 9.2 Brand
Name **Hotel System**. Tagline "Biashara yako. Kwenye simu yako." Logo: SVG wordmark, "Hotel"
warm off-white + "System" flame orange in a rounded tag; rising-steam glyph (three curved
strokes), gently animated on landing + splash.

## 9.3 Color Tokens (dark-first)
```
--bg #0C0A09  --bg-raised #171412  --bg-overlay #1F1B18  --border #2A2522
--text #F5F0EA  --text-dim #A69D93  --flame #FF6B2C  --flame-hot #FF8F4D
--ugali #E9DCC3  --sukuma #3E9B4F  --nyanya #E5484D  --chai #C99A5B
```
Light mode: cream `#FAF6EF` bg, charcoal text; toggle; dark default. Money ALWAYS tabular-nums.
Positive = sukuma, debts/negative = nyanya.

## 9.4 Typography
Display: Clash Display (fontshare). Body: Inter variable, tabular-nums for numbers.
display-2xl 56/64 for hero money; daily profit should feel like a scoreboard.

## 9.5 Motion (variants in `lib/motion.ts`)
Ease `[0.22, 1, 0.36, 1]` ("steam"), 0.35–0.6s. Page: 12px slide-up + fade. Lists stagger 0.04s.
`<AnimatedMoney/>` spring roll. Buttons scale 0.97; keypad ripple; cards lift 2px; speed-dial
radial bloom; confetti (flame+sukuma+chai); pull-to-refresh steam. Respect reduced-motion.

## 9.6 i18n — typed dictionary, `useT()`, EN + SW complete, toggle, Swahili default.

## 9.7 3D (R3F — lazy, mobile-degraded)
Landing: low-poly night-market vignette built from primitives (jiko w/ emissive glow, sufuria
with steam sprites, hovering phone showing the app), orbital drift, ±3° parallax, firelight
flicker. No downloaded GLBs. Dashboard: tiny steam emitter behind greeting (disabled on
low-end). Static fallback for reduced-motion.

## 9.8 Landing (GSAP ScrollTrigger)
1 Hero (3D, "Hotel yako. Digital. Leo.", CTA "Anza Bure", live ticker) · 2 Problem
(horizontal-scroll storyboard, torn paper) · 3 Magic (pinned phone, chat types itself →
receipt card) · 4 Bento (Madeni, M-Pesa, Ripoti, Oda live mini-demos) · 5 Numbers strip ·
6 Testimonials (3 Kenyan personas) · 7 Pricing (Bure / KSh 499/mwezi Pro) · 8 Footer (steam logo).

---

# 10. AUTH, SECURITY, MULTI-TENANCY
Supabase Auth phone-first (email fallback). Roles owner/staff/admin. Staff 4-digit PIN
quick-switch lock screen. RLS on every tenant table in migrations. Mock mode = local session
shim w/ demo hotel. Zod on every API input. Rate-limit public order endpoints (in-memory
fallback). Webhook verification (Daraja IP allowlist note, WhatsApp `X-Hub-Signature-256`).
Audit log on all money mutations. Never log secrets.

# 11. PWA & PERFORMANCE
Installable (name "Hotel System", theme `#0C0A09`). SW caches shell + last dashboard snapshot;
offline sales/debts queued in IndexedDB, synced on reconnect, visible chip "Inasubiri
mtandao… 2 pending". Budgets: landing LCP < 2.5s, dashboard JS < 250KB gz, next/image,
preloaded fonts, 3D dynamically imported.

# 12. MOCK MODE
`MOCK_MODE=true` default; `npm run dev` truly zero-config. Canned Whisper transcripts;
deterministic rule-based intent parser (`intents.ts`) handling ALL §6.3 utterances with no key
(Anthropic enhances when key exists); M-Pesa simulator; SMS outbox; WhatsApp simulator.
**The rule-based Swahili parser is mandatory and fully unit-tested.**

# 13. TESTING & QUALITY GATES
Vitest: money.ts, parseSwahiliAmount, intent parser (≥ 15 utterances), debt engine (partial,
overpay guard, settle), auto-match, plan_tomorrow. Playwright: (1) onboarding → first sale,
(2) debt → payment → confetti, (3) public order → Oda queue. `npm run check` = typecheck +
lint + unit tests, green before every phase-end commit.

# 14. BUILD PHASES
0 Foundation · 1 Data core + app shell · 2 Madeni + Mauzo + Matumizi · 3 Msaidizi AI ·
4 Money layer · 5 Menu/planner/stock/suppliers/staff · 6 Orders + public menu + QR + tracking ·
7 Reports + bank statement · 8 Landing + 3D + onboarding · 9 PWA/offline, WhatsApp, polish ·
10 Hardening, README, COMPLETION_REPORT, tag v1.0.0.

# 15. DEFINITION OF DONE
- [ ] `npm run dev` works with ZERO keys (mock mode, rich seed)
- [ ] `npm run build` clean; `npm run check` green
- [ ] Every §8 screen complete, animated, bilingual, mobile-perfect, real demo data
- [ ] All §6.3 utterances work in chat offline, tested
- [ ] Debt settle → confetti + SMS in outbox
- [ ] M-Pesa simulate → auto-match → visible in feed
- [ ] Public order → Oda kanban with sound
- [ ] Landing 3D 60fps desktop, mobile fallback, scroll scenes
- [ ] PWA installable; offline sale queues + syncs
- [ ] status.md accurate, COMPLETION_REPORT.md written, clean conventional git history
- [ ] Zero AI slop per §9.1 — explicit final self-review

Karibu kazini. 🔥
