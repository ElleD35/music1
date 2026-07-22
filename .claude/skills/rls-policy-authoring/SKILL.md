---
name: rls-policy-authoring
description: Write and verify Row Level Security policies enforcing org-based tenant isolation for the Anthem project. Use whenever a tenant table is created or its access rules change, or when defining the minimal public-read policy for share pages. Safety-critical — a wrong policy leaks tenant data.
---

# rls-policy-authoring

Owned by `database-agent`, consumed by `auth-tenancy-agent`. See PRD §4.3.

## Pattern
Enable RLS on every tenant table. A row is accessible iff the requester belongs to its org:

```sql
create policy <table>_tenant_isolation on <table>
using (
  organization_id in (
    select org_id from org_members where user_id = auth.uid()
  )
);
```

## Steps
1. Enable RLS on the table.
2. Add select/insert/update/delete policies scoped by org membership.
3. For the public keepsake page: a dedicated read policy exposing ONLY presentation fields where `is_public = true` and matched by `share_slug` — never `raw_feeling`, intake, or identity.
4. System writes (worker, webhooks) use the service-role key (bypasses RLS) — server-only.
5. Write a test proving cross-tenant reads are denied and share reads leak nothing sensitive; hand to `testing-qa-agent`.

## Guardrails
- Default-deny mindset; never widen access to satisfy a feature — fix the query.
- Never expose the service-role key to the client.

## Done when
Policies exist for all operations, the public path is minimal, and a passing isolation test confirms no cross-org leakage.

Docs: https://supabase.com/docs/guides/database/postgres/row-level-security
