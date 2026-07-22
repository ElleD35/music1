---
name: e2e-testing
description: Write Playwright end-to-end tests for Anthem's core flows — signup → intake → (mocked) generation → keepsake, and checkout → credit grant. Use for full-flow coverage. Uses the MusicProvider mock and Stripe test mode to avoid real spend.
---

# e2e-testing

Owned by `testing-qa-agent`. See PRD §6/§8.

## Flows to cover
1. Signup → intake wizard → moderation approve → (mocked) generation → keepsake view with playback + lyrics.
2. Crisis intake → crisis-resources screen (no song generated).
3. Buy credit pack (Stripe test mode) → credits granted → generation allowed.
4. Rate-limit / insufficient-credit path → clear, warm block.

## Steps
1. Configure Playwright; run against a local app wired to `MockMusicProvider` and Stripe test mode.
2. Make tests deterministic (mock provider returns fixed audio/lyrics).
3. Run in CI (`ci-cd-pipeline`).

## Guardrails
- Never hit the real provider or live billing.

## Done when
The core flows pass reliably in CI with mocked externals.

Docs: https://playwright.dev/ · https://docs.stripe.com/test-mode
