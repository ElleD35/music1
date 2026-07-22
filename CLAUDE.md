<!--
Maintainer note: keep this file tight and current. Detailed context lives in ./research/*.
Update "Current State" (§3) as work progresses. Do NOT @import the PRD — it's large and would
load in full every session. Reference the research docs as read-on-demand instead.
-->

# Anthem — Project Memory

## 1. Project Identity

- **Name:** Anthem *(working codename — final name TBD)*
- **One-liner:** A web app where someone describes what they've lived through and receives a complete, original song (lyrics + vocals + music) crafted to make them feel **acknowledged**.
- **Core mission:** Deliver the feeling of being *witnessed* — "you were not supposed to have to be that strong; here is the song that says you were seen." The AI generation is a rented commodity; **the product is the curated, emotionally-safe experience and keepsake around it**, not the audio itself.
- **Success criteria (North Star):** weekly count of **"acknowledged moments"** = songs a user **saved AND replayed ≥1×**. We measure *resonance*, not generation volume. A generated-but-ignored song is a failure.
- **Full context (read on demand, not auto-loaded):**
  - `research/PRD.md` — complete product spec (features, schema, API, metrics)
  - `research/tech-stack.md` — full stack rationale
  - `research/viability-analysis.md` — why we're building this and the hard constraints

## 2. Technical Context

### Stack
- **Frontend:** Next.js (App Router) + React + TypeScript, **web-first** (native/Expo is out of scope for MVP). Tailwind CSS + shadcn/ui. Audio: Howler.js / `<audio>` + wavesurfer.js.
- **State:** TanStack Query (server state — jobs, songs, credits) + Zustand (light UI state). **No Redux.**
- **Forms/validation:** React Hook Form + **Zod** (schemas shared client ↔ server).
- **Backend:** Node.js + TypeScript. **tRPC** for app↔API; plain **REST** route handlers for inbound webhooks. Runs as Netlify Functions.
- **Async pipeline:** Supabase **Queues (pgmq)** → worker (**Netlify Background Function**, 15-min limit; or Supabase Edge Function + pg_cron on free tier) → provider → **REST webhook** finalizes the song.
- **Database:** **Supabase (PostgreSQL)** + Supabase Auth + Supabase Storage. Row Level Security on all tenant tables.
- **Cache / rate limiting:** Upstash Redis (serverless).
- **Payments:** Stripe (credit packs P0; subscriptions P1).
- **Generation vendor:** sunoapi.org (unofficial Suno reseller) behind a **`MusicProvider` abstraction**.
- **Audio storage at scale:** migrate Supabase Storage → Cloudflare R2 (zero egress).
- **Hosting:** Netlify (web + functions). Free tier permits commercial use.

### Key architectural decisions (and why)
- **Generation is async, slow (30s–min), metered, and over an UNOFFICIAL reseller.** Everything is built around this.
- **`MusicProvider` interface from day one** (`generate()`, `getStatus()`, `handleWebhook()`). The upstream can change/vanish — keep it swappable (Udio, ElevenLabs, licensed platforms).
- **Never generate inline.** pgmq + worker + webhook is mandatory, not optional. User requests must not block on generation.
- **Multi-tenancy: org-based, row-level isolation by `organization_id` + RLS.** Every user gets an auto-created personal org on signup. Consumer MVP and future B2B (therapists/wellness) share one model. Schema is P0; org UX is P2.
- **Credits: append-only ledger + cached balance.** Debit **only on generation success**, transactionally. No double-spend.
- **Moderation before enqueue.** Input is screened; crisis content → calm crisis-resources off-ramp (duty of care, P0).

### Coding standards / conventions
- TypeScript **strict**; no `any` without justification.
- **Validate every boundary with Zod**, including untyped webhook payloads.
- **Service-role key is server-only** (worker, webhooks). Never in client bundle. Everything else goes through RLS as the user.
- **Verify webhook signatures** (Suno reseller + Stripe). Reject unsigned/invalid. Make webhook handling **idempotent** (use `idempotency_key`).
- **Never put sensitive intake text (`raw_feeling`) in URLs, logs, or public routes.** Encrypt at rest.
- Rate-limit generation **before** enqueue (Upstash) + hard **credit-balance gate** to cap upstream spend.
- Match existing file style; keep comment density and naming consistent with surrounding code.

## 3. Current State

<!-- UPDATE THIS SECTION AS WORK PROGRESSES -->

- **Phase:** Pre-implementation. **Research complete** (viability, tech stack, PRD all written and in `research/`).
- **Built so far:** Nothing yet — no code scaffolded. **Not yet a git repo** (run `git init` before first commit).
- **In progress:** Awaiting decision to scaffold the repo (monorepo layout, `MusicProvider` interface, Supabase schema/migrations, job-pipeline skeleton).
- **Known issues / tech debt:** None yet. **Open risks to track:** (1) vendor reliability of sunoapi.org, (2) unit economics — revenue/song must exceed cost/song *including regenerations*, (3) emotional-resonance thesis still unvalidated (recommend a manual Wizard-of-Oz test before heavy build).

## 4. Agent Instructions

### How to approach this codebase
- Optimize for the **emotional experience**, not technical capability. The hard part is making output *land gently* — treat tone, copy, and safety as first-class.
- Keep the generation vendor isolated behind `MusicProvider`. Don't couple app logic to sunoapi.org specifics.
- Preserve the async pipeline discipline: enqueue → worker → webhook. Don't "simplify" it into an inline call.

### Ask before changing
- Anything touching **pricing / credit costs / free-tier limits** (affects unit economics).
- **Data model / RLS policy** changes (tenancy and security depend on them).
- Swapping or upgrading the **generation provider** or its cost model.
- Changes to **moderation thresholds** or the crisis off-ramp (safety-critical).

### Never do without explicit approval
- **Never add features that impersonate real, identifiable artists** (voice or "be [named artist]"). Permanent legal red line (ELVIS Act, CA AB 2602/1836). Moderation must block it.
- Never ship generation without the **moderation + crisis off-ramp** in place.
- Never expose the **service-role key** to the client or place secrets in the repo/bundle.
- Never debit credits on enqueue (only on success); never remove idempotency/signature checks on webhooks.
- Never commit secrets; never push to a remote or deploy without being asked.

## 5. File Structure Map

<!-- Update once the repo is scaffolded. Intended layout: -->

- `research/` — source-of-truth planning docs (`PRD.md`, `tech-stack.md`, `viability-analysis.md`).
- `.claude/` — this memory file and any project rules.
- *(planned)* `app/` or `src/app/` — Next.js App Router routes & pages.
- *(planned)* `src/server/` — tRPC routers, `MusicProvider`, worker/queue logic, webhook handlers.
- *(planned)* `src/lib/` — shared Zod schemas, Supabase client, utils.
- *(planned)* `supabase/migrations/` — versioned SQL migrations (via Supabase CLI).
- **Naming:** kebab-case files; PascalCase React components; camelCase vars/functions. Tenant tables always carry `organization_id`.

## 6. External Dependencies

| Service | Purpose | Docs |
|---|---|---|
| Supabase | Postgres DB, Auth, Storage, Queues (pgmq), Edge Functions | https://supabase.com/docs |
| Netlify | Hosting, Functions, Background Functions | https://docs.netlify.com/ |
| sunoapi.org | Music generation (unofficial Suno reseller) — behind `MusicProvider` | https://docs.sunoapi.org/ |
| Stripe | Payments / credit packs | https://docs.stripe.com/ |
| Upstash Redis | Rate limiting + cache | https://upstash.com/docs/redis |
| Cloudflare R2 | Audio object storage at scale (later) | https://developers.cloudflare.com/r2/ |

**Env var names (values live in Netlify/Supabase env, never in repo):**
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `MUSIC_PROVIDER_API_KEY`, `MUSIC_PROVIDER_WEBHOOK_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`. *(Later: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`.)*

**MCP servers available (dev workflow):** Supabase, Netlify, Stripe, Cloudflare, GitHub. Use them for schema/migrations, deploys, and payment setup from within Claude Code.

## 7. User Avatar Reminder

- **Who:** "The Quiet Carrier" — 28–55, has been *the strong one* (caregiver, survivor, held it together through something hard) and has never been acknowledged for it. Not a musician, mildly AI-wary. Secondary: "The Gifter" (makes a song for someone else) and "The Helper" (therapist/coach org — future B2B).
- **Emotional state at use:** vulnerable, hopeful-but-guarded, **low tolerance for a tone-deaf result** — a near-miss doesn't just disappoint, it stings.
- **UX principles:**
  - **Hide the machinery.** Never expose raw "prompt" language; guide with gentle questions (feelings-to-prompt translation is our job).
  - **Land it gently.** Curation, tasteful presentation, warm waiting states. Support regeneration/variations because tonal misses are expected and costly.
  - **Keepsake, not file.** Beautiful, revisitable result (song + lyrics + visual). Sharing/gifting is the primary growth loop.
  - **Safety and calm copy throughout.** Plain language; crisis off-ramp instead of errors.
  - **Mobile-first, accessible (WCAG 2.1 AA)** — recipients often open gift links on a phone.
