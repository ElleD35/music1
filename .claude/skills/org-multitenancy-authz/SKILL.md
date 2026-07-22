---
name: org-multitenancy-authz
description: Enforce org-scoped access and roles (owner/admin/member) for Anthem — membership resolution, role-gated org-management actions, and the rule that every tenant table carries a non-null organization_id. Use for any authorization/role check or org-membership gating.
---

# org-multitenancy-authz

Owned by `auth-tenancy-agent`. See PRD §4.

## Steps
1. Build a membership resolver: given `auth.uid()`, return the user's orgs and roles from `org_members`.
2. Provide reusable authz guards for tRPC procedures (e.g., `requireOrgRole(orgId, 'admin')`).
3. Gate org-management actions (invite/remove member, change role) to `owner`/`admin`.
4. Ensure every tenant-scoped query/write carries `organization_id` and relies on RLS as the backstop (defense in depth).
5. Hand role/tenant tests to `testing-qa-agent`.

## Guardrails
- App-layer authz complements, never replaces, RLS.
- Don't change role semantics without human approval.
- RLS policy SQL is authored by `database-agent`.

## Done when
Role-gated actions are enforced in the app layer and covered by tests, with RLS as the backstop.

Docs: https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac
