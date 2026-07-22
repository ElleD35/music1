---
name: adr-and-memory-update
description: Record architecture decisions and keep Anthem's CLAUDE.md current — especially §3 "Current State" (built / in progress / tech debt) as work lands. Use after a feature/migration/deploy completes or when an architecture decision is approved. Prevents context drift across sessions.
---

# adr-and-memory-update

Owned by `documentation-memory-agent`. See CLAUDE.md and the memory docs.

## Steps
1. When work lands, update `CLAUDE.md` §3 "Current State": move items from in-progress to built, add new known issues/tech debt. Keep it concise (loads every session).
2. Update the §5 file-structure map as directories/files become real.
3. When `architecture-agent` approves a pattern/contract, write a short ADR (context → decision → consequences).
4. Verify claims before recording — never mark a feature done unless it is.

## Guardrails
- Do NOT alter CLAUDE.md's rules, architecture decisions, or product facts on your own — reflect decisions others made; ask if a fact seems changed.
- Keep sensitive data out of docs.

## Done when
CLAUDE.md Current State reflects reality, the file map is current, and approved decisions have ADRs.

Docs: https://code.claude.com/docs/en/memory · https://adr.github.io/
