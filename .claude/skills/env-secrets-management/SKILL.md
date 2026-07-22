---
name: env-secrets-management
description: Manage environment variables and secrets across Netlify + Supabase for Anthem — service-role key server-only, fail-fast validation at boot, public vars prefixed NEXT_PUBLIC_. Use when adding/wiring env vars or auditing secret handling.
---

# env-secrets-management

Owned by `devops-infra-agent`. Var names live in CLAUDE.md §6.

## Required var names
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `MUSIC_PROVIDER_API_KEY`, `MUSIC_PROVIDER_WEBHOOK_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`. (Later: R2_*.)

## Steps
1. Add a typed env loader (Zod/t3-env) that validates required vars at boot and fails fast with a clear message.
2. Only `NEXT_PUBLIC_`-prefixed vars may reach the client; everything else is server-only.
3. Store real values in Netlify/Supabase env settings — never in the repo or `.env` committed files.
4. Keep `.env*` and `CLAUDE.local.md` gitignored.

## Guardrails
- The service-role key and all secrets NEVER touch the client bundle, URLs, or logs.
- Do not rotate/expose secrets without human approval.

## Done when
Missing vars fail fast at boot, no secret is client-exposed, and nothing sensitive is committed.

Docs: https://docs.netlify.com/build/environment-variables/overview/ · https://supabase.com/docs/guides/functions/secrets
