---
name: ci-cd-pipeline
description: Set up GitHub Actions CI/CD for Anthem — typecheck, lint, unit + E2E tests, and Supabase migrations applied to staging/prod on merge. Use to create or change CI workflows. Gates merges on green checks.
---

# ci-cd-pipeline

Owned by `devops-infra-agent`. See tech-stack §4.

## Steps
1. Add a GitHub Actions workflow: install → typecheck (`tsc --noEmit`) → lint → unit tests (Vitest) → E2E (Playwright, mocked externals).
2. On merge to `main`: apply Supabase migrations to staging/prod via the Supabase CLI (`supabase db push`), then trigger the Netlify deploy.
3. Require green checks to merge (branch protection).
4. Store CI secrets in GitHub Actions secrets — never in the repo.

## Guardrails
- Migrations in CI are authored by `database-agent`; CI only applies them.
- Never skip tests or migrations to force a deploy.
- Production migration/deploy steps require the human-approval gate.

## Done when
PRs run the full check suite, merges apply migrations safely, and bad merges are blocked.

Docs: https://docs.github.com/en/actions · https://supabase.com/docs/guides/deployment/managing-environments
