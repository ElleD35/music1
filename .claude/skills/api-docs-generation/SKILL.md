---
name: api-docs-generation
description: Generate and maintain reference docs for Anthem's tRPC procedures and REST webhooks (inputs, outputs, auth, rate limits) from the code/schemas, keeping PRD §5 in sync. Use when the API surface changes.
---

# api-docs-generation

Owned by `documentation-memory-agent`. See PRD §5.

## Steps
1. Enumerate tRPC routers/procedures and REST webhook routes.
2. For each: document input/output (from the Zod schema), auth requirement (authenticated/public/system), and rate limits.
3. Note which are public (share) vs system (signed webhooks) vs authenticated.
4. Keep the doc aligned with PRD §5; flag drift.

## Guardrails
- Derive from code/schemas — don't hand-invent shapes.
- Never include secrets or sensitive example data.

## Done when
An up-to-date API reference matches the routers/schemas and PRD §5.

Docs: https://trpc.io/docs
