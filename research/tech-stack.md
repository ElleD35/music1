# Tech Stack Recommendation

**Date:** 2026-07-21
**Companion to:** [viability-analysis.md](./viability-analysis.md)
**Budget target:** < $50/mo infra until revenue

---

## TL;DR — the recommended stack

| Layer | Recommendation | Why in one line |
|---|---|---|
| **Frontend** | **Next.js (React) web-first**, Expo/React Native deferred to Phase 2 | The product is a shareable *keepsake* experience → needs URLs, SEO, fast iteration. Native can wait. |
| **State** | **TanStack Query** (server state) + **Zustand** (light UI state) | Generation is async server state, not app state. Don't reach for Redux. |
| **Backend** | **Node.js + TypeScript**, **tRPC** for app↔API, plain **REST** for webhooks | Type-share with the frontend; Python's edge (ML libs) is irrelevant since generation is an external API. |
| **Async pipeline** | **Supabase Queues (pgmq)** + **Edge Functions** + **pg_cron** | The single most important architectural choice — songs take 30s–minutes; keep the queue in the DB you already run. |
| **Database** | **Supabase (Postgres)** + Auth + Storage | Relational fits users/songs/jobs/credits; RLS; **official MCP server**; predictable pricing. |
| **Cache / rate-limit** | **Upstash Redis** (serverless) | Free tier, serverless, protects your metered upstream API from abuse. |
| **Payments** | **Stripe** | Required for the product; has an official MCP server. |
| **Audio storage** | Supabase Storage now → **Cloudflare R2** at scale | R2 has zero egress fees; audio egress is your sleeper cost. |
| **Hosting** | **Netlify** (web + functions) + Supabase; **Netlify Background Functions** for the worker | Free tier allows commercial use; Background Functions run up to 15 min; official MCP server. |
| **CI/CD** | GitHub + Netlify Deploy Previews + Supabase CLI migrations via GitHub Actions | Zero-config previews, migrations in version control. |

**This stack is chosen around one fact from the viability analysis: generation is a slow, async, *metered external call over an unofficial reseller*.** Everything below optimizes for (a) handling long-running jobs cleanly, (b) swapping the generation vendor without a rewrite, and (c) keeping fixed infra cheap so the variable generation cost is the only thing that scales.

---

## 1. Frontend

### Recommendation: **Next.js (App Router), React, TypeScript** — web-first

Your stated preference is "React or React Native for cross-platform." My decisive call: **build the MVP as a Next.js web app, not native.** Reasoning tied to the product:

- The defensible product (per the viability doc) is an **emotional keepsake** — the song + the words + a visual, meant to be *revisited and shared*. That wants a **URL, Open Graph share cards, and SEO**, which is web's home turf and React Native's weak spot.
- Web iterates faster than native (no app-store review loop) during the phase where you're still tuning the *emotional* execution — exactly the "hardest challenge" the viability doc flagged.
- You can wrap the web app or add native later. **If you genuinely need native on day one**, use **Expo + Expo Router**, which targets iOS/Android/web from one React Native codebase — but that's a bigger surface to build and debug during an MVP. Don't pay that cost until a test proves you need it.

Docs: [Next.js](https://nextjs.org/docs) · [React](https://react.dev/) · [Expo Router](https://docs.expo.dev/router/introduction/) (Phase 2)

### Key libraries for *our specific* features

- **Audio playback:** [Howler.js](https://howlerjs.com/) or the native `<audio>` element + [wavesurfer.js](https://wavesurfer.xyz/) for waveform/keepsake visuals.
- **Async generation status UI:** [TanStack Query](https://tanstack.com/query/latest) polling + optimistic "we're writing your song…" states; optionally Supabase Realtime for push updates on job completion.
- **Emotional intake form / multi-step wizard:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) (Zod schemas are reused server-side — see backend).
- **Styling:** [Tailwind CSS](https://tailwindcss.com/docs) + [shadcn/ui](https://ui.shadcn.com/) for fast, accessible, on-brand components.
- **Share/keepsake cards:** Next.js [OG Image generation](https://nextjs.org/docs/app/api-reference/functions/image-response).

### State management

- **Server state (the bulk of it):** TanStack Query. Generation jobs, song lists, credit balances are *server* state with loading/refetch/polling semantics — Query handles this natively. This is ~80% of your state needs.
- **Client/UI state:** [Zustand](https://zustand.docs.pmnd.rs/) for the handful of local things (wizard step, audio player state, modals).
- **Do not use Redux.** There's no complex client-side domain model here to justify its boilerplate; server state + a little Zustand covers it.

---

## 2. Backend

### Recommendation: **Node.js + TypeScript**

Your criterion was "whichever has better library support for our needs." Decisive answer: **Node.** The instinct to reach for Python is usually about ML/audio libraries — but **you are not running any models.** Generation is an outbound HTTP call to a Suno reseller. That erases Python's only real advantage here, and Node buys you:

- **End-to-end type safety** with the frontend via tRPC (shared TypeScript types + shared Zod schemas from the intake form).
- One language across web, API, and Edge Functions → smaller team cognitive load, faster MVP.

Docs: [Node.js](https://nodejs.org/docs/latest/api/) · [TypeScript](https://www.typescriptlang.org/docs/)

### API architecture: **tRPC for the app, REST for webhooks** (not GraphQL)

- **tRPC** ([docs](https://trpc.io/docs)) for all app↔backend calls: end-to-end typesafe, zero schema duplication, ideal for a TypeScript monorepo and a single primary client. GraphQL's multi-client/federation strengths don't apply to an MVP with one frontend; it's overhead you don't need.
- **Plain REST endpoints** (Next.js Route Handlers, deployed as Netlify Functions) for the **inbound webhooks** from the generation provider — external callers can't speak tRPC, and webhooks are the backbone of the async pipeline.
- Host tRPC routes in Next.js Route Handlers on Netlify Functions (or a thin standalone worker if you outgrow function limits).

### The async generation pipeline (the core of the backend)

This is the part that makes or breaks the app. A song takes tens of seconds to minutes — **you cannot do it in a request/response cycle**, and Netlify's *synchronous* functions cap at ~60s. Flow:

1. User submits intake → tRPC mutation writes a `jobs` row (`status: queued`) and enqueues a message in **Supabase Queues / pgmq** ([docs](https://supabase.com/docs/guides/queues)).
2. A worker pops the job, calls the **generation vendor behind an abstraction interface**, and stores the returned task ID. Your worker options, cheapest-first: a **Netlify Background Function** ([docs](https://docs.netlify.com/build/functions/background-functions/), up to **15 min** — comfortably covers a single generation and avoids extra infra), a Supabase **Edge Function** triggered by **pg_cron**, or a small **Railway/Fly worker** if orchestration outgrows both.
3. Vendor calls your **REST webhook** on completion → you download the audio to storage, update `jobs.status = done`, decrement credits.
4. Frontend learns via TanStack Query polling or Supabase Realtime and reveals the song.

> **Build the generation call behind a `MusicProvider` interface from day one** (`generate()`, `getStatus()`, `handleWebhook()`). The viability doc's #1 technical risk is that your upstream is an *unofficial reseller with no sanctioned API* — this interface is what lets you swap sunoapi.org → Udio/ElevenLabs/a licensed platform without touching the rest of the app.

### Authentication: **Supabase Auth**

[Supabase Auth](https://supabase.com/docs/guides/auth) — email/OTP + social logins, JWT-based, integrated with Postgres **Row Level Security** so authorization lives next to the data. No separate auth service to run or pay for. (If you later need enterprise SSO, revisit; not an MVP concern.)

> **Safety hook:** the viability doc flags a duty-of-care requirement (users processing trauma). Add a moderation step at intake — screen input, and on crisis-indicating content short-circuit generation to show crisis resources instead. This lives as middleware in the tRPC mutation before enqueue.

---

## 3. Database

### Primary: **Supabase (PostgreSQL)**

Chosen over Firebase and MongoDB Atlas because:

- **The data is relational.** Users ↔ songs ↔ generation jobs ↔ credit ledger ↔ payments have foreign-key relationships and need transactional integrity (you're debiting paid credits). Postgres fits; a document store fights you here.
- **It's a platform, not just a DB:** Auth, Storage, Edge Functions, Realtime, and **Queues (pgmq)** in one managed product → fewer moving parts, which matters for a small team and a tight budget.
- **Official, GA MCP server** (see §5) — directly satisfies your MCP-priority constraint. Firebase/Mongo MCP support is weaker.
- **Predictable pricing.** Supabase is resource-based, not per-operation; Firebase's per-read/write billing gets unpredictable and is 30–50% more expensive at scale for read-heavy apps. ([comparison](https://designrevision.com/blog/supabase-vs-firebase))

Docs: [Supabase](https://supabase.com/docs) · [PostgreSQL](https://www.postgresql.org/docs/)

### Schema approach (sketch)

```
users            (id, email, created_at)            -- managed by Supabase Auth
credits          (user_id, balance, updated_at)     -- or an append-only ledger for auditability
songs            (id, user_id, title, prompt, lyrics, audio_url, status, created_at)
jobs             (id, user_id, song_id, provider, provider_task_id,
                  status[queued|running|done|failed], attempts, error, created_at, updated_at)
intake_sessions  (id, user_id, raw_feeling, moderation_flag, generated_prompt, created_at)
payments         (id, user_id, stripe_id, amount, credits_granted, created_at)
```

- Prefer an **append-only credit ledger** over a mutable balance column — you're handling money-adjacent state and want an audit trail (echoes the viability doc's unit-economics warning about regeneration costs).
- Enforce access with **RLS policies** (`user_id = auth.uid()`); the worker uses the **service-role key** to bypass RLS for system writes.

### Secondary stores

- **Cache & rate limiting: [Upstash Redis](https://upstash.com/docs/redis)** (serverless, free tier, HTTP API works from edge). Use it to **rate-limit generation per user** — critical because every call costs you real money against a metered upstream. Also cache credit balances / hot reads.
- **Queue:** **pgmq inside Supabase** (no extra infra) is the primary recommendation. Only introduce a dedicated broker (e.g., Upstash QStash / BullMQ on Redis) if job volume outgrows pgmq.
- **Search:** **not needed at MVP.** Postgres full-text search covers a user's own library later. No Elasticsearch/Algolia.

### Backup & migration strategy

- **Backups:** Supabase **daily automated backups** on Pro ([docs](https://supabase.com/docs/guides/platform/backups)); enable **Point-in-Time Recovery** when revenue justifies it. Because generated **audio files are large and re-creatable but costly**, treat the DB (source of truth for metadata) as the critical backup target and store audio durably in object storage with lifecycle rules.
- **Migrations:** version-controlled SQL via the **[Supabase CLI](https://supabase.com/docs/guides/local-development)** (`supabase migration new` / `db push`), run in CI (see §4). Never click-edit production schema — keep it in the repo.

---

## 4. Infrastructure & Hosting

### Deployment platform

- **Frontend + tRPC/API + webhooks: [Netlify](https://docs.netlify.com/)** — hosts the Next.js app plus serverless Functions on one platform, with **Deploy Previews** per PR. **Licensing plus vs. the alternative:** Netlify's **Free plan explicitly permits commercial use** within usage limits — so, unlike Vercel's non-commercial Hobby tier, you can launch a revenue product on Free and only move up when you hit usage caps. One less forced upgrade.
- **Async worker: [Netlify Background Functions](https://docs.netlify.com/build/functions/background-functions/)** — up to **15-minute** execution, enough to orchestrate a single generation without standing up separate infra. (Note: Background Functions require a paid plan; on Free, run the worker as a Supabase Edge Function + pg_cron instead.)
- **Backend-as-a-platform: Supabase** (DB/Auth/Storage/Edge Functions/Queues).
- **Escape-hatch worker (only if needed): [Railway](https://docs.railway.com/)** ($5/mo incl. $5 compute), [Fly.io](https://fly.io/docs/) (~$2/mo), or [Render](https://render.com/docs) ($7/mo) — reach for a dedicated always-on worker only if job volume outgrows Background/Edge Functions.

### CI/CD

- **[GitHub](https://docs.github.com/en/actions)** repo → **[Netlify](https://docs.netlify.com/deploy/deploy-overview/)** auto-builds a Deploy Preview on every PR and promotes `main` to production automatically.
- **GitHub Actions** runs tests, typecheck, and `supabase db push` to apply migrations to staging/prod on merge.
- Phase 2 native: **[Expo EAS Build](https://docs.expo.dev/build/introduction/)** for app binaries.

### Estimated monthly cost

**Critical framing:** infra is *not* your cost driver — **generation is.** At ~$0.11/song (viability doc), fixed infra stays small while variable generation cost tracks usage. Plan pricing so revenue-per-song exceeds generation-cost-per-song *including regenerations*.

| Stage | Netlify | Supabase | Upstash | Worker | **Fixed infra** | Generation (variable) |
|---|---|---|---|---|---|---|
| **MVP / pre-revenue** | $0 (Free, commercial OK) | $0 (Free) | $0 (Free) | $0 (Edge Fn) | **~$0/mo** | ~$5–19/mo reseller floor |
| **~1k users** | $0–19 (Free→Pro) | $25 (Pro) | $0–10 | $0 (Bg Fn) | **~$25–54/mo** | *dominant, usage-driven* |
| **~10k users** | $19+ (Pro + usage) | $25–100 (usage) | $10 | $0–20 | **~$55–150/mo** | *dominant — the real number* |

- **You stay at ~$0 fixed infra through MVP and can launch commercially on free tiers** — Netlify's commercial-friendly Free plan means the first real step up is **Supabase Pro ($25)** for daily backups, not a hosting upgrade. The Netlify Pro ($19) step comes only when function/bandwidth usage demands it.
- At 10k users, **fixed infra is still a rounding error next to generation spend.** Watch **audio egress** — migrate audio to **[Cloudflare R2](https://developers.cloudflare.com/r2/)** (zero egress fees) before storage bandwidth becomes a line item.

Sources: [Supabase pricing](https://supabase.com/pricing) · [Netlify pricing](https://www.netlify.com/pricing/) · [Railway pricing](https://railway.com/pricing) · [Upstash pricing](https://upstash.com/pricing)

---

## 5. MCP Server Availability

Strong story here — most of the stack has **official** MCP servers, directly satisfying your MCP-priority constraint. What that enables in the Claude Code workflow:

| Component | MCP server | What it unlocks in dev |
|---|---|---|
| **Supabase** | **Official, GA, hosted** at `mcp.supabase.com` ([docs](https://supabase.com/docs/guides/getting-started/mcp)) | Run SQL, create/apply **migrations**, manage Edge Functions, generate TypeScript types, inspect data — RLS-aware — straight from Claude Code. Biggest day-to-day win: schema + query iteration without leaving the editor. |
| **Netlify** | **Official** ([repo](https://github.com/netlify/netlify-mcp), [announcement](https://www.netlify.com/blog/netlify-mcp-server-ai-agents-deploy-your-code/)) | Create projects, build & **deploy**, read logs, manage env vars/secrets, forms, and access controls — full code-to-production loop from Claude Code. |
| **Stripe** | **Official** ([docs](https://docs.stripe.com/mcp)) | Create products/prices, inspect payments, test webhooks while building the credits/checkout flow. |
| **Cloudflare** | **Official** ([docs](https://developers.cloudflare.com/agents/model-context-protocol/)) | Manage R2 buckets/DNS when you offload audio storage. |
| **Upstash** | **Context7** ([context7.com](https://context7.com/)) pulls live, version-specific docs into context | Fewer hallucinated/outdated API calls when wiring Redis and other libs. |
| **GitHub** | **Official** ([docs](https://github.com/github/github-mcp-server)) | PRs, issues, Actions status from Claude Code. |

**Net effect:** the loop of *"change schema → apply migration → deploy → check logs → adjust Stripe product"* can largely happen inside Claude Code via official servers — meaningfully faster iteration during the emotionally-tuned MVP phase where you'll be changing things constantly.

> One caution consistent with the viability doc: **there is no MCP server (and no official API at all) for the generation vendor.** That integration is hand-rolled HTTP behind your `MusicProvider` interface — a reason to keep it isolated and swappable.

---

## 6. Integration Map

### How the pieces connect

```
                         ┌────────────────────────────────────────────┐
                         │   Next.js on Netlify (React + Tailwind)     │
     User ───────────────│   • intake wizard (RHF + Zod)               │
                         │   • TanStack Query (poll job status)        │
                         │   • Howler/wavesurfer playback + OG cards   │
                         └───────────────┬───────────────┬────────────┘
                                 tRPC    │               │  REST webhook (inbound)
                                         ▼               ▼
                         ┌────────────────────────────────────────────┐
                         │   API layer (tRPC routes + Route Handlers)  │
                         │   • auth (Supabase JWT/RLS)                 │
                         │   • moderation middleware (duty of care)    │
                         │   • Upstash rate-limit before spend         │
                         └───────┬───────────────┬───────────┬────────┘
                                 │ enqueue        │ read/write │ webhook
                                 ▼                ▼            │
                     ┌────────────────┐   ┌──────────────┐    │
                     │ Supabase pgmq  │   │  Postgres    │    │
                     │ Queue          │   │  + RLS       │    │
                     └───────┬────────┘   └──────────────┘    │
                    pg_cron  │ pop                            │
                             ▼                                │
                     ┌───────────────────┐   outbound HTTP    │
                     │ Worker (Netlify Bg │──────────────────▶│  ┌─────────────────┐
                     │ Fn / Edge Fn)      │                   └──│ MusicProvider   │
                     │  MusicProvider     │◀── webhook on done ──│ (sunoapi.org →  │
                     └─────────┬─────────┘                       │  swappable)     │
                               │ store audio                     └─────────────────┘
                               ▼
                     ┌───────────────────┐        ┌──────────────┐
                     │ Supabase Storage   │  ───▶  │ Cloudflare R2 │ (at scale)
                     │ (audio files)      │        └──────────────┘
                     └───────────────────┘
        Stripe ──(webhook)──▶ API ──▶ credit ledger in Postgres
```

### Potential integration pain points (and mitigations)

1. **Serverless timeouts vs. long generation.** Netlify's *synchronous* functions cap at ~60s — well short of a full generation. **Background Functions** stretch to 15 min, but you still shouldn't block a user request on them. → **Never generate inline.** The pgmq + worker + webhook pattern above is non-negotiable, not a nice-to-have.
2. **Unofficial upstream reliability & webhook trust.** The reseller can change, rate-limit, or fail; webhooks can be spoofed. → `MusicProvider` abstraction + **verify webhook signatures/secrets** + idempotent job handling + retry/backoff with a dead-letter state on `jobs`.
3. **RLS vs. system writes.** The worker and Stripe webhooks must write on behalf of users → use the **service-role key** in trusted server contexts only (never shipped to the client); keep RLS strict everywhere else.
4. **Credit/money race conditions.** Concurrent generations could over-spend a balance. → debit **transactionally** (Postgres row locks or an append-only ledger with a check), and **rate-limit via Upstash before** enqueuing to cap worst-case spend — directly addressing the viability doc's "8 regenerations = $0.90/moment" concern.
5. **Audio egress cost creep.** Serving MP3s from Supabase Storage bandwidth adds up. → plan the **R2 migration path** early (store the URL, not the bytes, in Postgres, so the backing store is swappable).
6. **Type drift across boundaries.** tRPC keeps app↔API in sync, but the **external webhook payload is untyped** → parse it with a **Zod schema** at the REST boundary and fail loudly on shape changes.
7. **Netlify plan limits (not licensing).** The Free plan *allows* commercial use, so there's no license gotcha — but Background Functions require a paid plan, and functions/bandwidth have Free-tier caps. → On Free, run the worker as a Supabase Edge Function; move to Netlify Pro ($19) when usage (not licensing) forces it.

---

## Bottom line

This stack is **boring on purpose** where it can be (Next.js + Supabase + Stripe + Netlify — all with official MCP servers, all with free/cheap tiers that keep you under $50/mo fixed infra through ~1k users) and **deliberately careful** where the product is actually hard: an **async job pipeline** for slow generation, a **swappable provider abstraction** over an unofficial upstream, **transactional credit accounting**, and a **moderation gate** for duty of care. Those four are the engineering that reflects the viability analysis — the rest is off-the-shelf so your time goes into the emotional execution that's the real moat.

---

### Documentation index
**Frontend:** [Next.js](https://nextjs.org/docs) · [React](https://react.dev/) · [Expo Router](https://docs.expo.dev/router/introduction/) · [TanStack Query](https://tanstack.com/query/latest) · [Zustand](https://zustand.docs.pmnd.rs/) · [React Hook Form](https://react-hook-form.com/) · [Zod](https://zod.dev/) · [Tailwind CSS](https://tailwindcss.com/docs) · [shadcn/ui](https://ui.shadcn.com/) · [Howler.js](https://howlerjs.com/) · [wavesurfer.js](https://wavesurfer.xyz/)
**Backend:** [Node.js](https://nodejs.org/docs/latest/api/) · [TypeScript](https://www.typescriptlang.org/docs/) · [tRPC](https://trpc.io/docs) · [Supabase Auth](https://supabase.com/docs/guides/auth) · [Supabase Queues (pgmq)](https://supabase.com/docs/guides/queues) · [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
**Database:** [Supabase](https://supabase.com/docs) · [PostgreSQL](https://www.postgresql.org/docs/) · [Supabase CLI / migrations](https://supabase.com/docs/guides/local-development) · [Supabase backups](https://supabase.com/docs/guides/platform/backups) · [Upstash Redis](https://upstash.com/docs/redis)
**Infra:** [Netlify](https://docs.netlify.com/) · [Netlify Functions](https://docs.netlify.com/build/functions/overview/) · [Netlify Background Functions](https://docs.netlify.com/build/functions/background-functions/) · [Railway](https://docs.railway.com/) · [Fly.io](https://fly.io/docs/) · [Render](https://render.com/docs) · [Cloudflare R2](https://developers.cloudflare.com/r2/) · [GitHub Actions](https://docs.github.com/en/actions) · [Expo EAS Build](https://docs.expo.dev/build/introduction/)
**Payments & MCP:** [Stripe](https://docs.stripe.com/) · [Stripe MCP](https://docs.stripe.com/mcp) · [Supabase MCP](https://supabase.com/docs/guides/getting-started/mcp) · [Netlify MCP](https://github.com/netlify/netlify-mcp) · [Cloudflare MCP](https://developers.cloudflare.com/agents/model-context-protocol/) · [GitHub MCP](https://github.com/github/github-mcp-server) · [Context7](https://context7.com/)
