# Skills Inventory

**Date:** 2026-07-21
**Source:** derived from [PRD.md](./PRD.md) + [tech-stack.md](./tech-stack.md)
**Skills reference:** [Claude Code Skills docs](https://code.claude.com/docs/en/skills)

## How to read this

These are the **distinct build/maintenance capabilities** needed to construct Anthem. Each maps to a candidate Claude Code **skill** — a directory `.claude/skills/<skill-name>/SKILL.md` with YAML frontmatter (`name`, `description`, optional `allowed-tools`) plus optional bundled scripts/templates/reference files. Per the docs: the **directory name becomes the `/command`** (kebab-case), the **`description` drives auto-invocation** (put the key use case first; it's truncated ~1,536 chars in the listing), and a **skill body loads only when invoked**, so procedural detail is cheap until used.

Not all of these must become formal SKILL.md files — several are foundational and might be done once during scaffolding. They are listed as skills so nothing is missed. A **"Skills we do NOT need (MVP)"** section at the end scopes out the tempting-but-out-of-scope ones.

**Complexity legend:** Simple = a few well-trodden steps · Moderate = multi-step, some integration risk · Complex = touches money/safety/concurrency/unofficial-vendor, high blast radius.

### Summary table

| # | Skill | Category | Complexity |
|---|---|---|---|
| 1 | project-scaffold | Infra | Moderate |
| 2 | supabase-migration | Database | Moderate |
| 3 | rls-policy-authoring | Database / AuthZ | Complex |
| 4 | db-seed-testdata | Database | Simple |
| 5 | db-query-optimization | Database | Moderate |
| 6 | credit-ledger-integrity | Database / Domain | Complex |
| 7 | supabase-auth-setup | Auth | Moderate |
| 8 | org-multitenancy-authz | AuthZ | Complex |
| 9 | music-provider-integration | API integration | Complex |
| 10 | async-job-pipeline | API integration | Complex |
| 11 | webhook-handler | API integration | Complex |
| 12 | stripe-payments-integration | API integration | Complex |
| 13 | rate-limiting-upstash | API integration | Moderate |
| 14 | content-moderation-safety | API integration / Safety | Complex |
| 15 | object-storage-audio | API integration | Moderate |
| 16 | trpc-endpoint | Backend/Frontend | Moderate |
| 17 | zod-schema | Validation | Simple |
| 18 | react-feature-component | Frontend | Moderate |
| 19 | intake-wizard | Frontend | Moderate |
| 20 | audio-keepsake-view | Frontend | Moderate |
| 21 | state-query-hooks | Frontend | Simple |
| 22 | unit-integration-testing | Testing | Moderate |
| 23 | e2e-testing | Testing | Moderate |
| 24 | accessibility-audit | Testing | Moderate |
| 25 | netlify-deploy | Deployment | Moderate |
| 26 | ci-cd-pipeline | Deployment | Moderate |
| 27 | env-secrets-management | Infra | Simple |
| 28 | error-handling-observability | Errors/Logging | Moderate |
| 29 | api-docs-generation | Documentation | Simple |
| 30 | adr-and-memory-update | Documentation | Simple |

---

## A. Database Operations

### 1. project-scaffold
1. **SKILL NAME:** `project-scaffold`
2. **DESCRIPTION:** Bootstrap the monorepo: Next.js (App Router, TS strict) + Tailwind + shadcn/ui, tRPC wiring, Supabase client, Zod, folder layout (`src/app`, `src/server`, `src/lib`, `supabase/migrations`). One-time foundation.
3. **INPUT:** tech-stack.md, target folder conventions, package manager choice.
4. **OUTPUT:** a running skeleton app with typecheck/lint/test configured and a green dev server.
5. **DEPENDENCIES:** Next.js, TypeScript, Tailwind, shadcn/ui, tRPC, Zod, Supabase JS. *Skills:* none (root). *APIs:* none.
6. **DOCS:** [Next.js](https://nextjs.org/docs) · [Tailwind](https://tailwindcss.com/docs) · [shadcn/ui](https://ui.shadcn.com/) · [tRPC](https://trpc.io/docs)
7. **COMPLEXITY:** Moderate
8. **EXAMPLE:** `/project-scaffold` — or "scaffold the Next.js + Supabase monorepo per tech-stack.md."

### 2. supabase-migration
1. **SKILL NAME:** `supabase-migration`
2. **DESCRIPTION:** Author and apply versioned SQL migrations (tables, Postgres enums, constraints, indexes) via the Supabase CLI. Use whenever the schema changes. Enforces "migrations in version control, never click-edit prod."
3. **INPUT:** the schema change intent; §4 of the PRD (table/field definitions).
4. **OUTPUT:** a new `supabase/migrations/*.sql` file, applied to local/staging, with types regenerated.
5. **DEPENDENCIES:** Supabase CLI, Postgres. *Skills:* → rls-policy-authoring (pair every tenant table with RLS), db-query-optimization. *MCP:* Supabase MCP.
6. **DOCS:** [Supabase local dev/CLI](https://supabase.com/docs/guides/local-development) · [Postgres](https://www.postgresql.org/docs/) · [Supabase MCP](https://supabase.com/docs/guides/getting-started/mcp)
7. **COMPLEXITY:** Moderate
8. **EXAMPLE:** `/supabase-migration add moderation_events table` — or "create a migration for the songs table from the PRD."

### 3. rls-policy-authoring
1. **SKILL NAME:** `rls-policy-authoring`
2. **DESCRIPTION:** Write and verify Row Level Security policies enforcing tenant isolation by `organization_id` via `org_members`/`auth.uid()`. Also defines the minimal public-read policy for share pages. Safety-critical.
3. **INPUT:** table name + tenancy rule; the org-membership model (§4.3 PRD).
4. **OUTPUT:** RLS policies in a migration + a test proving cross-tenant reads are denied and share-slug reads expose only presentation fields.
5. **DEPENDENCIES:** Postgres RLS. *Skills:* → supabase-migration, org-multitenancy-authz, unit-integration-testing. *APIs:* none.
6. **DOCS:** [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
7. **COMPLEXITY:** Complex (a wrong policy leaks tenant data)
8. **EXAMPLE:** `/rls-policy-authoring songs` — or "add RLS so users only see their org's songs."

### 4. db-seed-testdata
1. **SKILL NAME:** `db-seed-testdata`
2. **DESCRIPTION:** Generate realistic seed/fixture data (users, personal orgs, intakes, songs, credit grants) for local dev and tests, respecting constraints and RLS.
3. **INPUT:** schema; desired volume/scenarios (e.g., a user mid-generation, a failed job).
4. **OUTPUT:** a seed script and reproducible dataset.
5. **DEPENDENCIES:** Supabase CLI/SQL, a faker lib. *Skills:* → supabase-migration.
6. **DOCS:** [Supabase seeding](https://supabase.com/docs/guides/local-development/seeding-your-database)
7. **COMPLEXITY:** Simple
8. **EXAMPLE:** `/db-seed-testdata` — or "seed 10 users each with a completed song."

### 5. db-query-optimization
1. **SKILL NAME:** `db-query-optimization`
2. **DESCRIPTION:** Add/verify indexes for the hot query paths (worker polling `jobs(status,created_at)`, webhook lookup `jobs(provider_task_id)`, library `songs(user_id,created_at)`, RLS `org_members(user_id)`), and analyze plans with EXPLAIN.
3. **INPUT:** the query or endpoint; §4.4 index strategy.
4. **OUTPUT:** index migrations + an EXPLAIN-backed note that the path uses them.
5. **DEPENDENCIES:** Postgres. *Skills:* → supabase-migration.
6. **DOCS:** [Postgres indexes](https://www.postgresql.org/docs/current/indexes.html) · [Supabase performance](https://supabase.com/docs/guides/database/query-optimization)
7. **COMPLEXITY:** Moderate
8. **EXAMPLE:** `/db-query-optimization jobs worker poll` — or "make sure the worker's job poll is indexed."

### 6. credit-ledger-integrity
1. **SKILL NAME:** `credit-ledger-integrity`
2. **DESCRIPTION:** Implement/maintain the append-only credit ledger + cached balance: transactional grant/debit, **debit only on generation success**, `balance >= 0` guard, no double-spend under concurrency. Money-adjacent — highest care.
3. **INPUT:** action + cost; ledger schema (§4.2); the pricing/cost model.
4. **OUTPUT:** transactional debit/grant functions (SQL/RPC) + concurrency tests proving no over-spend.
5. **DEPENDENCIES:** Postgres transactions/row locks or RPC. *Skills:* → supabase-migration, async-job-pipeline, stripe-payments-integration, unit-integration-testing.
6. **DOCS:** [Postgres transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html) · [Supabase RPC/functions](https://supabase.com/docs/guides/database/functions)
7. **COMPLEXITY:** Complex
8. **EXAMPLE:** `/credit-ledger-integrity` — or "debit credits atomically when a job completes."

---

## B. Authentication & Authorization

### 7. supabase-auth-setup
1. **SKILL NAME:** `supabase-auth-setup`
2. **DESCRIPTION:** Configure Supabase Auth (email OTP/magic link + Google), session persistence, protected-route redirects, and the **post-signup trigger that auto-creates a personal organization** and a `profiles` row.
3. **INPUT:** desired providers; the personal-org bootstrap rule (§3.1 PRD).
4. **OUTPUT:** working signup/login/logout, session middleware, and verified personal-org creation on first signup.
5. **DEPENDENCIES:** Supabase Auth, Next.js middleware. *Skills:* → supabase-migration (trigger), rls-policy-authoring. *APIs:* Google OAuth.
6. **DOCS:** [Supabase Auth](https://supabase.com/docs/guides/auth) · [Auth with Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
7. **COMPLEXITY:** Moderate
8. **EXAMPLE:** `/supabase-auth-setup` — or "add Google login and auto-create a personal org on signup."

### 8. org-multitenancy-authz
1. **SKILL NAME:** `org-multitenancy-authz`
2. **DESCRIPTION:** Enforce org-scoped access and roles (owner/admin/member): membership resolution, role gating for org-management actions, and the rule that every tenant table carries a non-null `organization_id`. Underpins future B2B.
3. **INPUT:** the action + required role; org model (§4).
4. **OUTPUT:** reusable authz helpers/guards + tests for role-gated and cross-tenant cases.
5. **DEPENDENCIES:** Supabase Auth/RLS. *Skills:* → rls-policy-authoring, trpc-endpoint.
6. **DOCS:** [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) · [Custom claims/RBAC](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac)
7. **COMPLEXITY:** Complex
8. **EXAMPLE:** `/org-multitenancy-authz invite member` — or "gate org invites to owner/admin only."

---

## C. API Integration with External Services

### 9. music-provider-integration
1. **SKILL NAME:** `music-provider-integration`
2. **DESCRIPTION:** Implement/maintain the **`MusicProvider` abstraction** (`generate()`, `getStatus()`, `handleWebhook()`) over sunoapi.org, keeping the unofficial reseller isolated and swappable. No app logic may call the vendor directly.
3. **INPUT:** the generation prompt/params; provider API docs + key; webhook contract.
4. **OUTPUT:** a typed provider client + interface, with a fake/mock implementation for tests.
5. **DEPENDENCIES:** fetch/HTTP client, Zod (validate responses). *Skills:* → async-job-pipeline, webhook-handler, zod-schema. *APIs:* **sunoapi.org** (`MUSIC_PROVIDER_API_KEY`).
6. **DOCS:** [sunoapi.org](https://docs.sunoapi.org/)
7. **COMPLEXITY:** Complex (unofficial upstream, changeable)
8. **EXAMPLE:** `/music-provider-integration` — or "add getStatus() to the MusicProvider."

### 10. async-job-pipeline
1. **SKILL NAME:** `async-job-pipeline`
2. **DESCRIPTION:** Build the enqueue→worker→webhook flow: write a `jobs` row + pgmq enqueue, a worker (Netlify Background Function / Supabase Edge Function) that pops and calls the provider, plus bounded retries, backoff, and dead-letter. Enforces "never generate inline."
3. **INPUT:** job type/payload; queue + worker runtime choice.
4. **OUTPUT:** working queue, worker, status transitions, retry/dead-letter, and job-status reads.
5. **DEPENDENCIES:** Supabase pgmq, Netlify Background/Edge Functions, pg_cron. *Skills:* → music-provider-integration, webhook-handler, credit-ledger-integrity, error-handling-observability.
6. **DOCS:** [Supabase Queues (pgmq)](https://supabase.com/docs/guides/queues) · [Netlify Background Functions](https://docs.netlify.com/build/functions/background-functions/) · [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
7. **COMPLEXITY:** Complex
8. **EXAMPLE:** `/async-job-pipeline generate` — or "wire generation through pgmq and a background worker."

### 11. webhook-handler
1. **SKILL NAME:** `webhook-handler`
2. **DESCRIPTION:** Build signed, **idempotent** REST webhook receivers (generation-complete from the Suno reseller; Stripe events). Verify signatures, Zod-parse the untyped payload at the boundary, dedupe via `idempotency_key`, finalize state.
3. **INPUT:** provider webhook schema + signing secret.
4. **OUTPUT:** hardened webhook routes with signature verification, idempotency, and tests for duplicate/invalid deliveries.
5. **DEPENDENCIES:** Netlify Functions, Zod, crypto/HMAC. *Skills:* → async-job-pipeline, stripe-payments-integration, credit-ledger-integrity, zod-schema.
6. **DOCS:** [Netlify Functions](https://docs.netlify.com/build/functions/overview/) · [Stripe webhooks](https://docs.stripe.com/webhooks) · [sunoapi.org](https://docs.sunoapi.org/)
7. **COMPLEXITY:** Complex
8. **EXAMPLE:** `/webhook-handler suno` — or "add the signed Suno completion webhook."

### 12. stripe-payments-integration
1. **SKILL NAME:** `stripe-payments-integration`
2. **DESCRIPTION:** Implement credit-pack purchases: Stripe Checkout sessions, customer mapping, and the webhook that grants credits idempotently. Subscriptions are P1.
3. **INPUT:** product/price definitions; the credit-grant mapping.
4. **OUTPUT:** checkout endpoint, Stripe webhook → ledger grant, `payments` records, tests.
5. **DEPENDENCIES:** Stripe SDK. *Skills:* → webhook-handler, credit-ledger-integrity, trpc-endpoint. *APIs:* **Stripe** (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`). *MCP:* Stripe MCP.
6. **DOCS:** [Stripe Checkout](https://docs.stripe.com/payments/checkout) · [Stripe webhooks](https://docs.stripe.com/webhooks) · [Stripe MCP](https://docs.stripe.com/mcp)
7. **COMPLEXITY:** Complex
8. **EXAMPLE:** `/stripe-payments-integration` — or "add a $X credit pack via Stripe Checkout."

### 13. rate-limiting-upstash
1. **SKILL NAME:** `rate-limiting-upstash`
2. **DESCRIPTION:** Enforce per-user/per-org rate limits (generation, intake, checkout) with Upstash Redis, applied **before enqueue**, plus a hard credit-balance gate — capping spend against the metered upstream.
3. **INPUT:** the action + limit policy (§5.4 PRD); user/org id.
4. **OUTPUT:** reusable limiter middleware + tests for limit/allow/deny.
5. **DEPENDENCIES:** `@upstash/ratelimit`, `@upstash/redis`. *Skills:* → trpc-endpoint, credit-ledger-integrity. *APIs:* **Upstash** (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`).
6. **DOCS:** [Upstash Redis](https://upstash.com/docs/redis) · [@upstash/ratelimit](https://github.com/upstash/ratelimit)
7. **COMPLEXITY:** Moderate
8. **EXAMPLE:** `/rate-limiting-upstash generation` — or "limit free users to 5 generations/hour."

### 14. content-moderation-safety
1. **SKILL NAME:** `content-moderation-safety`
2. **DESCRIPTION:** Screen intake text before generation; block disallowed content (real-artist impersonation, hate, minors, harassment) and route **crisis** content to a calm crisis-resources screen (e.g., 988). Log to `moderation_events`. Duty-of-care, safety-critical; tuned to NOT block ordinary grief.
3. **INPUT:** intake free-text; policy/category list; locale.
4. **OUTPUT:** a moderation function returning approve/block/crisis + logged event, plus the crisis-resource UI data. Tests covering grief-allowed vs crisis-blocked.
5. **DEPENDENCIES:** a moderation classifier/LLM + rule list; static crisis-resource data. *Skills:* → intake-wizard, async-job-pipeline (gates enqueue), error-handling-observability.
6. **DOCS:** [Anthropic API](https://docs.claude.com/en/api/overview) (LLM classifier) · [988 Lifeline](https://988lifeline.org/)
7. **COMPLEXITY:** Complex (false negatives are a safety failure; false positives harm the core UX)
8. **EXAMPLE:** `/content-moderation-safety` — or "screen intake and show crisis resources on self-harm signals."

### 15. object-storage-audio
1. **SKILL NAME:** `object-storage-audio`
2. **DESCRIPTION:** Persist generated audio (and keepsake images) to Supabase Storage now, with a swappable path to Cloudflare R2 (store URLs in Postgres, not bytes). Handle signed URLs and access scoping.
3. **INPUT:** provider audio URL/bytes; song id; visibility (private/public share).
4. **OUTPUT:** stored asset + persisted `audio_url`/`image_url`, with a storage adapter that can switch to R2.
5. **DEPENDENCIES:** Supabase Storage SDK; (later) R2/S3 client. *Skills:* → async-job-pipeline, music-provider-integration.
6. **DOCS:** [Supabase Storage](https://supabase.com/docs/guides/storage) · [Cloudflare R2](https://developers.cloudflare.com/r2/)
7. **COMPLEXITY:** Moderate
8. **EXAMPLE:** `/object-storage-audio` — or "download the finished audio to storage and save its URL."

---

## D. Frontend Component Generation

### 16. trpc-endpoint
1. **SKILL NAME:** `trpc-endpoint`
2. **DESCRIPTION:** Add an end-to-end typesafe tRPC procedure (input Zod schema, auth/rate-limit middleware, handler, client hook). The standard way to expose app↔API behavior.
3. **INPUT:** procedure name, input/output shape, auth + rate-limit requirements.
4. **OUTPUT:** a router procedure + typed client hook + test.
5. **DEPENDENCIES:** tRPC, Zod. *Skills:* → zod-schema, org-multitenancy-authz, rate-limiting-upstash.
6. **DOCS:** [tRPC](https://trpc.io/docs) · [tRPC + Next.js](https://trpc.io/docs/client/nextjs)
7. **COMPLEXITY:** Moderate
8. **EXAMPLE:** `/trpc-endpoint songs.regenerate` — or "add a tRPC procedure to regenerate a song."

### 17. zod-schema
1. **SKILL NAME:** `zod-schema`
2. **DESCRIPTION:** Define shared Zod schemas used across client, server, and webhook boundaries (intake input, job payloads, provider/Stripe webhook payloads). Single source of truth for validation + inferred types.
3. **INPUT:** the data shape + rules (lengths, enums per §4.5 PRD).
4. **OUTPUT:** a schema module + inferred TS types, reused everywhere.
5. **DEPENDENCIES:** Zod. *Skills:* used by trpc-endpoint, webhook-handler, intake-wizard.
6. **DOCS:** [Zod](https://zod.dev/)
7. **COMPLEXITY:** Simple
8. **EXAMPLE:** `/zod-schema intake` — or "make a shared Zod schema for the intake form."

### 18. react-feature-component
1. **SKILL NAME:** `react-feature-component`
2. **DESCRIPTION:** Build a React feature/screen with Tailwind + shadcn/ui, wired to TanStack Query hooks, following the calm, emotionally-considered UX and mobile-first + WCAG 2.1 AA rules.
3. **INPUT:** the feature spec (a PRD §3 story) + design/tone guidance.
4. **OUTPUT:** an accessible, responsive component with loading/empty/error states.
5. **DEPENDENCIES:** React, Tailwind, shadcn/ui, TanStack Query. *Skills:* → state-query-hooks, accessibility-audit.
6. **DOCS:** [React](https://react.dev/) · [Tailwind](https://tailwindcss.com/docs) · [shadcn/ui](https://ui.shadcn.com/)
7. **COMPLEXITY:** Moderate
8. **EXAMPLE:** `/react-feature-component library` — or "build the song library screen."

### 19. intake-wizard
1. **SKILL NAME:** `intake-wizard`
2. **DESCRIPTION:** Build the multi-step emotional intake (React Hook Form + Zod): gentle questions (recipient, story, tone, genre, extras), save/resume via `intake_sessions`, and the server-side feelings-to-prompt translation. Never expose raw prompt language.
3. **INPUT:** the intake field spec (§3.2 PRD); tone/genre presets; prompt templates.
4. **OUTPUT:** a working, accessible wizard that persists sessions and produces `generated_prompt`, gated by moderation.
5. **DEPENDENCIES:** RHF, Zod, shadcn/ui. *Skills:* → zod-schema, content-moderation-safety, trpc-endpoint.
6. **DOCS:** [React Hook Form](https://react-hook-form.com/) · [Zod](https://zod.dev/)
7. **COMPLEXITY:** Moderate
8. **EXAMPLE:** `/intake-wizard` — or "build the emotional intake wizard from the PRD."

### 20. audio-keepsake-view
1. **SKILL NAME:** `audio-keepsake-view`
2. **DESCRIPTION:** Build the result/keepsake experience: audio playback (Howler/`<audio>` + wavesurfer), lyrics display (time-synced highlighting P1), tasteful visual, rename/download, and OG share cards for the public keepsake page.
3. **INPUT:** song data (audio_url, lyrics, image, duration); share/public state.
4. **OUTPUT:** an accessible player + lyrics + share-ready page with OG metadata.
5. **DEPENDENCIES:** Howler.js, wavesurfer.js, Next.js OG image. *Skills:* → react-feature-component, accessibility-audit.
6. **DOCS:** [Howler.js](https://howlerjs.com/) · [wavesurfer.js](https://wavesurfer.xyz/) · [Next.js OG image](https://nextjs.org/docs/app/api-reference/functions/image-response)
7. **COMPLEXITY:** Moderate
8. **EXAMPLE:** `/audio-keepsake-view` — or "build the song playback + lyrics keepsake page."

### 21. state-query-hooks
1. **SKILL NAME:** `state-query-hooks`
2. **DESCRIPTION:** Create TanStack Query hooks for server state (jobs polling, songs, credit balance) and Zustand stores for light UI state (wizard step, player). Standardizes loading/refetch/polling. No Redux.
3. **INPUT:** the data/endpoint + refetch/polling needs (e.g., poll job until done).
4. **OUTPUT:** typed hooks/stores with correct cache keys and polling behavior.
5. **DEPENDENCIES:** TanStack Query, Zustand. *Skills:* → trpc-endpoint.
6. **DOCS:** [TanStack Query](https://tanstack.com/query/latest) · [Zustand](https://zustand.docs.pmnd.rs/)
7. **COMPLEXITY:** Simple
8. **EXAMPLE:** `/state-query-hooks job status` — or "add a hook that polls a job until it's done."

---

## E. Testing & Validation

### 22. unit-integration-testing
1. **SKILL NAME:** `unit-integration-testing`
2. **DESCRIPTION:** Write unit/integration tests (Vitest + Testing Library) for domain logic — especially credit debits, moderation decisions, RLS isolation, and webhook idempotency. Prioritizes the money/safety/tenancy paths.
3. **INPUT:** the unit under test + its critical cases.
4. **OUTPUT:** passing tests + coverage on the risky paths.
5. **DEPENDENCIES:** Vitest, @testing-library/react, Supabase test harness. *Skills:* → credit-ledger-integrity, rls-policy-authoring, webhook-handler.
6. **DOCS:** [Vitest](https://vitest.dev/) · [Testing Library](https://testing-library.com/)
7. **COMPLEXITY:** Moderate
8. **EXAMPLE:** `/unit-integration-testing credits` — or "test that credits can't go negative under concurrency."

### 23. e2e-testing
1. **SKILL NAME:** `e2e-testing`
2. **DESCRIPTION:** Playwright end-to-end tests for the core flows: signup → intake → (mocked) generation → keepsake; and checkout → credit grant. Uses the `MusicProvider` mock to avoid real spend.
3. **INPUT:** the user flow + a mocked provider/Stripe.
4. **OUTPUT:** reliable E2E specs runnable in CI.
5. **DEPENDENCIES:** Playwright. *Skills:* → music-provider-integration (mock), stripe-payments-integration (test mode).
6. **DOCS:** [Playwright](https://playwright.dev/) · [Stripe test mode](https://docs.stripe.com/test-mode)
7. **COMPLEXITY:** Moderate
8. **EXAMPLE:** `/e2e-testing intake-to-song` — or "add an E2E test for the full song flow with a mocked provider."

### 24. accessibility-audit
1. **SKILL NAME:** `accessibility-audit`
2. **DESCRIPTION:** Verify WCAG 2.1 AA: keyboard nav, focus states, contrast ≥4.5:1, labeled fields, `aria-live` for generation status, and lyrics-as-transcript. Run axe checks on key screens.
3. **INPUT:** the screen/component to audit.
4. **OUTPUT:** an axe report + fixes for violations.
5. **DEPENDENCIES:** axe-core / @axe-core/playwright. *Skills:* → react-feature-component, audio-keepsake-view, e2e-testing.
6. **DOCS:** [WCAG 2.1 quickref](https://www.w3.org/WAI/WCAG21/quickref/) · [axe-core](https://github.com/dequelabs/axe-core)
7. **COMPLEXITY:** Moderate
8. **EXAMPLE:** `/accessibility-audit intake-wizard` — or "run an a11y audit on the wizard."

---

## F. Deployment & Infrastructure

### 25. netlify-deploy
1. **SKILL NAME:** `netlify-deploy`
2. **DESCRIPTION:** Configure Netlify for the Next.js app + Functions + Background Functions: `netlify.toml`, function routing, Deploy Previews, and env wiring. Deploy/preview from Claude Code via the Netlify MCP.
3. **INPUT:** build settings; which functions are background vs sync; env var names.
4. **OUTPUT:** a working deploy + preview URLs and green build logs.
5. **DEPENDENCIES:** Netlify CLI/platform. *Skills:* → env-secrets-management, ci-cd-pipeline. *MCP:* Netlify MCP.
6. **DOCS:** [Netlify deploy](https://docs.netlify.com/deploy/deploy-overview/) · [Netlify Functions](https://docs.netlify.com/build/functions/overview/) · [Netlify MCP](https://github.com/netlify/netlify-mcp)
7. **COMPLEXITY:** Moderate
8. **EXAMPLE:** `/netlify-deploy` — or "deploy a preview to Netlify."

### 26. ci-cd-pipeline
1. **SKILL NAME:** `ci-cd-pipeline`
2. **DESCRIPTION:** GitHub Actions: run typecheck, lint, unit + E2E tests, and apply Supabase migrations to staging/prod on merge. Gates merges on green checks.
3. **INPUT:** the test/build/migrate commands; branch/deploy strategy.
4. **OUTPUT:** CI workflows that block bad merges and run migrations safely.
5. **DEPENDENCIES:** GitHub Actions, Supabase CLI. *Skills:* → supabase-migration, unit-integration-testing, e2e-testing. *MCP:* GitHub MCP.
6. **DOCS:** [GitHub Actions](https://docs.github.com/en/actions) · [Supabase CI](https://supabase.com/docs/guides/deployment/managing-environments)
7. **COMPLEXITY:** Moderate
8. **EXAMPLE:** `/ci-cd-pipeline` — or "set up GitHub Actions to test and migrate on merge."

### 27. env-secrets-management
1. **SKILL NAME:** `env-secrets-management`
2. **DESCRIPTION:** Manage env vars/secrets across Netlify + Supabase (names in CLAUDE.md §6): keep the **service-role key server-only**, never in the client bundle or repo, and validate required vars at boot.
3. **INPUT:** the required var set; which are public (`NEXT_PUBLIC_*`) vs server-only.
4. **OUTPUT:** a typed env loader (fail-fast) + documented var names, no secrets committed.
5. **DEPENDENCIES:** a schema env validator (e.g., Zod/t3-env). *Skills:* → netlify-deploy.
6. **DOCS:** [Netlify env vars](https://docs.netlify.com/build/environment-variables/overview/) · [Supabase env/secrets](https://supabase.com/docs/guides/functions/secrets)
7. **COMPLEXITY:** Simple
8. **EXAMPLE:** `/env-secrets-management` — or "add fail-fast validation of required env vars."

---

## G. Error Handling & Logging

### 28. error-handling-observability
1. **SKILL NAME:** `error-handling-observability`
2. **DESCRIPTION:** Establish structured logging, React error boundaries, consistent API error shapes, and job failure handling (retry/backoff/dead-letter) — **without leaking sensitive intake text** to logs. Includes user-facing warm error/waiting states.
3. **INPUT:** the surface (worker, tRPC, webhook, UI) + failure modes.
4. **OUTPUT:** logging + error handling patterns applied, with sensitive fields redacted.
5. **DEPENDENCIES:** a logger (pino/console), optional error tracker (Sentry). *Skills:* → async-job-pipeline, webhook-handler.
6. **DOCS:** [Next.js error handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling) · [Pino](https://getpino.io/) · [Sentry Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
7. **COMPLEXITY:** Moderate
8. **EXAMPLE:** `/error-handling-observability worker` — or "add retry + dead-letter and redacted logging to the worker."

---

## H. Documentation Generation

### 29. api-docs-generation
1. **SKILL NAME:** `api-docs-generation`
2. **DESCRIPTION:** Generate/maintain reference docs for tRPC procedures and REST webhooks (inputs, outputs, auth, rate limits) from the code/schemas, keeping §5 of the PRD in sync.
3. **INPUT:** the routers/schemas.
4. **OUTPUT:** an up-to-date API reference doc.
5. **DEPENDENCIES:** the tRPC routers + Zod schemas. *Skills:* → trpc-endpoint, zod-schema.
6. **DOCS:** [tRPC](https://trpc.io/docs)
7. **COMPLEXITY:** Simple
8. **EXAMPLE:** `/api-docs-generation` — or "regenerate the API reference from the routers."

### 30. adr-and-memory-update
1. **SKILL NAME:** `adr-and-memory-update`
2. **DESCRIPTION:** Record architecture decisions and keep [CLAUDE.md](../CLAUDE.md) current — especially §3 "Current State" (what's built, in progress, tech debt) as work lands. Prevents context drift across sessions.
3. **INPUT:** the decision/change + rationale.
4. **OUTPUT:** an ADR entry and/or an updated CLAUDE.md Current State.
5. **DEPENDENCIES:** none. *Skills:* pairs with every build skill.
6. **DOCS:** [Claude Code memory](https://code.claude.com/docs/en/memory) · [ADR pattern](https://adr.github.io/)
7. **COMPLEXITY:** Simple
8. **EXAMPLE:** `/adr-and-memory-update` — or "update CLAUDE.md Current State now that auth is done."

---

## Skills we do NOT need (MVP) — deliberately out of scope

Listed so we don't build them by reflex (all deferred per PRD §7):

- **artist-voice-cloning / persona-voice** — **permanently excluded** (legal red line: ELVIS Act, CA AB 2602/1836). Moderation actively blocks it.
- **native-mobile (Expo/React Native)** — web-first MVP; no EAS build skill yet.
- **search-indexing (Algolia/Elasticsearch)** — Postgres full-text suffices later; no external search MVP.
- **music-video-generation** — provider supports it; deferred (P2).
- **stems/DAW/MIDI editing** — Anthem is not a production tool.
- **i18n/localization** — single launch locale; localized crisis resources beyond launch locale deferred.
- **social-feed / public gallery / discovery** — sharing is private-link only.
- **subscription-billing** — MVP is credit packs; subscriptions are P1 (would extend `stripe-payments-integration`, not a new skill).
- **org-admin-dashboard UX** — schema exists, UX is P2.
- **realtime-collaboration / multi-author songs** — not in scope.

## Build-order note

Rough dependency order: **1 → 2/3 → 7/8 → 17 → 16 → 9 → 10/11 → 6/12/13 → 14 → 15 → 18/19/20/21 → 22/23/24 → 25/26/27 → 28 → 29/30.** The four **Complex** money/safety/vendor/concurrency skills (3, 6, 9, 10/11, 12, 14) carry the most risk and deserve tests first.
