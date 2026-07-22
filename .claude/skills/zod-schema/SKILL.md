---
name: zod-schema
description: Define shared Zod schemas for Anthem used across client, server, and webhook boundaries (intake input, job payloads, provider/Stripe webhook payloads). Use when adding or changing any validated data shape. Single source of truth for validation and inferred types.
---

# zod-schema

Owned by `frontend-experience-agent`; used by everyone. See PRD §4.5 for validation rules.

## Steps
1. Put shared schemas in `src/lib/schemas` so client and server import the same definition.
2. Encode the PRD §4.5 rules: e.g., `raw_feeling` length 20–1,500; enum values for tone/genre/status/role.
3. Export inferred TS types (`z.infer`) — do not hand-maintain parallel types.
4. Use the schema to parse at every boundary, including untyped webhook payloads.

## Guardrails
- One schema per concept; don't duplicate shapes.
- Changing a shared schema is a shared-contract change — notify `architecture-agent`.

## Done when
The schema is shared, drives both validation and types, and is used at each boundary.

Docs: https://zod.dev/
