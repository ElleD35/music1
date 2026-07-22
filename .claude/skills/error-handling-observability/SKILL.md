---
name: error-handling-observability
description: Establish structured logging, React error boundaries, consistent API error shapes, and job failure handling (retry/backoff/dead-letter) for Anthem — without leaking sensitive intake text. Use when adding error handling/logging to any surface.
---

# error-handling-observability

Owned by `devops-infra-agent`; consumed by generation/payments. See PRD §6.

## Steps
1. Add a structured logger (pino/console) with a redaction list — NEVER log `raw_feeling`, intake text, tokens, or secrets.
2. Consistent API error shapes from tRPC and REST handlers; warm, non-technical user-facing error/waiting states.
3. React error boundaries around key screens.
4. Job failures: bounded retries with exponential backoff, then `dead_letter`; failures never silently consume credits.
5. Optional: wire an error tracker (e.g., Sentry) with sensitive data scrubbed.

## Guardrails
- Redaction is mandatory — this app handles vulnerable users' words.
- User-facing errors stay calm and human.

## Done when
Logs are structured + redacted, errors are consistent and warm, and the worker has retry/backoff/dead-letter.

Docs: https://nextjs.org/docs/app/building-your-application/routing/error-handling · https://getpino.io/ · https://docs.sentry.io/platforms/javascript/guides/nextjs/
