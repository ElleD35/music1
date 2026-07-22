---
name: webhook-handler
description: Build signed, idempotent REST webhook receivers for Anthem — generation-complete (Suno reseller) and Stripe events. Use whenever adding or changing an inbound webhook. Verify signatures, Zod-parse the untyped payload, dedupe via idempotency_key, then finalize state.
---

# webhook-handler

Owned by `generation-pipeline-agent`; shared with `payments-billing-agent`. See PRD §5.2.

## Steps
1. Expose a REST route (Netlify Function) — external callers can't speak tRPC.
2. Verify the signature/secret FIRST (`MUSIC_PROVIDER_WEBHOOK_SECRET` / `STRIPE_WEBHOOK_SECRET`); reject unsigned/invalid with 4xx.
3. Zod-parse the raw payload at the boundary; fail loudly on shape changes.
4. Idempotency: look up by `provider_task_id` / Stripe event id; if already processed, no-op and return 200.
5. Finalize: for generation → persist audio + finalize song + debit credits; for Stripe → grant credits via the ledger.
6. Keep handlers fast (<5s); do heavy work already done by the worker.

## Guardrails
- Never remove signature or idempotency checks.
- Duplicate deliveries must be safe no-ops.
- Never log sensitive fields.

## Done when
Handlers verify signatures, are idempotent, Zod-validate input, and have tests for duplicate + invalid deliveries.

Docs: https://docs.netlify.com/build/functions/overview/ · https://docs.stripe.com/webhooks · https://docs.sunoapi.org/
