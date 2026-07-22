---
name: db-query-optimization
description: Add and verify indexes for Anthem's hot query paths and analyze plans with EXPLAIN. Use when a query or endpoint is slow, or when adding a new frequently-run query (worker job poll, webhook lookup, library listing, RLS membership).
---

# db-query-optimization

Owned by `database-agent`. Index strategy is PRD §4.4.

## Target indexes
- `jobs (status, created_at)` — worker polling
- `jobs (provider_task_id)` — webhook → job correlation
- unique `jobs (idempotency_key)` — dedupe
- `songs (user_id, created_at desc)` / `songs (organization_id, created_at desc)` — listings
- unique `songs (share_slug)` — public page
- `org_members (user_id)` — RLS resolution (every authorized query)
- `credit_ledger (organization_id, created_at desc)`; unique `payments (stripe_payment_intent)`

## Steps
1. Identify the query and its filter/sort columns.
2. Run `EXPLAIN (ANALYZE, BUFFERS)` to see the current plan.
3. Add the minimal index (via a migration) that turns a seq scan into an index scan.
4. Re-run EXPLAIN to confirm the index is used; note the before/after.

## Guardrails
- Don't over-index write-heavy tables; each index costs on write.
- Index changes go through `supabase-migration`.

## Done when
The hot path uses an index (EXPLAIN-confirmed) and the change is in a migration.

Docs: https://www.postgresql.org/docs/current/indexes.html · https://supabase.com/docs/guides/database/query-optimization
