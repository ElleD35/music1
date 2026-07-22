---
name: supabase-auth-setup
description: Configure Supabase Auth for Anthem — email OTP/magic link + Google, session persistence, protected-route redirects, and the post-signup trigger that auto-creates a personal organization and profiles row. Use for login/signup/session setup or changes.
---

# supabase-auth-setup

Owned by `auth-tenancy-agent`. See PRD §3.1 and §4.3.

## Steps
1. Enable email OTP/magic link and Google provider in Supabase Auth.
2. Add Next.js server-side session handling and middleware that redirects unauthenticated users away from protected routes.
3. On first signup, run a trigger (coordinate the migration with `database-agent`) that creates a personal `organizations` row (`type=personal`), an `org_members` row with role `owner`, and a `profiles` row with `default_org_id`.
4. Implement logout; rely on Supabase default session expiry.
5. Request auth-flow tests from `testing-qa-agent`.

## Guardrails
- Never place tokens/secrets in client-visible code, URLs, or logs.
- Ask before changing session lifetime or provider config.
- Login UI belongs to `frontend-experience-agent` — provide hooks/contracts, not screens.

## Done when
Signup/login/logout work, sessions persist, protected routes redirect, and a personal org + profile are created on first signup.

Docs: https://supabase.com/docs/guides/auth · https://supabase.com/docs/guides/auth/server-side/nextjs
