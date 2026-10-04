# Hotel System

**Biashara yako. Kwenye simu yako.** This is the operating system for Kenya's street hotels (vibanda). It covers debts (madeni), sales (mauzo), M-Pesa, orders and reports, plus an assistant (Msaidizi) that understands Swahili, Sheng and English.

It is a mobile-first PWA built with Next.js 15, Tailwind 4, Zustand, Drizzle/Supabase, Recharts, R3F and GSAP.

The demo hotel is **Nourish Hotel** (owner: Mama Mary) in Kangemi, Nairobi. Demo PINs: Mary 1234, Grace 2580, Peter 1470.

## Quick start
```bash
npm install
npm run dev            # http://localhost:3000 (zero keys, MOCK_MODE)
npm run check          # typecheck + lint + 100 unit tests
npm run build && npm run start
npm run e2e            # 3 Playwright journeys (Pixel 7), reuses :3000
```
For the best experience, open it on a phone (same Wi-Fi) or in Chrome DevTools mobile view. You can install it as an app from the browser menu.

## Mock mode vs live mode
`MOCK_MODE=true` (the default) runs everything with **no keys**:
- **Data:** an on-device store holds 60 days of seeded data in localStorage. It works offline.
- **Assistant:** a rule-based Swahili/Sheng parser stands in for the AI.
- **Voice:** canned transcripts stand in for Whisper.
- **M-Pesa:** a simulator posts real Daraja-shaped C2B/STK bodies through the real parsers.
- **SMS:** messages go to an on-device outbox. A WhatsApp simulator is also included.

Each integration switches to live mode on its own as soon as its keys are present (see `.env.example`):

| Capability | Keys | Without keys |
|---|---|---|
| AI brain (18 tools) | `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | Offline rule-based agent |
| Voice notes | `OPENAI_API_KEY` (Whisper, `sw`) | Mock transcripts |
| Database / auth | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` | On-device store |
| M-Pesa Daraja | `MPESA_ENV`, `MPESA_CONSUMER_KEY/SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY`, `MPESA_CALLBACK_BASE_URL`, optional `MPESA_WEBHOOK_SECRET` | Simulator |
| SMS | `AT_USERNAME`, `AT_API_KEY`, `AT_SENDER_ID` (Africa's Talking) | Outbox |
| WhatsApp | `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET` | Simulator |
| Daily briefs cron | `CRON_SECRET` | Open in mock mode |

`GET /api/ai/status` reports which integrations are live.

## Screens
**Public pages**

| Area | Route |
|---|---|
| Landing (3D hero, scroll scenes, pricing) | `/` |
| Onboarding (5 steps, under 2 minutes) | `/onboarding` |
| Public menu, checkout and STK | `/m/nourish-hotel` |
| Order tracker | `/m/[slug]/oda/[code]` |

**Dashboard: daily work**

| Area | Route |
|---|---|
| Leo (today: profit, briefs, alerts, feed) | `/dashboard` |
| Mauzo (POS) | `/dashboard/mauzo` |
| Madeni (debts: swipe pay/remind, confetti, SMS receipt) | `/dashboard/madeni` |
| Oda (orders queue with ding) | `/dashboard/oda` |
| Msaidizi (chat + voice) | `/dashboard/msaidizi` |
| Matumizi (expenses / soko) | `/dashboard/matumizi` |

**Dashboard: operations**

| Area | Route |
|---|---|
| Zaidi (more hub) | `/dashboard/zaidi` |
| Menu CRUD | `/dashboard/menu` |
| Mpango wa Kesho (tomorrow's cooking plan) | `/dashboard/menu/plan` |
| Stock | `/dashboard/stock` |
| Wasambazaji (suppliers) | `/dashboard/wasambazaji` |
| Wafanyakazi (staff, shifts, wages) | `/dashboard/wafanyakazi` |
| Ripoti (reports, CSV) | `/dashboard/ripoti` |
| Bank / SACCO statement (A4 print) | `/ripoti/statement` |
| Reconcile M-Pesa | `/dashboard/reconcile` |

**Dashboard: settings**

| Area | Route |
|---|---|
| Settings (language, theme, PIN lock) | `/dashboard/settings` |
| SMS outbox | `/dashboard/settings/outbox` |
| WhatsApp simulator | `/dashboard/settings/whatsapp-sim` |
| QR poster (A5) | `/dashboard/settings/qr` |

## API
- **AI and cron:**
  - `POST /api/ai/chat`: stateless Anthropic proxy; tools execute on the client.
  - `POST /api/ai/transcribe`
  - `GET /api/ai/status`
  - `GET /api/cron/daily?run=morning|evening`: Netlify schedules are in `netlify/functions/`.
- **M-Pesa:**
  - `POST /api/mpesa/c2b/{validate,confirm,register}`
  - `POST /api/mpesa/stk/{push,callback}`
- **Messaging:** `GET|POST /api/whatsapp/webhook` (verifies HMAC `X-Hub-Signature-256`).
- **Sync:** `POST /api/sync` is the offline queue sink. It is idempotent by op id and writes to `sync_ops` in live mode.
- **Health:** `GET /readyz`

## Architecture
```
 UI (App Router, mobile-first)        src/app, src/components
   │  useT() i18n sw/en · motion · Jikoni tokens
   ▼
 On-device store (Zustand+localStorage)   src/lib/store   ← mock data, offline-first
   │  actions ──► sync queue (IndexedDB) ──► /api/sync ──► Supabase (live)
   ▼
 Pure domain                               src/lib/domain
   debts · automatch · planner · briefs · reports · whatsapp-bot
   ▲
 Msaidizi                                  src/lib/ai
   intents.ts (rule parser) → offline-agent → tools.ts ◄── agent.ts (Anthropic loop via /api/ai/chat)
   ▲
 Integrations (adapter: mock | live)       src/lib/integrations/{mpesa,sms,whatsapp}
```
- The business day starts at **05:00**.
- Money is stored as integer cents and always rendered with tabular numbers.

## Deploy (Netlify + Supabase)
1. Create a Supabase project. Run the SQL in `drizzle/` (`npm run db:migrate` with `DATABASE_URL`), which includes RLS.
2. On Netlify, import the repo. `netlify.toml` is already configured. Set the env vars above and set `MOCK_MODE=false` once Supabase is wired.
3. Daraja: set `MPESA_CALLBACK_BASE_URL` to the site URL, then call `POST /api/mpesa/c2b/register` once.
4. WhatsApp: point the Meta webhook at `/api/whatsapp/webhook` using `WHATSAPP_VERIFY_TOKEN`.

## Docs
- `MASTERPROMPT.md`: product truth. `docs/MASTERPROMPT_ORIGINAL.md` holds the owner's brief verbatim.
- `status.md`: progress truth.
- `COMPLETION_REPORT.md`: the v1.0.0 report.
- `docs/reference/`: the owner's reference photos. `docs/skills/`: design skill notes used for the build.