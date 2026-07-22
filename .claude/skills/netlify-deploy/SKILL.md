---
name: netlify-deploy
description: Configure Netlify for Anthem — Next.js app + Functions + Background Functions, netlify.toml, Deploy Previews, and env wiring. Use for hosting/deploy config and preview deploys. Production deploys require human approval.
---

# netlify-deploy

Owned by `devops-infra-agent`. See tech-stack §4.

## Steps
1. Add `netlify.toml`: build command, publish dir, function routing.
2. Configure Functions (sync ≤~60s) and Background Functions (≤15 min) — the worker for `async-job-pipeline` on paid plans; on Free, use a Supabase Edge Function instead.
3. Set environment variables (names in CLAUDE.md §6) in Netlify — secrets server-side only.
4. Enable Deploy Previews per PR.
5. Use the Netlify MCP (once configured) for deploys and log inspection.

## Guardrails
- Do NOT deploy to production without explicit human approval.
- Free tier permits commercial use; Background Functions need a paid plan — flag the cost before enabling.
- Never expose secrets to the client bundle.

## Done when
Previews build green and the app + functions run on Netlify; production is gated on approval.

Docs: https://docs.netlify.com/deploy/deploy-overview/ · https://docs.netlify.com/build/functions/background-functions/ · https://github.com/netlify/netlify-mcp
