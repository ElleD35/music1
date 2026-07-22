---
name: trpc-endpoint
description: Add an end-to-end typesafe tRPC procedure for Anthem — input Zod schema, auth + rate-limit middleware, handler, and client hook. Use whenever exposing new app↔API behavior.
---

# trpc-endpoint

Owned by `frontend-experience-agent`; generation/payments own their own procedures. See PRD §5.

## Steps
1. Define the input/output with a shared Zod schema (`zod-schema` skill).
2. Add the procedure to the correct router; attach middleware: auth (session + org authz), rate limit where relevant.
3. Implement the handler; keep business logic in the owning domain's server module, not inline in the router.
4. Export the typed client hook (TanStack Query via `state-query-hooks`).
5. Add a test.

## Guardrails
- Every input validated with Zod; RLS remains the data backstop.
- Long-running generation is NEVER done in the procedure — enqueue via the pipeline and return a job id.
- Public/unauthenticated procedures expose only minimal projections.

## Done when
The procedure is typed end-to-end, guarded by auth/rate-limit as needed, and has a client hook + test.

Docs: https://trpc.io/docs · https://trpc.io/docs/client/nextjs
