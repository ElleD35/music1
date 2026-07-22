---
name: unit-integration-testing
description: Write unit/integration tests (Vitest + Testing Library) for Anthem's domain logic — especially credit debits, moderation decisions, RLS isolation, and webhook idempotency. Use after changes to any critical path. Prioritizes money/safety/tenancy.
---

# unit-integration-testing

Owned by `testing-qa-agent`. See PRD §6/§8.

## Priority coverage (risky paths first)
1. Credit ledger: no negative balance; no double-spend under concurrent debits; debit only on success.
2. RLS: a user cannot read another org's rows; the public share path leaks nothing sensitive.
3. Webhooks: idempotent (duplicate delivery = no-op); invalid signatures rejected.
4. Moderation: grief/sadness allowed; crisis/impersonation blocked.

## Steps
1. Use Vitest + @testing-library/react; a Supabase test harness for DB-touching tests.
2. Use the `MockMusicProvider` and Stripe test mode — never real spend.
3. Report failures as defects to the owning agent; do not modify product logic to force a pass.

## Guardrails
- Never test against production data or live billing.
- Ask before deleting/weakening an existing test.

## Done when
The critical paths have passing coverage and any failures are filed as defects.

Docs: https://vitest.dev/ · https://testing-library.com/
