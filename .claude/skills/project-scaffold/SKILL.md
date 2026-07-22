---
name: project-scaffold
description: Bootstrap the Anthem monorepo — Next.js (App Router, TS strict) + Tailwind + shadcn/ui, tRPC, Supabase client, Zod, and the folder layout. Use once at project start, or when adding a foundational cross-cutting piece of the skeleton.
---

# project-scaffold

One-time foundation for the Anthem app. See `research/tech-stack.md` and `CLAUDE.md` §2/§5.

## Steps
1. Initialize git if not already a repo (`git init`), add a `.gitignore` (node, `.env*`, `CLAUDE.local.md`).
2. Scaffold Next.js App Router + TypeScript (strict mode on in `tsconfig.json`).
3. Add Tailwind CSS + shadcn/ui; set up the base theme (calm, mobile-first).
4. Wire tRPC (server router + typed client) and TanStack Query provider.
5. Add the Supabase client (`src/lib/supabase`), Zod, and a typed env loader (fail-fast on missing vars — names in CLAUDE.md §6).
6. Create the folder layout: `src/app`, `src/server` (routers, MusicProvider, workers, webhooks), `src/lib` (schemas, clients, utils), `supabase/migrations`.
7. Configure lint + typecheck + test scripts; confirm a green dev server and `tsc --noEmit`.

## Guardrails
- TypeScript strict; no `any` without justification.
- Never commit secrets. Public client vars use the `NEXT_PUBLIC_` prefix only.
- Match the conventions in CLAUDE.md (kebab-case files, PascalCase components).

## Done when
Dev server runs, typecheck/lint/test pass, and the folder layout matches the plan. Ask before choosing a package manager if not already decided.

Docs: https://nextjs.org/docs · https://ui.shadcn.com/ · https://trpc.io/docs
