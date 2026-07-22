---
name: credit-ledger-integrity
description: Implement and maintain Anthem's append-only credit ledger and cached balance — transactional grant/debit, debit only on generation success, balance>=0, no double-spend under concurrency. Use for any credit grant/debit logic. Money-adjacent — highest care.
---

# credit-ledger-integrity

Owned by `database-agent`; consumed by `payments-billing-agent` and `generation-pipeline-agent`. See PRD §3.7 and §4.2.

## Model
- `credit_ledger` is append-only: `{ organization_id, user_id, delta, reason, ref_id, balance_after, created_at }`.
- `credit_balances` is a cached balance kept in sync in the SAME transaction as the ledger insert.
- Reasons: `signup_grant`, `purchase`, `generation_debit`, `refund`, `adjustment`.

## Rules
1. Debit credits ONLY on generation success (never on enqueue).
2. Grant/debit happen inside a transaction that (a) appends to the ledger and (b) updates the cached balance, with a CHECK/guard that balance never goes negative.
3. Prevent double-spend under concurrency: use row locks (`select ... for update`) or an atomic RPC; make grants idempotent by keying on the source event id (Stripe event / job id).
4. Expose a single RPC/function others call — no ad-hoc balance math elsewhere.

## Guardrails
- Never change credit costs or free-tier grants without human approval.
- Hand concurrency tests (no negative balance, no double-spend) to `testing-qa-agent`.

## Done when
Grant/debit are transactional and idempotent, balance can't go negative, and concurrency tests pass.

Docs: https://www.postgresql.org/docs/current/tutorial-transactions.html · https://supabase.com/docs/guides/database/functions
