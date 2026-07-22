---
name: content-moderation-safety
description: Screen Anthem intake text before generation — block impersonation of real artists, hate, minors, harassment; route crisis content to a calm crisis-resources off-ramp. Use for EVERY intake before enqueue and any change to input handling. Safety-critical; tuned to NOT block ordinary grief.
---

# content-moderation-safety

Owned by `trust-safety-agent`; gates `generation-pipeline-agent`. See PRD §3.3 and §0 (duty of care).

## Behavior
1. Screen `raw_feeling` (and extra details) before any job is enqueued.
2. Block, with a gentle explanation, and log to `moderation_events`:
   - impersonation of a real, identifiable artist/public figure (permanent legal red line — ELVIS Act, CA AB 2602/1836)
   - hate, sexual content involving minors, targeted harassment
3. Route genuine crisis content (self-harm/suicidal intent, abuse-in-progress) to a calm, locale-aware crisis-resources screen (e.g., 988 in the US) INSTEAD of an error or a song.
4. Return one of: `approved` | `blocked_policy` | `blocked_crisis` (+ resources payload).

## Tuning
- Do NOT block ordinary grief, sadness, or trauma — that is the product's expected content. A false block harms the user; a false negative on crisis is a safety failure. On borderline crisis, fail safe toward the off-ramp and flag for human review.

## Guardrails
- Never loosen policy, change thresholds, or add/remove categories without human approval.
- Never let generation proceed on unscreened input.

## Done when
Every intake is screened, decisions are logged, crisis routes to resources, and tests distinguish grief-allowed vs crisis-blocked.

Docs: https://docs.claude.com/en/api/overview · https://988lifeline.org/
