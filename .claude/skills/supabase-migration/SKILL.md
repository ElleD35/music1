---
name: supabase-migration
description: Author and apply a versioned SQL migration (tables, enums, constraints, indexes) via the Supabase CLI for the Anthem project. Use whenever the database schema changes — new table/column/enum/index, or a data change. Migrations live in version control; never click-edit production.
---

# supabase-migration

Owned by `database-agent`. Schema source of truth is PRD §4.

## Steps
1. Read the change intent and the relevant PRD §4 table definition.
2. Create a new migration: `supabase migration new <name>`.
3. Write idempotent, forward-only SQL: tables with a non-null `organization_id` on tenant tables, Postgres enums for status/role fields, CHECK constraints per PRD §4.5, and indexes per §4.4.
4. Pair every new tenant table with an RLS policy (use the `rls-policy-authoring` skill).
5. Apply locally (`supabase db push` / reset), regenerate TypeScript types.
6. Hand a coverage request to `testing-qa-agent`.

## Guardrails
- Ask the human before any destructive change (drop/rename column, backfill) and describe the rollback.
- Do not change schema shape, pricing, or credit costs without approval.
- Keep migrations small and reviewable; one concern per migration.

## Done when
Migration applies cleanly locally, types regenerate, RLS is attached for tenant tables, and a test request is filed.

Docs: https://supabase.com/docs/guides/local-development · https://www.postgresql.org/docs/
