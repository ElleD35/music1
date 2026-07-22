---
name: db-seed-testdata
description: Generate realistic seed/fixture data (users, personal orgs, intakes, songs, credit grants, jobs in various states) for Anthem local dev and tests, respecting constraints and RLS. Use when setting up local development or preparing test scenarios.
---

# db-seed-testdata

Owned by `database-agent`. Respects the schema in PRD §4.

## Steps
1. Create a seed script (`supabase/seed.sql` or a TS seeder using the service role).
2. Seed a handful of users, each with an auto-created personal org and a `profiles` row.
3. Add representative scenarios: a completed song, a job mid-`running`, a `failed` job, a `dead_letter` job, an org with a credit balance, an append-only ledger history.
4. Keep data plausible but non-sensitive (no real personal content).
5. Make it reproducible/idempotent.

## Guardrails
- Never seed production. Local/test only.
- Keep the dataset small and fast.

## Done when
A single command produces a consistent dataset covering the key states for manual dev and automated tests.

Docs: https://supabase.com/docs/guides/local-development/seeding-your-database
