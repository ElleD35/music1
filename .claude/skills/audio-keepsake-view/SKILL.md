---
name: audio-keepsake-view
description: Build Anthem's result/keepsake experience — audio playback (Howler/audio + wavesurfer), lyrics display (time-synced highlighting P1), tasteful visual, rename/download, and OG share cards for the public keepsake page. Use for the song result and share views.
---

# audio-keepsake-view

Owned by `frontend-experience-agent`. See PRD §3.5 and §3.8.

## Steps
1. Playback: play/pause/scrub via Howler.js or `<audio>` + a wavesurfer waveform; keyboard- and screen-reader-operable.
2. Lyrics: display full lyrics as an accessible transcript (time-synced highlighting is P1).
3. Presentation: title, tone, tasteful visual — a keepsake, not a utilitarian player. Considered typography, pacing, whitespace.
4. Actions: save (implicit on completion), rename title, download (subject to provider terms).
5. Sharing: opt-in per song; generate an unguessable `share_slug`; build the public keepsake page with OG metadata so links preview well.

## Guardrails
- Public page exposes only presentation fields — never intake/`raw_feeling` or identity.
- Default private; sharing is explicit.

## Done when
Playback + lyrics + visual render beautifully and accessibly, and an opt-in share link produces a preview-ready public page.

Docs: https://howlerjs.com/ · https://wavesurfer.xyz/ · https://nextjs.org/docs/app/api-reference/functions/image-response
