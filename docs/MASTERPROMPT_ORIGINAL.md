MASTER PROMPT FOR THE HOTEL SYSTEM BELOW:



# Current identity



Application: **Hotel System**. Hotel: **Nourish Hotel**. Owner: **Mama Mary**. 



# 🔥 Hotel System — MASTER BUILD PROMPT

### The Operating System for Kenya's Hotel Food Hotels

**Version 1.0 — Autonomous Build Directive for Claude Code**



---



# /goal — PRIME DIRECTIVE (READ FIRST)



You are the sole engineer, architect, designer, and product owner of this project.

Your mission: **Build the ENTIRE Hotel System platform described in this document, end to end,

autonomously, without asking the human for input**, except for the 3 cases listed below.



RULES OF AUTONOMY:

1. **Do NOT ask questions.** Every decision you need has been made in this document. If something

   is ambiguous, make the most professional decision consistent with this document, record the

   decision in status.md under "Decisions Log", and continue.

2. **Only stop and ask the human when:** (a) you need a real secret/API key to proceed AND the

   mock mode described in §12 cannot cover it, (b) a paid account action is required, or

   (c) you have FINISHED everything and are presenting the completed project.

3. **Work in phases (§14).** Complete each phase fully — code, styling, tests, seed data — before

   moving to the next. Never leave a feature half-built.

4. **After EVERY meaningful unit of work**, update status.md (protocol in §2) and make a git

   commit with a conventional-commit message (feat:, fix:, style:, docs:, chore:).

5. **The build must RUN.** At the end of every phase: npm run build must pass with zero errors,

   the dev server must start, and you must verify key routes/endpoints work (curl or test).

6. **Never ship placeholder junk.** No lorem ipsum, no "Coming soon", no empty pages, no broken

   links, no default favicons. Every screen must look finished and contain realistic Kenyan data.

7. When 100% complete, write COMPLETION_REPORT.md (final feature list, how to run, how to

   deploy, what keys are needed to go live) and present it to the human.



---



# 1. PROJECT VISION & CONTEXT (Domain Knowledge — internalize this)



## 1.1 What is a Hotel?

A hotel (plural: vibanda) is a small, informal, open-air or semi-permanent food hotel in Kenya,

run by "Mama Hotel" or "Baba Hotel". They serve affordable local food: ugali, sukuma wiki,

beans (madondo), githeri, chapati, rice (wali), pilau, matumbo, beef stew, fried fish (samaki),

ndengu, mandazi, chai, uji. Everything currently runs on **memory, a paper exercise book

(daftari), cash, and M-Pesa on a personal phone**.



## 1.2 The Pain We Are Killing (in priority order)

1. **MADENI (customer debts)** — debts written in a paper book get forgotten, disputed, or lost.

   10–20% of revenue leaks here. This is the heart of the product.

2. **No daily profit visibility** — owners don't know if they made a profit today.

3. **M-Pesa reconciliation** — matching payments to plates is manual; staff pocket cash.

4. **Food planning guesswork** — cook too much = spoilage; too little = lost sales.

5. **Supplier credit chaos**, stock blindness (gas, unga, oil), staff wages, no order channel,

   no records for SACCO/bank loans.



## 1.3 The Product

**Hotel System** = three layers:

- **Layer A — The Owner's Brain**: a conversational AI assistant (chat UI in the app + WhatsApp

  webhook-ready) that speaks Swahili/Sheng/English, accepts text AND voice notes, and runs the

  business: log sales, log debts, log expenses, answer "leo nimepataje?", produce evening

  summaries, morning shopping lists, and debt reminders.

- **Layer B — The Money Layer**: M-Pesa Daraja integration (C2B confirmation webhooks + STK Push),

  auto-reconciliation, cash-vs-M-Pesa leakage detection.

- **Layer C — Customer-Facing**: public digital menu page per hotel (QR-code linkable),

  WhatsApp-style ordering flow, order queue, delivery tracking, loyalty.



## 1.4 The Users

- **Owner (Mama/Baba Hotel)** — smartphone, WhatsApp-fluent, busy, non-technical. Primary user.

- **Staff** — limited-permission accounts (log sales only, no reports).

- **Customer** — public menu, ordering, debt-balance SMS receipts. No login needed to order.

- **You (the developer/admin)** — super-admin view of all hotels (multi-tenant).



## 1.5 Language

UI is **bilingual: English + Swahili**, with Swahili-first labels on money concepts:

Mauzo (sales), Matumizi (expenses), Madeni (debts), Faida (profit), Soko (market/shopping),

Karo (wages), Akiba (savings). Build a proper i18n layer (§9.6) — no hardcoded strings.



---



# 2. STATUS.MD PROTOCOL (MANDATORY)



Create status.md at repo root BEFORE writing any code. It is the single source of truth for

project state, designed so ANY other agent/model can pick up the project cold. Structure:



```md

# Hotel System — Project Status

Last updated: <ISO timestamp> | Current phase: <N> | Overall: <X>% complete



## How to Run (always current)

<exact commands>



## Architecture Snapshot

<3-6 bullet summary + any diagram>



## Phase Progress

- [x] Phase 0: Scaffold — DONE (commit abc123)

- [ ] Phase 1: ... — IN PROGRESS

  - [x] sub-task

  - [ ] sub-task ← CURRENTLY HERE



## Decisions Log

| Date | Decision | Why |



## Environment Variables Needed

| Var | Purpose | Mock available? |



## Known Issues / TODO

## What Remains (ordered)

```

Update it after every completed sub-task. Never let it drift from reality.



---



# 3. TECH STACK (EXACT — do not substitute)



| Layer | Technology |

|---|---|

| Framework | **Next.js 15 (App Router, TypeScript, src/ dir)** — one app: frontend + API routes |

| Styling | **Tailwind CSS v4** + CSS custom properties design tokens |

| Components | **shadcn/ui** (installed via CLI, then heavily customized — never default look) |

| Animation | **Framer Motion (motion)** for UI + **GSAP ScrollTrigger** for landing scroll scenes |

| 3D | **React Three Fiber + drei** (landing hero + dashboard ambient scene) |

| Charts | **Recharts** (custom-themed) |

| State | **Zustand** (client) + **TanStack Query v5** (server state) |

| DB & Auth | **Supabase** (Postgres + Row Level Security + Supabase Auth phone/email) |

| ORM | **Drizzle ORM** with SQL migrations in /drizzle |

| AI | **Anthropic API (claude-sonnet-4-5 or latest)** for the agent brain w/ tool-use; **OpenAI Whisper API** for Swahili voice-note transcription |

| Payments | **Safaricom Daraja API** (sandbox): C2B register/confirm/validate + STK Push |

| SMS | **Africa's Talking** (sandbox) for debt receipts & reminders |

| WhatsApp | **Meta WhatsApp Cloud API** webhook route (built + mock-tested, live optional) |

| PWA | manifest.json + service worker (installable, offline shell for dashboard) |

| Testing | **Vitest** (unit: money math, debt engine, AI intent parser) + **Playwright** (3 smoke E2E) |

| Quality | ESLint + Prettier + strict TS (noUncheckedIndexedAccess: true) |



**MOCK-FIRST RULE (§12 details):** Every external service (Supabase optional-local, Daraja,

Africa's Talking, WhatsApp, Anthropic, Whisper) must have a **mock adapter** selected by env var,

so the ENTIRE app runs and demos perfectly with zero real keys. Real adapters are written too,

behind the same interface. MOCK_MODE=true is the default in .env.example.



---



# 4. REPOSITORY STRUCTURE



```

Hotel System/

├── MASTERPROMPT.md            # this file

├── status.md                  # living status (protocol §2)

├── COMPLETION_REPORT.md       # written at the end

├── README.md                  # polished, with screenshots section & setup guide

├── .env.example               # EVERY var documented with comments

├── drizzle/                   # SQL migrations

├── public/                    # icons, manifest, og-image, 3D textures, sounds

├── src/

│   ├── app/

│   │   ├── (marketing)/page.tsx          # cinematic landing page

│   │   ├── (auth)/login, register, onboarding/

│   │   ├── (dashboard)/dashboard/        # owner app shell

│   │   │   ├── page.tsx                  # Home: today's pulse

│   │   │   ├── mauzo/                    # sales

│   │   │   ├── madeni/                   # debts (flagship)

│   │   │   ├── matumizi/                 # expenses & soko

│   │   │   ├── menu/                     # menu & daily production planner

│   │   │   ├── stock/                    # inventory & assets

│   │   │   ├── wasambazaji/              # suppliers

│   │   │   ├── wafanyakazi/              # staff

│   │   │   ├── oda/                      # orders & delivery queue

│   │   │   ├── ripoti/                   # reports & analytics

│   │   │   ├── msaidizi/                 # AI assistant full-screen chat

│   │   │   └── settings/

│   │   ├── m/[slug]/page.tsx             # PUBLIC customer menu (per hotel)

│   │   ├── m/[slug]/order/[id]/          # public order tracking

│   │   └── api/

│   │       ├── ai/chat, ai/transcribe/

│   │       ├── mpesa/c2b/confirm, c2b/validate, stk/push, stk/callback/

│   │       ├── whatsapp/webhook/

│   │       ├── sms/send, sms/reminders/cron/

│   │       └── orders/, debts/, sales/ ... (REST for public pages)

│   ├── components/  (ui/, dashboard/, landing/, three/, charts/, chat/)

│   ├── lib/

│   │   ├── db/ (schema.ts, queries/)

│   │   ├── ai/ (agent.ts, tools.ts, intents.ts, prompts.ts, transcribe.ts)

│   │   ├── integrations/ (mpesa/, sms/, whatsapp/ — each: adapter.ts, mock.ts, live.ts)

│   │   ├── i18n/ (en.ts, sw.ts, index.ts)

│   │   └── utils/ (money.ts — integer cents ONLY, dates.ts, phone.ts — 2547XX normalize)

│   └── styles/ (globals.css, tokens.css)

└── tests/ (unit/, e2e/)

```



---



# 5. DATABASE SCHEMA (Drizzle + Postgres — implement exactly, extend if needed)



All money = **integer cents (KES * 100)**. All phones normalized to 2547XXXXXXXX.

Every tenant table carries hotel_id with RLS policies (owner sees own hotel only).



```

hotels        id, slug (unique, for /m/[slug]), name, tagline, owner_id, phone, till_number,

                location_text, lat, lng, logo_url, currency='KES', open_hours jsonb,

                settings jsonb, created_at

profiles        id (auth uid), hotel_id, full_name, phone, role enum('owner','staff','admin'),

                avatar_url, pin_hash (staff quick-login), created_at

customers       id, hotel_id, name, nickname, phone, photo_url, notes,

                total_spent_cents, visit_count, loyalty_points, last_seen_at, created_at

debts           id, hotel_id, customer_id, amount_cents, balance_cents,

                status enum('open','partial','paid','written_off'), description,

                items jsonb, due_date, created_by, created_at, settled_at

debt_payments   id, debt_id, amount_cents, method enum('cash','mpesa','other'),

                mpesa_tx_id, note, created_at

menu_items      id, hotel_id, name, name_sw, category enum('breakfast','main','side',

                'drink','snack'), price_cents, image_url, is_available, sort_order, created_at

daily_menus     id, hotel_id, date, item_id, planned_qty, cooked_qty, sold_qty,

                soldout_at, waste_qty, notes

sales           id, hotel_id, customer_id (nullable), staff_id, total_cents,

                payment_method enum('cash','mpesa','debt','split'), mpesa_tx_id,

                channel enum('walk_in','whatsapp','phone','app'), note, created_at

sale_items      id, sale_id, menu_item_id, qty, unit_price_cents, line_total_cents

expenses        id, hotel_id, category enum('soko','gas','charcoal','rent','wages',

                'transport','license','equipment','other'), description, amount_cents,

                supplier_id (nullable), receipt_photo_url, incurred_on, created_by, created_at

suppliers       id, hotel_id, name, phone, what_they_supply, balance_owed_cents, created_at

supplier_txns   id, supplier_id, type enum('purchase','payment'), amount_cents, note, created_at

inventory_items id, hotel_id, name, unit ('kg','ltr','pcs','sack','cylinder'),

                current_qty numeric, low_threshold numeric, last_price_cents, created_at

stock_moves     id, inventory_item_id, delta numeric, reason enum('purchase','usage',

                'waste','adjust'), note, created_at

orders          id, hotel_id, customer_id, code (human: 'KB-1042'), status enum('new',

                'confirmed','preparing','ready','out_for_delivery','delivered','cancelled'),

                type enum('pickup','delivery'), address_text, total_cents, payment_status

                enum('unpaid','paid','pay_on_delivery'), mpesa_tx_id, rider_name, rider_phone,

                placed_via enum('public_menu','whatsapp','manual'), created_at, updated_at

order_items     id, order_id, menu_item_id, qty, unit_price_cents

mpesa_txns      id, hotel_id, provider_tx_id (unique), type enum('c2b','stk'), phone,

                amount_cents, payer_name, raw jsonb, matched_entity ('sale','debt','order'),

                matched_id, status enum('unmatched','matched','ignored'), created_at

staff_shifts    id, hotel_id, staff_id, date, present bool, wage_cents, paid bool, note

ai_messages     id, hotel_id, user_id, role enum('user','assistant','tool'),

                content text, audio_url, intent, tool_calls jsonb, created_at

notifications   id, hotel_id, kind, title, body, read, created_at

audit_log       id, hotel_id, actor_id, action, entity, entity_id, diff jsonb, created_at

```



**Seed data (mandatory, realistic):** 1 demo hotel "Nourish Hotel" (slug nourish-hotel),

14 menu items with real Kenyan prices (Ugali Beef 180/=, Chapati 20/=, Madondo 80/=, Pilau 150/=,

Chai 30/=, Samaki Wet Fry 250/= …), 25 customers with Kenyan names, 60 days of generated sales

with realistic weekday/Friday-pilau patterns, 18 debts in mixed states, 60 days expenses,

6 suppliers, 10 inventory items, 12 orders in various states, 200+ mpesa mock transactions.

The demo must feel ALIVE the second it opens.



---



# 6. THE AI ASSISTANT — "MSAIDIZI" (the soul of the product)



## 6.1 Architecture

src/lib/ai/agent.ts: Anthropic tool-use loop. System prompt (write it fully in

prompts.ts) establishes: persona "Msaidizi wa Hotel System" — a sharp, warm, trustworthy Kenyan

business assistant; speaks the user's language (mirror Swahili/Sheng/English); ALWAYS confirms

money actions with a summary before committing >KES 5,000; NEVER invents figures — always calls

tools; formats money as "KSh 1,250".



## 6.2 Tools (implement each as a typed function hitting Drizzle queries)

log_sale, log_debt, record_debt_payment, log_expense, get_daily_summary,

get_debts_report (aging buckets), get_customer_profile, check_stock, update_stock,

get_best_sellers, plan_tomorrow (production suggestions from sales history),

send_debt_reminder (SMS), create_order, get_week_report, add_menu_item,

set_item_soldout, log_supplier_purchase, search_anything.



## 6.3 Understanding Swahili/Sheng — test these EXACT utterances in unit tests:

- "Nimeuza ugali samaki mbili na chai moja, cash" → sale: 2× Ugali Samaki + 1× Chai, cash

- "Andika deni ya Otieno mia mbili hamsini" → debt: Otieno, KSh 250

- "Otieno amelipa deni yote" → settle Otieno's balance

- "Nimenunua nyama elfu mbili na sukuma mia tatu" → expenses: meat 2000, sukuma 300

- "Leo nimepataje?" → daily summary (mauzo, matumizi, madeni mpya, faida)

- "Nani ananidai... eeh, nani nina madeni yao?" → debts report

- "Wali imeisha" → mark rice sold out today

- "Mafuta imebaki lita ngapi?" → stock check

Numbers in Swahili words (mia, elfu, hamsini…) must parse. Build parseSwahiliAmount() util

with unit tests.



## 6.4 Voice notes

/api/ai/transcribe: accepts audio blob → Whisper (language: 'sw' hint) → text → agent.

Mock mode: return canned transcriptions from a fixture list so demos work offline.



## 6.5 Proactive intelligence (cron-style route /api/cron/daily, callable manually + button)

- **18:30 Evening Pulse**: composes the daily P&L narrative → notification + (mock) WhatsApp text

- **05:30 Morning Brief**: shopping list from yesterday's usage + low stock + today's plan

- **Debt nudges**: debts >7 days → drafts polite Swahili SMS ("Habari Otieno! Kumbusho ya deni

  KSh 250 ya Mama Mary's. Lipa kwa M-Pesa Till 832100. Asante! 🙏") — owner approves with 1 tap.



## 6.6 Chat UI (dashboard msaidizi/ + floating launcher on every dashboard page)

Streaming responses, tool-call activity chips ("📒 Naandika deni…"), voice-note recorder

(hold-to-record with animated waveform), quick-action suggestion pills ("Leo nimepataje?",

"Madeni yote", "Ongeza mauzo"), Kenyan-time greetings ("Habari za asubuhi 🌅").

Rich cards inside chat: when the agent returns a summary, render a beautiful mini P&L card,

not plain text; debt confirmations render as receipt-style cards.



---



# 7. INTEGRATIONS (adapter pattern: mock.ts + live.ts behind one interface)



## 7.1 M-Pesa Daraja

- POST /api/mpesa/c2b/confirm + /validate: receive payment JSON → upsert mpesa_txns →

  auto-match engine: match by phone→customer, by amount→open order/debt; unmatched go to a

  "Reconcile" inbox UI with one-tap match suggestions.

- POST /api/mpesa/stk/push: initiate STK for order checkout; /stk/callback finalizes.

- Live adapter: OAuth token caching, sandbox URLs, env-driven shortcode/passkey.

- Mock adapter: mock.ts can simulate an incoming payment (dev-only button "Simulate M-Pesa

  payment" in the Reconcile screen fires a fake C2B webhook). This makes the demo magical.



## 7.2 Africa's Talking SMS — send debt receipts, reminders, order updates. Mock logs to a

   dev "SMS Outbox" screen at /dashboard/settings/outbox showing exactly what would be sent.



## 7.3 WhatsApp Cloud API — GET /api/whatsapp/webhook (verify token) + POST (messages →

   pipe into the SAME agent as §6, reply via adapter). Mock mode: a dev-only "WhatsApp

   Simulator" page at /dashboard/settings/whatsapp-sim — a WhatsApp-look chat where you can

   play customer/owner and watch the bot respond. Build this simulator beautifully; it doubles

   as the demo of the WhatsApp experience.



---



# 8. FEATURE SPECS — SCREEN BY SCREEN (dashboard)



Every screen: mobile-first (owners use phones), thumb-reachable primary actions, bottom tab bar

on mobile (Home, Mauzo, Madeni, Oda, Msaidizi) + collapsible sidebar on desktop.



## 8.1 Home — "Leo" (Today's Pulse)

- Hero stat row (animated count-up): Mauzo ya Leo, Matumizi, Faida (green/red), Madeni Mpya.

- "Faida Meter" — a custom radial gauge (SVG, animated) showing today's profit vs. 7-day avg.

- Live feed: last 10 events (sale logged, M-Pesa received, debt cleared) w/ staggered entrance.

- Sold-out alerts, low-stock chips, pending orders count with pulse animation.

- Big floating "＋" speed-dial: Log Sale / Log Debt / Log Expense / Voice note.



## 8.2 Madeni (FLAGSHIP — make this screen extraordinary)

- Summary header: Total outstanding, # debtors, oldest debt age, "recovered this week".

- Aging tabs: Zote / 0–7d / 8–30d / 30d+ (30d+ styled with urgent red accents).

- Debtor cards: avatar (auto-generated initials with warm color hash), name, balance

  (large, tabular-nums), age badge, last-payment, swipe-right = record payment,

  swipe-left = send reminder. Tap → full debt history timeline.

- "Record payment" bottom sheet: amount keypad (custom, big, satisfying key-press animations),

  method toggle Cash/M-Pesa; on full settle → **confetti burst + "Deni Limelipwa! 🎉"** stamp

  animation + auto-SMS receipt to customer (mock outbox).

- New debt flow ≤ 3 taps: pick/create customer → amount keypad → optional items → done.



## 8.3 Mauzo (Sales)

- POS-style quick-log grid: menu items as photo tiles, tap to add, running total bar,

  payment method selector, "Weka kwa deni" shortcut linking to customer picker.

- Sales list with day-grouped virtualized feed; filter by method/staff/channel.



## 8.4 Matumizi (Expenses & Soko)

- "Soko ya Leo" quick-entry: chips for common items (Nyama, Sukuma, Nyanya, Unga, Mafuta,

  Gas, Makaa) → tap chip → amount → done. Price-history sparkline per item ("Nyama ↑12% wiki hii").

- Receipt photo attach. Category donut chart.



## 8.5 Menu & Production Planner

- Menu CRUD with image upload (Supabase storage / local mock), availability toggles that

  instantly reflect on the public page.

- "Mpango wa Kesho": table of items with AI-suggested quantities (from §6 plan_tomorrow),

  sold-out time tracking, waste logging. Show "money left on the table" estimate when items

  sold out early — this insight sells the product.



## 8.6 Stock, Wasambazaji, Wafanyakazi

- Stock: card per item with animated level bar, low-stock threshold editor, quick +/- moves.

- Suppliers: ledger per supplier, "You owe / They delivered" timeline, record payment.

- Staff: shift grid (present/absent), daily wage tally, "Lipa" action, per-staff sales totals.



## 8.7 Oda (Orders & Delivery)

- Kanban-style status columns (New → Preparing → Ready → Out → Delivered) with drag OR

  one-tap advance on mobile; new orders arrive with sound (soft "ding", public/sounds/)

  + browser notification. Rider assign sheet. Customer gets SMS on status change (mock).



## 8.8 Ripoti (Reports)

- Period switcher (Leo/Wiki/Mwezi/Custom). Charts (Recharts, custom theme):

  revenue vs expenses area chart, profit bars, best sellers horizontal bars,

  payment-method split donut, hour-of-day heat strip, top customers table,

  debt recovery trend. Export CSV + a print-optimized "Bank Statement" view

  (clean, formal — this is what they show a SACCO for a loan).



## 8.9 Public Menu — /m/[slug] (customer-facing, must be GORGEOUS)

- Mobile-first food-menu page: hotel name + warm hero, "Open now" status, today's menu

  grouped by category, appetizing item cards (image, name in Swahili + English, price),

  sticky cart bar, checkout: name + phone + pickup/delivery → (mock) STK push modal with

  animated phone-payment illustration → order code + live status page with animated

  progress tracker (like a mini Uber-Eats tracker).

- QR code generator in settings that renders a beautiful printable A5 poster

  ("Menyu Yetu 📱 Scan hapa") the owner can print.



## 8.10 Onboarding (first-run wizard)

5 delightful steps with progress animation: hotel name → location → what do you cook

(pre-seeded checklist grid of 20 common dishes w/ default prices, tap to toggle) → M-Pesa

details (skippable) → "Karibu Hotel System 🎉" with a short animated tour of the 3 core actions.

The goal: from zero to first logged sale in under 2 minutes.



---



# 9. DESIGN SYSTEM — "JIKONI" (execute precisely; this defines the product's soul)



## 9.1 Anti-AI-Slop Constitution (hard rules)

- ❌ NO generic purple-to-blue gradients, NO glassmorphism-everywhere, NO stock hero with

  floating blobs, NO emoji as icons in the UI chrome (Lucide icons only; emoji allowed only

  inside chat/notification copy), NO identical rounded-2xl-shadow-md card grids on every page,

  NO centered-everything layouts, NO placeholder text anywhere.

- ✅ Every screen must have ONE clear focal point, real hierarchy, asymmetry where natural,

  and copy written like a sharp Kenyan brand would write it.



## 9.2 Brand

- Name: **Hotel System**. Tagline: "Biashara yako. Kwenye simu yako." (Your business. On your phone.)

- Logo: wordmark "Hotel **System**" — build as SVG: "Hotel" in warm off-white, "OS" in flame

  orange inside a subtle rounded tag; a rising-steam glyph (three curved SVG strokes) above

  the "i" — animate the steam gently rising on the landing page and app splash.



## 9.3 Color Tokens (CSS custom properties in tokens.css)

Dark-first UI (hotels often used at dusk; OLED phones; battery):

```

--bg:            #0C0A09  (near-black warm charcoal)

--bg-raised:     #171412

--bg-overlay:    #1F1B18

--border:        #2A2522

--text:          #F5F0EA  (warm off-white)

--text-dim:      #A69D93

--flame:         #FF6B2C  (primary — jiko flame orange)

--flame-hot:     #FF8F4D

--ugali:         #E9DCC3  (cream accent)

--sukuma:        #3E9B4F  (money-positive green)

--nyanya:        #E5484D  (danger/debt red)

--chai:          #C99A5B  (warm gold, for highlights/loyalty)

```

Light mode also implemented (cream #FAF6EF background, charcoal text) with a toggle;

dark is default. Money is ALWAYS tabular-nums. Positive = sukuma green, debts/negative = nyanya.



## 9.4 Typography

- Display: **Clash Display** (via fontshare CDN or self-host) — headings, big numbers.

- Body/UI: **Inter** (variable). Numeric: Inter tabular-nums.

- Scale: display-2xl 56/64 for hero money figures; the daily profit number on Home should feel

  like a scoreboard.



## 9.5 Motion Language (Framer Motion; define variants in lib/motion.ts, reuse everywhere)

- Signature easing: [0.22, 1, 0.36, 1] (custom "steam" ease). Durations 0.35–0.6s.

- Page transitions: subtle 12px slide-up + fade. Lists: staggerChildren 0.04s.

- Money count-ups: spring-animated number roll (build <AnimatedMoney/> component).

- Micro-interactions: buttons scale 0.97 on press; keypad keys ripple; cards lift 2px on hover;

  the "＋" speed-dial blooms with radial stagger; debt-settled confetti (canvas-confetti,

  flame+sukuma+chai colors); pull-to-refresh steam animation on mobile feeds.

- Respect prefers-reduced-motion globally.



## 9.6 i18n — lib/i18n: typed dictionary, useT() hook, EN + SW complete for every string,

   language toggle in settings, Swahili default.



## 9.7 3D (React Three Fiber — tasteful, performant, lazy-loaded, mobile-degraded)

- **Landing hero scene**: a stylized low-poly night-market hotel vignette — a charcoal jiko

  with an emissive flame-orange glow, a floating sufuria (pot) with animated steam particles

  (soft additive sprites), a hovering phone displaying the app's Home screen (texture from an

  actual screenshot you take of your own build). Slow orbital drift + mouse parallax

  (± 3°), warm point light flicker like firelight. Draco/low-poly primitives you model in code

  (boxes, cylinders, lathe geometry) — do NOT download random GLB files; build the vignette

  from primitives with good materials so it's original and lightweight.

- **Dashboard ambient**: a tiny corner steam-particle emitter behind the greeting header

  (subtle, 60fps, disabled on low-end via navigator.hardwareConcurrency check).

- Fallback: static poster image render for reduced-motion / weak devices.



## 9.8 Landing Page (marketing route — cinematic, GSAP ScrollTrigger)

Sections, in order, each scroll-choreographed:

1. **Hero**: 3D scene + headline "Hotel yako. Digital. Leo." + sub + CTA "Anza Bure" +

   a live animated ticker of fake events ("Mama Mary amerecord mauzo ya KSh 12,400 leo ✅").

2. **The Problem**: horizontal-scroll storyboard of the analog chaos (daftari, lost debts) —

   typographic, editorial, with torn-paper texture motifs.

3. **The Magic**: phone mockup pinned while chat messages type themselves ("Andika deni ya

   Otieno 250" → receipt card animates in) — this section SELLS the product.

4. **Feature bento**: asymmetric bento grid (Madeni, M-Pesa auto-match, Ripoti, Oda) with

   live mini-demos inside cells (animated gauge, mini chart drawing itself).

5. **Numbers strip**: count-up stats. 6. **Testimonial cards** (3 written personas, Kenyan

   voice). 7. **Pricing**: Bure / KSh 499/mwezi Pro (feature table). 8. **Footer** with the

   steam logo animation.



---



# 10. AUTH, SECURITY, MULTI-TENANCY

- Supabase Auth: phone-first registration (email fallback). Roles: owner/staff/admin.

- Staff quick-switch via 4-digit PIN on a shared device (lock screen with big PIN pad).

- RLS on EVERY tenant table (hotel_id = auth hotel claim). Write the policies in

  migrations. Mock mode uses a local session shim with the demo hotel.

- Zod validation on every API input. Rate limit public order endpoints (upstash-style

  in-memory fallback). Webhook signature verification (Daraja IP allowlist note, WhatsApp

  X-Hub-Signature-256). Audit log writes on all money mutations. Never log secrets.



# 11. PWA & PERFORMANCE

- Installable PWA: manifest (name "Hotel System", theme #0C0A09, icons you generate as SVG→PNG),

  service worker: cache shell + last dashboard data snapshot for offline viewing; queue

  offline-logged sales/debts in IndexedDB and sync on reconnect (build a visible "Inasubiri

  mtandao… 2 pending" sync chip). This offline queue is a REAL differentiator — build it well.

- Budgets: landing LCP < 2.5s (lazy 3D), dashboard route JS < 250KB gz, images next/image,

  fonts preloaded, 3D behind dynamic import + intersection observer.



# 12. MOCK MODE (make the demo perfect with zero keys)

MOCK_MODE=true (default): local SQLite via better-sqlite3 + Drizzle (same schema) OR

supabase local — choose the path that keeps npm run dev truly zero-config; canned Whisper

transcripts; deterministic AI agent fallback (a rule-based intent parser in intents.ts that

handles ALL §6.3 utterances without any API key — the Anthropic adapter enhances it when a key

exists); M-Pesa simulator button; SMS outbox screen; WhatsApp simulator page.

**The rule-based Swahili intent parser is mandatory and fully unit-tested** — the product must

demo its intelligence offline.



# 13. TESTING & QUALITY GATES

- Vitest: money.ts (rounding, splits), parseSwahiliAmount, intent parser (≥ 15 utterances),

  debt engine (partial payments, overpay guard, settle), auto-match engine, plan_tomorrow logic.

- Playwright smoke: (1) onboarding → log first sale, (2) create debt → record payment → confetti

  state, (3) public menu → place order → appears in Oda queue.

- npm run check = typecheck + lint + unit tests; must pass before every phase-end commit.



# 14. BUILD PHASES (execute in order; update status.md at every checkpoint)



**Phase 0 — Foundation**: scaffold Next.js 15 + TS + Tailwind 4 + shadcn + Drizzle + tokens.css

+ i18n skeleton + status.md + git init + .env.example. Gate: dev server runs, tokens render.

**Phase 1 — Data core**: full schema, migrations, seed script (§5's rich demo data), mock auth

+ session, app shell (sidebar/bottom-tabs, page transitions, dark/light). Gate: seeded data

visible in a raw table view.

**Phase 2 — Madeni flagship + Mauzo + Matumizi**: full screens per §8.2–8.4 with all

animations, keypads, confetti, SMS outbox. Gate: E2E test 2 passes.

**Phase 3 — Msaidizi AI**: rule-based intent engine + Anthropic adapter + tools + chat UI +

voice recorder + transcribe route + proactive daily summaries. Gate: all §6.3 utterances pass

unit tests AND work in the chat UI.

**Phase 4 — Money layer**: mpesa adapters, reconcile inbox, simulator, auto-match engine.

**Phase 5 — Menu, planner, stock, suppliers, staff** (§8.5–8.6).

**Phase 6 — Orders + public menu + QR poster + order tracking** (§8.7, 8.9). Gate: E2E test 3.

**Phase 7 — Reports + bank-statement export** (§8.8).

**Phase 8 — Landing page + 3D scenes + onboarding wizard** (§9.7–9.8, §8.10).

**Phase 9 — PWA/offline queue, WhatsApp webhook + simulator, polish pass** (walk EVERY screen;

fix spacing, empty states — design custom empty-state illustrations as inline SVGs —, loading

skeletons, error states, a11y focus rings, reduced-motion).

**Phase 10 — Hardening**: full npm run check, Lighthouse pass, README with setup +

architecture diagram (mermaid), COMPLETION_REPORT.md, final status.md (100%), tag v1.0.0.



# 15. DEFINITION OF DONE (verify every line before presenting)

- [ ] npm run dev works instantly with ZERO env keys (full mock mode, rich seed data)

- [ ] npm run build zero errors/warnings; npm run check green

- [ ] Every §8 screen complete, animated, bilingual, mobile-perfect, with real demo data

- [ ] All §6.3 Swahili utterances work in chat, offline, tested

- [ ] Debt settle triggers confetti + SMS receipt in outbox

- [ ] M-Pesa simulate button → payment auto-matches → visible in feed

- [ ] Public menu order → appears in Oda kanban with sound

- [ ] Landing page: 3D hero at 60fps desktop, graceful mobile fallback, scroll scenes work

- [ ] PWA installable; offline sale queues and syncs

- [ ] status.md accurate, COMPLETION_REPORT.md written, git history clean & conventional

- [ ] Zero AI slop per §9.1 — do a final self-review pass against that list explicitly



BEGIN NOW. Create status.md, then Phase 0. Do not stop until the Definition of Done is fully

checked. Karibu kazini. 🔥



Read MASTERPROMPT fully and check the Reference Image I have shared for you to get the full complete exact and precise Bigger picture of the Smart and powerful Next-generation App I want you to build, then execute it. Do not ask me anything.



And also we are building a mobile App so consider the Mobile User Experience, mobile screen design, UI/UX design, styling, spacing and The Thumbs rule considerations since it is a mobile App not a web App so build the full complete Mobile user experience, convenience use, the thumb can reach any button very simple and easy and everything built in mobile app user experience.



We will use the Netlify Frontend hosting and Superbase for Backend just Build the smart and powerful Next-generation App first and the Hosting  will be done when everything is fully completed for now just build the Next-generation smart and powerful App first.



NOTE: I will also like you to know that this is a Full-stack mobile App not a WebApp. we are building a mobile App so consider the Mobile User Experience, mobile screen design, UI/UX design, styling, spacing and The Thumbs rule considerations since it is a mobile App not a web App so build the full complete Mobile user experience, convenience use, the thumb can reach any button very simple and easy and everything built in mobile app user experience.

You will use these skills in your building:
1. "https://github.com/greensock/gsap-skills.git" 
2. "https://github.com/hamen/material-3-skill.git" 
3. "https://www.skills.sh/code-yeongyu/oh-my-openagent/frontend-ui-ux" & "npx skills add https://github.com/code-yeongyu/oh-my-openagent --skill frontend-ui-ux" 
4. "https://www.skills.sh/github/awesome-copilot/premium-frontend-ui" & "npx skills add https://github.com/github/awesome-copilot --skill premium-frontend-ui" 
5. "https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md"
6. "https://github.com/shadcn-ui/ui/blob/main/skills/shadcn/SKILL.md"

(AND ALSO WRITE THE MASTERPROMP AS MARKDOWN FILE SINCE WHEN YOU AUTO-COMPACT YOU WILL LOOSE THE MASTERPROMPT AND IT IS YOUR MAIN REFERENCE SO MAKE SURE ALL THE REFERENCES YOU WILL USE ARE STORED SAFELY SO THAT YOU CHECK EACH TIME YOU ARE BUILDING TO STAY CONSISTENCY AND INSTRUCTION FOLLOWING FROM START TO THE END ADDING YOUR SMARTNESS, COMPETENCE, GENIUS AND YOUR SUPER INTELLIGENCE TO BUILD THE SMART AND POWERFUL NEXT-GENERATION APP THAT WILL BE LIKE MY SYSTEM OFFICE THAT RUNS MY WHOLE COMPANY)