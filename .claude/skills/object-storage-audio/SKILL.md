---
name: object-storage-audio
description: Persist Anthem's generated audio and keepsake images to Supabase Storage (swappable to Cloudflare R2), storing URLs in Postgres, with signed URLs and access scoping. Use when saving finished audio/images or wiring the storage layer.
---

# object-storage-audio

Owned by `generation-pipeline-agent`; consumed by `frontend-experience-agent`. See PRD §3.5.

## Steps
1. On generation completion, download the provider audio (and any image) and store it via a storage adapter.
2. Store only the URL in `songs.audio_url` / `songs.image_url` — never the bytes in Postgres.
3. Use a swappable adapter interface so Supabase Storage can be replaced with Cloudflare R2 (zero egress) later without touching callers.
4. Private by default; generate signed URLs for authenticated playback. Public share pages expose only the presentation URL.

## Guardrails
- Keep the storage backend behind the adapter (don't hard-code Supabase Storage in callers).
- Respect provider terms on downloadable audio.

## Done when
Finished audio is stored, its URL is persisted, access is scoped, and the backend is swappable to R2.

Docs: https://supabase.com/docs/guides/storage · https://developers.cloudflare.com/r2/
