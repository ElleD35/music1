# Product Requirements Document

**Working product name:** **Anthem** *(codename — final name TBD)*
**Date:** 2026-07-21
**Version:** 1.0 (MVP definition)
**Companions:** [viability-analysis.md](./viability-analysis.md) · [tech-stack.md](./tech-stack.md)
**Audience:** a developer new to the project should be able to build the MVP from this document alone.

---

## 0. Product framing (read this first)

Anthem turns a person's own words about what they've lived through into a finished, original song — lyrics, vocals, and music — that says *"you were seen."* The generation engine is a commodity we rent (a Suno reseller behind a swappable interface, per the tech-stack doc). **The product is not "AI makes a song." The product is the held, curated, emotionally-safe experience wrapped around a generated song, delivered as a keepsake worth revisiting.** Every requirement below serves that thesis.

**Two hard product constraints inherited from the viability analysis, non-negotiable in MVP:**
1. **No impersonation of real, identifiable artists** (voice or "be [named artist]"). The promise is *"be the hero of your own song,"* not "be Taylor Swift." This is a legal red line (ELVIS Act, CA AB 2602/1836), enforced in product by moderation.
2. **Duty of care.** Users arrive processing grief and trauma. Input moderation with a crisis-resource off-ramp is a P0 safety feature, not a nicety.

---

## 1. Executive Summary

### What we're building
Anthem is a **web application** where a person describes — in their own words — an experience, a feeling, or someone they love, and receives a **complete, original song** (lyrics + vocals + full instrumentation) crafted to make them feel **acknowledged**. The app guides the user through a short emotional intake, translates their raw words into a high-quality generation prompt, produces a song via an external music-generation API, and presents the result as a **shareable, revisitable keepsake** (song + lyrics + visual). It is not a music-production tool; it is an instrument of acknowledgment.

### Primary value proposition
> **"You were not supposed to have to be that strong. Here is the song that says you were seen."**
> Anthem gives people the rare experience of having their resilience *named and witnessed* — in a song that is unmistakably about them — without needing any musical skill or the ability to prompt an AI. We do the emotional translation and the careful delivery; they get to feel like the hero of their own anthem.

### What makes it defensible (vs. using raw Suno for free)
The generator is free/cheap and public. Anthem wins on the **experience layer**: (a) a feelings-to-prompt translation most people can't do themselves, (b) tonal curation so the output *lands gently* instead of randomly, (c) emotional safety, and (d) a keepsake artifact people return to and share. If a user would "just do it on Suno myself," we have failed — so the entire product is engineered around being *better held*, not *technically more capable*.

### Target user persona (psychographic)

**"The Quiet Carrier" — primary persona.**

- **Snapshot:** 28–55, has been the strong one — the caregiver, the survivor, the one who held the family/team/self together through something hard (loss, illness, burnout, an abusive chapter, single parenthood, recovery). Emotionally literate but rarely the recipient of care.
- **Motivations:** wants to feel *witnessed* without having to perform strength or explain themselves; wants to give voice to something they can't say out loud; wants to mark a milestone of survival; sometimes wants to *give* this acknowledgment to someone else they love.
- **Fears:** being seen as self-pitying or attention-seeking; that their pain is "not that bad" and doesn't deserve acknowledgment; being handed something generic that proves no one really *gets* it; technology that feels cold or gimmicky in a tender moment.
- **Goals:** a private moment of being understood; a tangible artifact of "I made it through"; occasionally, a gift that says to someone else "I see what you carried."
- **Emotional state at point of use:** vulnerable, hopeful-but-guarded, low tolerance for a bad or tone-deaf result. **A wrong-toned song doesn't just disappoint — it stings.** This is why curation and regeneration are P0.

**Secondary personas (inform multi-tenancy, not MVP marketing):**
- **The Gifter** — wants to create an acknowledgment song *for* someone else (partner, parent, friend, grieving colleague).
- **The Helper (org account)** — a therapist, grief counselor, coach, chaplain, or wellness program that wants to offer this to clients under an organization account. This is the seed of the B2B/multi-tenant design in §4, even though consumer is the MVP go-to-market.

---

## 2. User Avatar Deep Dive

### Who exactly is this for?
The MVP is for **an individual adult who has survived or is surviving something hard and has never been properly acknowledged for it** — and, secondarily, for someone who wants to *give* that acknowledgment to a specific person. They are not musicians. They are not "AI enthusiasts." They may be mildly wary of AI. They are here for the *feeling*, and they'll judge us in the first 30 seconds of hearing their song.

### Their current painful "workflow"
Today, a Quiet Carrier who wants this has bad options:
1. **Do nothing** — carry it unspoken (the default; the pain is unwitnessed).
2. **Journaling / therapy** — valuable but effortful, and doesn't produce a resonant *artifact* they can replay.
3. **Search Spotify** for a song that "kind of" fits — it's someone else's story, never quite theirs.
4. **Try raw Suno/Udio themselves** — and hit the real wall: *they don't know how to prompt their grief.* They type "a sad song about my mom" and get something generic and tonally off, which — for this user, in this moment — actively hurts and confirms "no one gets it." They lack the prompt-craft, the emotional-translation skill, and the curation to get to a version that lands. The tool is capable; the *experience* fails them.

Anthem replaces "know how to prompt an AI for your trauma" with "answer a few gentle questions and be met."

### What does success look like for them?
- They hear the first 20 seconds and feel a lump in their throat — *"this is about me."*
- The lyrics name something true they hadn't put into words.
- They replay it. They save it. Some of them cry (the good kind).
- They keep it — as a private touchstone or a gift they send.
- They feel, maybe for the first time, **acknowledged** — not praised, *witnessed*.

### What would make them tell a friend?
Not "cool AI song generator." They tell someone when **it made them feel something real** and they want that person to feel it too — most powerfully by **sending them a keepsake song made for them**. Our strongest growth loop is the *gift*, not the referral link. The share/keepsake feature is therefore a growth mechanism, not just a nicety (informs P0/P1 prioritization).

---

## 3. Feature Specification

Priorities: **P0** = MVP cannot ship without it · **P1** = important, fast-follow · **P2** = nice-to-have / later.
Global dependency: all generation features depend on the `MusicProvider` abstraction over the Suno reseller (tech-stack §2) and the async job pipeline (pgmq → worker → webhook).

---

### 3.1 Account & Auth

**User story:** *As a new visitor, I want to sign up quickly with email or a social login so that I can create and keep my songs without friction.*

- **Priority:** P0
- **Acceptance criteria:**
  - User can sign up / log in via email OTP (magic link) and at least one social provider (Google).
  - On first signup, a **personal organization** is auto-created and the user is its `owner` (see multi-tenancy, §4).
  - A `profiles` row is created with a display name.
  - Session persists; protected routes redirect unauthenticated users to login.
  - Logout works; sessions expire per Supabase defaults.
- **Tech notes / deps:** Supabase Auth + RLS; personal-org creation via a Postgres trigger or post-signup server action. No custom password handling.

---

### 3.2 Emotional Intake Wizard

**User story:** *As a Quiet Carrier, I want to answer a few gentle, well-designed questions about what I've been through so that the song is unmistakably about me — without needing to know how to "prompt an AI."*

- **Priority:** P0 (this is the core differentiator)
- **Acceptance criteria:**
  - Multi-step wizard collects: (a) *who this is for* (myself / someone else), (b) the raw story/feeling in free text, (c) desired emotional tone (e.g., tender, defiant, hopeful, mournful, triumphant), (d) musical style/genre (curated presets, plain-language), (e) optional details (names to include or avoid, a line they wish someone had said to them).
  - Free-text field has a soft character range (e.g., 20–1,500 chars) with encouraging helper copy, not error-nagging.
  - Progress is saved as an `intake_sessions` row; a user can abandon and resume.
  - On submit, input passes through **moderation (§3.3)** before any generation is enqueued.
  - The wizard never exposes raw "prompt" language; it produces a `generated_prompt` server-side via a **feelings-to-prompt translation layer** (curated prompt templates + the structured intake answers).
- **Tech notes / deps:** React Hook Form + Zod (shared schema client/server); translation layer lives server-side in the tRPC mutation; writes `intake_sessions`. Depends on §3.3.

---

### 3.3 Input Moderation & Duty-of-Care Off-Ramp

**User story:** *As a vulnerable user, I want the product to respond safely if I express crisis-level distress so that I am directed to real help rather than handed a song.*

- **Priority:** P0 (safety-critical)
- **Acceptance criteria:**
  - All intake free-text is screened before generation.
  - If content indicates self-harm/suicidal crisis or abuse-in-progress, generation is **blocked** and the UI shows a **calm crisis-resources screen** (e.g., 988 Suicide & Crisis Lifeline in the US, with locale-aware resources where known) instead of an error.
  - Disallowed content (impersonation of a named real artist/public figure, hate, sexual content involving minors, targeted harassment) is blocked with a gentle explanation.
  - Every moderation decision is recorded in `moderation_events` (category, severity, action).
  - False-positive rate is tuned to avoid blocking legitimate grief/trauma expression (the *expected* content) — err toward allowing sad content, blocking only crisis/abuse/impersonation.
- **Tech notes / deps:** moderation middleware in the intake mutation (LLM- or classifier-based screen + rule list); short-circuits before pgmq enqueue. Crisis-resource content is static and locale-aware. This is duty of care from the viability doc — do not ship without it.

---

### 3.4 Song Generation (async pipeline)

**User story:** *As a user, I want my song generated reliably in the background so that I can wait through a meaningful moment rather than stare at a spinner or hit an error.*

- **Priority:** P0
- **Acceptance criteria:**
  - Submitting an approved intake creates a `jobs` row (`status=queued`) and enqueues a pgmq message; **the user request never blocks on generation.**
  - A worker (Netlify Background Function / Supabase Edge Function) pops the job, calls `MusicProvider.generate()`, stores `provider_task_id`, sets `status=running`.
  - On provider webhook completion, audio is persisted to storage, a `songs` row is finalized (`status=done`), and credits are debited transactionally.
  - The waiting UI is intentional and warm ("We're writing your song…"), shows progress states, and updates via polling (TanStack Query) or Supabase Realtime.
  - Failures set `status=failed` with a captured error, trigger bounded retries with backoff, and **do not silently consume credits** (credits debit only on success).
  - Typical completion surfaces to the user within the provider's real latency (tens of seconds to a few minutes); the UI sets that expectation honestly.
- **Tech notes / deps:** pgmq queue, worker, REST webhook receiver with **signature verification** and **idempotent** handling; `MusicProvider` interface; credit ledger (§3.7). Hardest feature; see NFR performance targets.

---

### 3.5 Song Result: Playback, Lyrics & Keepsake View

**User story:** *As a user, I want to hear my song with its lyrics in a beautiful, calm presentation so that it feels like a keepsake, not a file download.*

- **Priority:** P0
- **Acceptance criteria:**
  - Result screen plays the audio (play/pause/scrub) with a waveform or gentle visual.
  - Full lyrics are displayed; time-synced highlighting is P1 (provider supplies timestamps).
  - Screen shows the title, tone, and a tasteful generated/uploaded visual.
  - User can save to their library (implicit on completion), rename the title, and download the audio (subject to provider terms).
  - Presentation is emotionally considered — typography, pacing, whitespace — not a utilitarian media player.
- **Tech notes / deps:** Howler.js / `<audio>` + wavesurfer.js; OG image generation for share cards; `songs.audio_url`, `songs.lyrics`, `songs.image_url`.

---

### 3.6 Regeneration & Variations

**User story:** *As a user whose first song didn't quite land, I want to try again or get variations so that I can reach the version that truly feels like me — because a near-miss in this moment hurts.*

- **Priority:** P0 (tonal misses are expected and emotionally costly; this is a safety valve for the core experience)
- **Acceptance criteria:**
  - User can request a regeneration (same intake) or generate an alternate take with a tweaked tone/style.
  - Generating multiple takes and letting the user pick is supported; each take is its own `songs`/`jobs` record linked to the intake.
  - **Regeneration cost and limits are explicit** to the user (each take costs credits; free tier is capped) — directly mitigating the "8 regenerations = uncontrolled cost" risk from the viability doc.
  - Rate limits apply per user (§5).
- **Tech notes / deps:** reuses §3.4 pipeline; enforces per-user rate limits (Upstash) *before* enqueue; credit checks pre-debit.

---

### 3.7 Credits & Billing

**User story:** *As a user, I want a clear, fair way to pay for songs so that I understand what each creation costs and never get surprise-charged.*

- **Priority:** P0 (needed to have a business; also the cost-control mechanism)
- **Acceptance criteria:**
  - New users receive a small number of free credits (e.g., enough for 1–2 complete songs incl. a regeneration) to reach the "this is about me" moment before paying.
  - Credit balance is visible; each action's cost is shown before confirmation.
  - Users can purchase credit packs via Stripe Checkout; on payment success, credits are granted via an **append-only ledger** (auditable).
  - Credits debit **only on successful generation**, transactionally (no double-spend under concurrency).
  - Insufficient balance blocks generation with a clear top-up path.
- **Tech notes / deps:** Stripe (+ Stripe MCP for dev); `credit_ledger` (append-only) + `credit_balances`; Stripe webhook → grant credits (idempotent). Subscription plans are **P1**, credit packs are P0. Pricing must keep revenue-per-song > cost-per-song **including regenerations** (viability doc unit economics).

---

### 3.8 Share / Gift a Keepsake

**User story:** *As a user, I want to share or gift my song via a beautiful private link so that the person I made it for (or a friend) can experience it — which is also how they discover Anthem.*

- **Priority:** P1 (strongest growth loop, but MVP can launch with private library + basic link; rich gifting is fast-follow)
- **Acceptance criteria:**
  - User can generate a private, unguessable share link (`share_slug`) to a public keepsake page (song + lyrics + visual, no login required to view).
  - Sharing is **opt-in per song**; default is private.
  - Share page has tasteful OG metadata so it previews well when sent.
  - A gift flow (P1) lets the creator add a short message and optionally send directly.
- **Tech notes / deps:** public route `GET /share/:slug`; `songs.is_public`, `songs.share_slug` (unique, unguessable); OG image route. Respect that shared audio is viewable but not necessarily downloadable by recipients (provider terms).

---

### 3.9 Library / History

**User story:** *As a returning user, I want to find all my past songs so that I can revisit them as touchstones.*

- **Priority:** P0 (revisiting is core to "keepsake")
- **Acceptance criteria:** authenticated user sees a reverse-chronological list of their songs with status, can open any completed one, rename, delete, and re-share.
- **Tech notes / deps:** `songs` by `user_id`; RLS-scoped.

---

### 3.10 Organization Accounts (multi-tenant)

**User story:** *As a therapist/coach/wellness program, I want a team account with shared credits and client song management so that I can offer Anthem to the people I support.*

- **Priority:** P2 for full UX; **the data model is P0** (§4 builds multi-tenancy from day one so we don't re-platform later).
- **Acceptance criteria (P2 UX):** create an organization, invite members with roles, share an org credit pool, view org-scoped songs. **MVP ships with the schema and RLS in place but only the auto-created personal org surfaced in UI.**
- **Tech notes / deps:** `organizations`, `org_members`, org-scoped RLS. See §4.

---

### Feature priority summary

| Feature | Priority |
|---|---|
| 3.1 Account & Auth | P0 |
| 3.2 Emotional Intake Wizard | P0 |
| 3.3 Moderation & duty-of-care off-ramp | P0 |
| 3.4 Song generation (async pipeline) | P0 |
| 3.5 Playback / lyrics / keepsake view | P0 |
| 3.6 Regeneration & variations | P0 |
| 3.7 Credits & billing (credit packs) | P0 |
| 3.9 Library / history | P0 |
| 3.8 Share / gift keepsake | P1 (basic link may sneak into MVP) |
| 3.7b Subscription plans | P1 |
| 3.5b Time-synced lyric highlighting | P1 |
| 3.10 Organization UX | P2 (schema P0) |

---

## 4. Database Schema

**Engine:** PostgreSQL (Supabase). **Auth:** Supabase `auth.users` is the identity source; app data lives in `public`.
**Multi-tenancy model:** **shared-database, shared-schema, row-level isolation by `organization_id`.** Every tenant-scoped table carries `organization_id`, and **Row Level Security** enforces that a user can only access rows in organizations they belong to. Every user gets an auto-created **personal organization** on signup, so the consumer and B2B cases share one model.

### 4.1 Entity-relationship overview

```
auth.users (Supabase)
     │ 1:1
     ▼
profiles ──────────────┐
     │                 │ member of (M:N via org_members)
     │                 ▼
     │           organizations ──1:N── org_members ──N:1── profiles
     │                 │
     │                 ├──1:N── credit_ledger        (append-only)
     │                 ├──1:1── credit_balances      (cached balance)
     │                 ├──1:N── intake_sessions ──1:N── songs
     │                 ├──1:N── songs ──1:N── jobs
     │                 ├──1:N── moderation_events
     │                 └──1:N── payments
```

Ownership rule: **`organization_id` is the tenant boundary on every business table.** `user_id` records *who* acted, but access is authorized by org membership.

### 4.2 Tables

**`profiles`** — public mirror of a user.
| field | type | notes |
|---|---|---|
| id | uuid PK | = `auth.users.id` |
| display_name | text | 1–80 chars |
| avatar_url | text null | |
| default_org_id | uuid FK→organizations | personal org |
| created_at | timestamptz | default now() |

**`organizations`** — tenant.
| field | type | notes |
|---|---|---|
| id | uuid PK | |
| name | text | 1–120 chars |
| type | text enum | `personal` \| `therapist` \| `wellness` \| `gifting` \| `other` |
| created_by | uuid FK→profiles | |
| created_at | timestamptz | |

**`org_members`** — membership + role (M:N).
| field | type | notes |
|---|---|---|
| org_id | uuid FK→organizations | |
| user_id | uuid FK→profiles | |
| role | text enum | `owner` \| `admin` \| `member` |
| created_at | timestamptz | |
| **PK** | (org_id, user_id) | composite |

**`intake_sessions`** — the emotional input.
| field | type | notes |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid FK | tenant |
| user_id | uuid FK | |
| recipient | text enum | `self` \| `other` |
| raw_feeling | text | 20–1,500 chars, encrypted-at-rest (sensitive) |
| tone | text | curated enum value |
| genre | text | curated enum value |
| extra_details | jsonb null | names to include/avoid, wished-for line |
| moderation_status | text enum | `pending` \| `approved` \| `blocked_crisis` \| `blocked_policy` |
| generated_prompt | text null | server-produced; never shown raw to user |
| created_at | timestamptz | |

**`songs`** — a generated result (one per take).
| field | type | notes |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid FK | tenant |
| user_id | uuid FK | |
| intake_id | uuid FK→intake_sessions | |
| title | text | user-editable, 1–120 |
| lyrics | text null | populated on completion |
| style_prompt | text null | provider style input |
| status | text enum | `pending` \| `generating` \| `done` \| `failed` |
| provider | text | e.g. `sunoapi_org` |
| audio_url | text null | storage/R2 URL |
| image_url | text null | keepsake visual |
| duration_sec | int null | |
| is_public | boolean | default false |
| share_slug | text null unique | unguessable, set on publish |
| created_at | timestamptz | |

**`jobs`** — async generation work unit.
| field | type | notes |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid FK | tenant |
| user_id | uuid FK | |
| song_id | uuid FK→songs null | linked result |
| type | text enum | `generate` \| `regenerate` \| `extend` |
| provider | text | |
| provider_task_id | text null | for webhook correlation |
| status | text enum | `queued` \| `running` \| `done` \| `failed` \| `dead_letter` |
| attempts | int | default 0 |
| credits_cost | int | reserved cost |
| idempotency_key | text unique | dedupe enqueue & webhook |
| error | text null | |
| created_at / updated_at | timestamptz | |

**`credit_ledger`** — append-only money-adjacent truth.
| field | type | notes |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid FK | tenant (credits pooled per org) |
| user_id | uuid FK null | actor |
| delta | int | + grant / − debit |
| reason | text enum | `signup_grant` \| `purchase` \| `generation_debit` \| `refund` \| `adjustment` |
| ref_id | uuid null | job/payment reference |
| balance_after | int | denormalized running balance |
| created_at | timestamptz | |

**`credit_balances`** — fast-read cache (kept in sync in the same transaction as ledger writes).
| field | type | notes |
|---|---|---|
| organization_id | uuid PK FK | |
| balance | int | >= 0 enforced |
| updated_at | timestamptz | |

**`payments`** — Stripe transactions.
| field | type | notes |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid FK | |
| user_id | uuid FK | |
| stripe_payment_intent | text unique | |
| stripe_customer | text | |
| amount_cents | int | |
| currency | text | default `usd` |
| credits_granted | int | |
| status | text enum | `pending` \| `succeeded` \| `failed` \| `refunded` |
| created_at | timestamptz | |

**`moderation_events`** — audit of safety decisions.
| field | type | notes |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid FK | |
| user_id | uuid FK | |
| intake_id | uuid FK null | |
| category | text | `crisis` \| `abuse` \| `impersonation` \| `hate` \| `sexual_minor` \| `other` |
| severity | text enum | `low` \| `medium` \| `high` |
| action | text enum | `allowed` \| `blocked` \| `crisis_redirect` |
| created_at | timestamptz | |

### 4.3 Multi-tenancy enforcement (RLS)

- Enable RLS on **every** table above except pure-static content.
- Canonical policy pattern (read/write): a row is accessible iff the requester belongs to its org:
  ```sql
  -- example for songs
  create policy songs_tenant_isolation on songs
  using (
    organization_id in (
      select org_id from org_members where user_id = auth.uid()
    )
  );
  ```
- **Write authority for system operations** (worker finalizing songs, Stripe/Suno webhooks granting credits or updating jobs) uses the **service-role key**, which bypasses RLS — used **only** in trusted server contexts, never shipped to the client.
- **Public share pages** read a single song by `share_slug` where `is_public = true` via a dedicated, minimal, unauthenticated policy or a service-role-backed read — exposing only presentation fields, never `raw_feeling` or intake data.

### 4.4 Indexing strategy (driven by real query paths)

| Index | Serves |
|---|---|
| `jobs (status, created_at)` | worker polling for `queued`/`running` jobs |
| `jobs (provider_task_id)` | webhook → job correlation (hot path) |
| unique `jobs (idempotency_key)` | dedupe double-enqueue & duplicate webhooks |
| `songs (user_id, created_at desc)` | library / history listing |
| `songs (organization_id, created_at desc)` | org-scoped listings |
| unique `songs (share_slug)` | public keepsake page lookup |
| `org_members (user_id)` | RLS membership resolution (every authorized query) |
| `credit_ledger (organization_id, created_at desc)` | balance history / audit |
| unique `payments (stripe_payment_intent)` | idempotent Stripe webhook |
| `intake_sessions (user_id, created_at desc)` | resume / list |

### 4.5 Data validation rules

- `intake_sessions.raw_feeling`: length 20–1,500; must be `moderation_status='approved'` before any job is enqueued (enforced in app layer + a guard so no job references a non-approved intake).
- `credit_balances.balance >= 0` (CHECK); debits occur only within a transaction that also appends to `credit_ledger`; **generation debit happens on job success**, not enqueue.
- `songs.share_slug`: unguessable (≥ 22 URL-safe chars), unique, set only when `is_public` flips true.
- `org_members.role` and all enums enforced via Postgres enums/CHECK constraints.
- `raw_feeling` and `extra_details` are **sensitive PII-adjacent** data: encrypted at rest, never placed in URLs/logs, never returned on public routes.
- Every tenant table requires a non-null `organization_id`.

---

## 5. API Specification

**Style:** app↔backend via **tRPC** (typed procedures); external callers (browsers to public pages, provider/Stripe webhooks) via **REST** route handlers on Netlify Functions. Below, procedures are shown with an equivalent REST-ish signature for clarity.

**Auth model:**
- **Authenticated** = valid Supabase session (JWT); RLS scopes data to the user's orgs.
- **Public** = no auth (share pages).
- **System** = signature-verified webhooks; act via service role.

### 5.1 Endpoints

| Endpoint (logical) | Method | Auth | Purpose | Notes |
|---|---|---|---|---|
| `auth.*` | — | — | signup/login/logout | handled by Supabase Auth SDK |
| `intake.create` | POST `/api/intake` | Authenticated | create/update an intake session | runs Zod validation |
| `intake.submit` | POST `/api/intake/:id/submit` | Authenticated | run moderation, produce prompt, enqueue job | **may block generation → crisis redirect** |
| `jobs.get` | GET `/api/jobs/:id` | Authenticated | poll job status | polled by client |
| `songs.list` | GET `/api/songs` | Authenticated | library listing | paginated |
| `songs.get` | GET `/api/songs/:id` | Authenticated | full song | RLS-scoped |
| `songs.update` | PATCH `/api/songs/:id` | Authenticated | rename, toggle publish | |
| `songs.regenerate` | POST `/api/songs/:id/regenerate` | Authenticated | new take from same intake | rate-limited |
| `songs.delete` | DELETE `/api/songs/:id` | Authenticated | soft delete | |
| `share.get` | GET `/api/share/:slug` | **Public** | keepsake page data | presentation fields only |
| `credits.balance` | GET `/api/credits` | Authenticated | current org balance | |
| `credits.history` | GET `/api/credits/history` | Authenticated | ledger | |
| `billing.createCheckout` | POST `/api/billing/checkout` | Authenticated | Stripe Checkout session for a credit pack | |
| `webhooks.suno` | POST `/api/webhooks/suno` | **System (signed)** | generation completion callback | idempotent |
| `webhooks.stripe` | POST `/api/webhooks/stripe` | **System (signed)** | payment events → grant credits | idempotent |
| `org.*` (create/invite/members) | various | Authenticated (role-gated) | org management | **P2 UX** |

### 5.2 Representative request/response formats

**`POST /api/intake/:id/submit`**
```jsonc
// request
{ "intakeId": "uuid" }
// response — approved
{ "status": "approved", "jobId": "uuid" }
// response — crisis redirect (safety)
{ "status": "blocked_crisis", "resources": [ { "name": "988 Suicide & Crisis Lifeline", "contact": "988", "locale": "US" } ] }
// response — policy block
{ "status": "blocked_policy", "reason": "impersonation_of_real_artist" }
```

**`GET /api/jobs/:id`**
```jsonc
{ "id": "uuid", "status": "running", "songId": "uuid|null", "error": null }
```

**`GET /api/share/:slug`** (public — note what is NOT returned)
```jsonc
{ "title": "Still Standing", "lyrics": "…", "audioUrl": "https://…", "imageUrl": "https://…", "durationSec": 168 }
// never returns raw_feeling, intake, user identity, or org data
```

**`POST /api/webhooks/suno`** (system)
```jsonc
// inbound (parsed & Zod-validated at the boundary)
{ "taskId": "provider-id", "status": "complete", "audioUrl": "…", "lyrics": "…", "durationSec": 168, "signature": "…" }
// server: verify signature → find job by provider_task_id → idempotent finalize → debit credits
```

### 5.3 Authentication requirements per endpoint
Summarized in the table (§5.1): every user data route is **Authenticated** with RLS; webhooks are **System** with mandatory **signature verification** and idempotency; only `share.get` is **Public** and returns a deliberately minimal projection.

### 5.4 Rate limiting (Upstash Redis, enforced *before* enqueue)

Rate limits protect (a) vulnerable UX from runaway loops and (b) our metered upstream from cost blowouts (viability doc unit economics). Indicative MVP limits (tunable):

| Action | Free tier | Paid |
|---|---|---|
| Generation / regeneration | e.g. 5 / hour, 10 / day per user | higher, credit-bounded |
| Intake submit | e.g. 20 / hour per user | 60 / hour |
| Checkout create | e.g. 10 / hour per user | same |
| Public share views | IP-based abuse cap | — |
| Webhooks | provider-authenticated; idempotent, not user-rate-limited | — |

Additional controls: every generation also checks **credit balance** (hard gate) and per-org concurrency caps to bound worst-case spend.

---

## 6. Non-Functional Requirements

### 6.1 Performance targets
- **App shell / page load:** LCP < 2.5s on a mid-tier mobile over 4G; interactive intake wizard usable < 3s.
- **API (non-generation) latency:** p95 < 400ms for reads, < 800ms for writes.
- **Generation latency:** governed by the provider (tens of seconds to a few minutes). Target: **p50 under ~90s, p95 under ~4min** *surfaced honestly* with a warm waiting experience; job pickup latency from queue < 10s.
- **Reliability:** generation **success rate ≥ 95%** (excluding user-caused policy blocks); failed jobs auto-retry with backoff and never silently consume credits.
- **Webhook processing:** idempotent, completes < 5s; duplicate deliveries are no-ops.

### 6.2 Security requirements
- **RLS on all tenant tables**; service-role key only in trusted server contexts, never client-exposed.
- **Webhook signature verification** (Suno reseller + Stripe) mandatory; reject unsigned/invalid.
- **Secrets** (provider key, service-role key, Stripe key) in Netlify/Supabase env vars, never in the repo or client bundle.
- **Sensitive data:** `raw_feeling`/intake encrypted at rest; never logged, never in URLs/query strings, never on public routes.
- **Transactional credit handling** to prevent double-spend; append-only ledger for auditability.
- **HTTPS everywhere** (HSTS upgrade); standard security headers; input validated with Zod at every boundary including untyped webhook payloads.
- **Least-privilege** on provider abstraction; isolate the unofficial upstream behind `MusicProvider`.
- **Abuse/DoS:** Upstash rate limits + per-org concurrency + credit gate.

### 6.3 Accessibility standards
- **WCAG 2.1 AA** target: keyboard navigable intake wizard and player; visible focus states; color contrast ≥ 4.5:1; form fields properly labeled; error/status messages announced to screen readers (aria-live for generation status).
- **Media:** display full lyrics as text (a built-in accessible transcript of the audio); player controls operable by keyboard and screen reader.
- **Emotional-safety copy** is plain-language and calm, aiding cognitive accessibility for users in distress.

### 6.4 Mobile responsiveness
- **Mobile-first** responsive web (the persona will often open a gift link on a phone). Fully functional 320px → desktop.
- Touch targets ≥ 44px; the intake wizard, player, and share/keepsake page are first-class on mobile.
- Share/keepsake pages render correctly as link previews (OG tags) in iMessage/WhatsApp/social.
- Native apps are **out of scope** for MVP (§7); the responsive web app is the delivery vehicle.

---

## 7. Out of Scope

### Explicitly NOT in MVP
- **Native iOS/Android apps** (Expo/React Native) — responsive web only. Revisit if a validated need emerges.
- **Cloning or imitating real, identifiable artists' voices/styles** — permanently excluded on legal grounds (moderation actively blocks it).
- **Full organization/team UX** (invites, roles, shared-pool dashboards) — schema exists (§4) but only the personal org is surfaced.
- **Subscription plans** — MVP ships credit packs; subscriptions are P1.
- **DAW-style editing, stems, MIDI, section-level inpainting** — Anthem is not a production tool.
- **Music video generation** — provider supports it; deferred (P2).
- **Social feed / public gallery / discovery** — sharing is private-link only in MVP.
- **Collaborative / co-created songs** with multiple contributors.
- **Multi-language generation & localized crisis resources beyond initial launch locale(s).**
- **Marketplace, artist personas, licensed-catalog features.**
- **Native offline mode.**

### Future considerations (v2+)
- Native app via Expo Router once mobile demand is validated.
- **Consented "signature voice"** via a lawful mechanism (e.g., provider Personas) — the *legal* version of "your artist."
- Rich **gifting flows** (scheduled delivery, printed/keepsake artifacts, occasion templates).
- **Org/B2B product** for therapists/coaches/wellness programs (activate the multi-tenant model).
- Time-synced lyric video keepsakes; optional music-video generation.
- Subscription tiers; annual gifting bundles.
- Provider redundancy / multi-provider routing behind `MusicProvider` (Udio, ElevenLabs, licensed platforms).
- Deeper personalization (voice/style memory across a user's songs).

---

## 8. Success Metrics

**North Star:** **Weekly count of "acknowledged moments"** = completed songs that the user **saved AND replayed at least once** (a behavioral proxy for "this landed"). We deliberately measure *resonance*, not just generation volume — a generated-but-ignored song is a failure per our thesis.

### Metric framework
| Category | Metric | Why it matters |
|---|---|---|
| **Activation** | % of signups who complete their first song | did we get them to the core experience? |
| **Resonance (core)** | save rate; **replay rate** (≥1 replay within 24h); avg replays/song | proxy for "you were seen" landing |
| **Resonance (core)** | regeneration-to-satisfaction (takes until a song is saved) | tonal-quality health; cost driver |
| **Growth loop** | share rate; **share→signup conversion** (gift loop) | our real distribution engine |
| **Monetization** | free→paid conversion; ARPPU; revenue-per-song vs cost-per-song | is the unit economic positive incl. regenerations? |
| **Retention** | % returning to replay/create in week 2 / week 4 | is it a touchstone or a one-off? |
| **Reliability** | generation success rate; p50/p95 latency | trust in a tender moment |
| **Safety** | crisis-redirect precision; policy-block accuracy; complaint rate | duty of care is met |

### Targets

**Launch week**
- ≥ 60% of signups complete a first song (activation).
- ≥ 40% of completed songs are replayed within 24h (early resonance signal).
- Generation success rate ≥ 95%; zero safety incidents (no crisis case mishandled).
- Qualitative: collect ≥ 20 first-person reactions; look for unprompted emotional language ("cried," "this is me").

**Month one**
- ≥ 50% replay rate; ≥ 15% share rate.
- Free→paid conversion ≥ 5% of activated users.
- Share→signup conversion measurable and > 0 (gift loop alive).
- Revenue-per-paid-song > fully-loaded cost-per-song including average regenerations.
- Week-2 return rate ≥ 25%.

**Month three**
- North Star (weekly acknowledged moments) growing week-over-week.
- Free→paid ≥ 8–10%; positive contribution margin per paying user.
- Share→signup becomes a top-2 acquisition source (validates the gift loop as the growth engine).
- Month-1 cohort retention (return in month 3) ≥ 15%.
- Net Promoter / word-of-mouth signal strong enough to justify building the P1 gifting and P2 org products.

**Kill/pivot signals (honesty per the viability doc):** if activated users won't pay and say "I'd just use Suno myself," or replay/share rates stay low despite iteration, the emotional thesis is unproven — revisit the experience or the concept before scaling spend.

---

*End of PRD v1.0.*
