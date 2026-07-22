---
name: stripe-payments-integration
description: Implement credit-pack purchases for Anthem — Stripe Checkout sessions, customer mapping, and the idempotent webhook that grants credits. Use for checkout/purchase/credit-grant work. Subscriptions are P1 (needs approval).
---

# stripe-payments-integration

Owned by `payments-billing-agent`. See PRD §3.7.

## Steps
1. Define credit-pack products/prices (use Stripe test mode in dev).
2. Build a `billing.createCheckout` endpoint that creates a Checkout session for a selected pack and maps the Stripe customer to the org/user.
3. Handle the Stripe webhook (via `webhook-handler`): on `checkout.session.completed`/`payment_intent.succeeded`, grant credits through `credit-ledger-integrity`, keyed idempotently on the event/payment-intent id; write a `payments` row.
4. Show cost/balance clearly before purchase.

## Guardrails
- Never set or change prices, credit costs, free-tier grants, or add subscriptions without human approval (unit-economics impact).
- Never store card data; never expose the Stripe secret key client-side.

## Done when
A user can buy a credit pack, credits are granted exactly once, `payments` is recorded, and tests (test mode) pass.

Docs: https://docs.stripe.com/payments/checkout · https://docs.stripe.com/webhooks · https://docs.stripe.com/test-mode
