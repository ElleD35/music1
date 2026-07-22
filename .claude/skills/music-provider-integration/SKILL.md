---
name: music-provider-integration
description: Implement and maintain the MusicProvider abstraction over sunoapi.org for Anthem — generate(), getStatus(), handleWebhook() — keeping the unofficial reseller isolated and swappable. Use for any work calling the generation vendor. No app code may call the vendor directly.
---

# music-provider-integration

Owned by `generation-pipeline-agent`. See CLAUDE.md §2 and PRD §3.4/§5.2.

## Interface
Define `MusicProvider` with:
- `generate(input): { providerTaskId }`
- `getStatus(providerTaskId): { status, audioUrl?, lyrics?, durationSec? }`
- `handleWebhook(payload): normalized completion event`

Provide two implementations: `SunoApiOrgProvider` (real) and `MockMusicProvider` (deterministic, for tests — no real spend).

## Steps
1. Build a typed HTTP client for sunoapi.org using `MUSIC_PROVIDER_API_KEY`.
2. Zod-parse every provider response; never trust the shape.
3. Normalize provider fields into our domain shape so the rest of the app is vendor-agnostic.
4. Keep ALL vendor specifics inside this module — nothing else imports the vendor.

## Guardrails
- Do not swap/upgrade the provider or change generation cost without human approval.
- Treat the upstream as unofficial and changeable — fail loudly on unexpected shapes.

## Done when
The interface + real + mock implementations exist, responses are Zod-validated, and no other module references the vendor.

Docs: https://docs.sunoapi.org/
