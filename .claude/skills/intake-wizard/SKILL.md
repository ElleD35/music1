---
name: intake-wizard
description: Build Anthem's multi-step emotional intake (React Hook Form + Zod) — gentle questions (recipient, story, tone, genre, extras), save/resume via intake_sessions, and the server-side feelings-to-prompt translation. Use for the intake flow. Never expose raw prompt language.
---

# intake-wizard

Owned by `frontend-experience-agent`; gated by `trust-safety-agent`. See PRD §3.2.

## Steps
1. Multi-step form collecting: who it's for (self/other), the raw story/feeling (free text, 20–1,500 chars, encouraging helper copy), desired tone, musical style/genre (plain-language presets), optional extras (names to include/avoid, a wished-for line).
2. Persist progress to `intake_sessions`; allow abandon + resume.
3. On submit: send to the server, which runs moderation (`content-moderation-safety`) BEFORE anything else, then produces `generated_prompt` via a server-side feelings-to-prompt translation (curated templates + structured answers).
4. If moderation returns crisis/blocked, show the appropriate screen instead of proceeding.

## Guardrails
- Never show users raw AI "prompt" text — the translation is our job and stays server-side.
- Calm, non-nagging validation copy; this user is vulnerable.

## Done when
The wizard saves/resumes, is accessible, produces a server-side prompt, and only proceeds on an approved intake.

Docs: https://react-hook-form.com/ · https://zod.dev/
