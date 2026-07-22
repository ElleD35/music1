# Anthem (prototype)

Describe a feeling or story, and get an original AI-generated song. Next.js frontend
with a thin server-side proxy to [sunoapi.org](https://docs.sunoapi.org/) — the API key
stays on the server and is never exposed to the browser.

## Run locally

Requires Node.js 20+.

```bash
npm install
# create .env with your key (see .env.example)
npm run dev
# open http://localhost:3000
```

`.env`:

```
SUNO_API_KEY=your_sunoapi_org_key_here
```

## Deploy to Netlify

1. Push this repo to GitHub.
2. In Netlify: **Add new site → Import from GitHub** and pick the repo.
3. Netlify auto-detects Next.js (build `npm run build`).
4. **Set the environment variable** (this is the step that's easy to forget):
   **Site settings → Environment variables → Add** `SUNO_API_KEY` = your key.
5. Deploy. The site builds and serves the app + the `/api/*` serverless routes.

## How it works

- `app/page.tsx` — the UI: describe music → generate → poll → play/download.
- `app/api/generate` — server route, calls Suno `POST /api/v1/generate`, returns a `taskId`.
- `app/api/status` — server route, polls Suno `GET /api/v1/generate/record-info`.
- `lib/suno.ts` — the only place that talks to the vendor (swappable).

Generation takes ~1–3 minutes; the UI polls until the song is ready.

## Notes

- Uses simple (non-custom) mode with a 500-character prompt.
- No database, no accounts — a functional prototype.
- Please make songs about your own life, not real artists.
