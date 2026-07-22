---
name: state-query-hooks
description: Create TanStack Query hooks (server state — job polling, songs, credit balance) and Zustand stores (light UI state — wizard step, player) for Anthem. Use when wiring data fetching/polling or local UI state. No Redux.
---

# state-query-hooks

Owned by `frontend-experience-agent`. See CLAUDE.md §2 (state).

## Steps
1. Server state → TanStack Query hooks with stable cache keys. For generation, poll the job status query until `done`/`failed` (then stop), or subscribe via Supabase Realtime.
2. Light UI state → small Zustand stores (wizard step, audio player state, modals).
3. Keep server and UI state separate; don't mirror server data into Zustand.

## Guardrails
- No Redux.
- Set sensible polling intervals and stop conditions to avoid hammering the API.

## Done when
Hooks/stores are typed, polling stops correctly, and server vs UI state are cleanly separated.

Docs: https://tanstack.com/query/latest · https://zustand.docs.pmnd.rs/
