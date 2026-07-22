---
name: rate-limiting-upstash
description: Enforce per-user/per-org rate limits (generation, intake, checkout) for Anthem with Upstash Redis, applied before enqueue, plus a hard credit-balance gate. Use when adding limits to an action or capping spend against the metered upstream.
---

# rate-limiting-upstash

Owned by `payments-billing-agent`; consumed by `generation-pipeline-agent` and `frontend-experience-agent`. See PRD §5.4.

## Steps
1. Set up `@upstash/ratelimit` + `@upstash/redis` using `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`.
2. Build a reusable limiter middleware keyed by user/org + action.
3. Apply BEFORE enqueue for generation/regeneration; also apply to intake submit and checkout create.
4. Combine with a hard credit-balance gate — both must pass to enqueue.
5. Return a clear, warm "slow down / top up" response on limit.

## Indicative MVP limits (tunable, per PRD §5.4)
- Generation: free ~5/hour, 10/day; paid higher, credit-bounded.
- Intake submit: ~20/hour free.

## Guardrails
- Limits protect users and cap real spend — never bypass them for convenience.

## Done when
Limits apply before enqueue, the credit gate is enforced, and tests cover allow/deny.

Docs: https://upstash.com/docs/redis · https://github.com/upstash/ratelimit
