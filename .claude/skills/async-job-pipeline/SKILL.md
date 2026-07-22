---
name: async-job-pipeline
description: Build Anthem's enqueue→worker→webhook generation flow — a jobs row + pgmq enqueue, a Netlify Background Function / Supabase Edge worker that calls the provider, plus bounded retries, backoff, and dead-letter. Use for any generation orchestration work. Enforces "never generate inline."
---

# async-job-pipeline

Owned by `generation-pipeline-agent`. See PRD §3.4. Critical: songs take 30s–minutes; nothing blocks a user request.

## Flow
1. On approved intake: write a `jobs` row (`status=queued`, `idempotency_key`) and enqueue a pgmq message. Return immediately.
2. Worker (Netlify Background Function ≤15 min, or Supabase Edge Function + pg_cron) pops the job, sets `running`, calls `MusicProvider.generate()`, stores `provider_task_id`.
3. Completion arrives via the `webhook-handler` skill → persist audio (`object-storage-audio`), finalize the `songs` row, debit credits on success (`credit-ledger-integrity`).
4. On failure: bounded retries with exponential backoff; after N attempts move to `dead_letter`. Never silently consume credits.

## Preconditions (must all hold before enqueue)
- `trust-safety-agent` moderation approved the intake.
- Rate limit + credit balance check passed (`rate-limiting-upstash`).

## Guardrails
- Never call the provider inline in a request handler.
- Never log `raw_feeling` or intake text.

## Done when
Jobs flow through queued→running→done/failed/dead_letter, retries/backoff work, and credits debit only on success.

Docs: https://supabase.com/docs/guides/queues · https://docs.netlify.com/build/functions/background-functions/
