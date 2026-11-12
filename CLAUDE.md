## Deploy Configuration (configured by /setup-deploy)

- Platform: Cloudflare Workers + Static Assets (SERIAL account).
- Production URL: https://seriesoftrials.com
- Deploy workflow: `.github/workflows/deploy.yml`, automatically after checks pass on a push to `main`.
- Deploy status command: `gh run list --repo seriesoftrials/homepage --workflow deploy.yml --branch main --limit 5`
- Merge method: squash.
- Project type: web app; public landing source is `grainy/`.
- Post-deploy health check: `npm run deploy:verify` checks the exact deployed commit and asset hashes, database health, auth configuration and protected pages.

### Custom deploy hooks

- Pre-merge: `npm run check`.
- Deploy trigger: push/merge to `main` (`CLOUDFLARE_DEPLOY_ENABLED=true`).
- Manual deploy: `npm run deploy` with a SERIAL Cloudflare login or `CLOUDFLARE_API_TOKEN`.
- Homepage Worker: `serial-homepage`, route `seriesoftrials.com/*`.
- Existing member server: `serial`, reached through the `BACKEND` service binding; its D1, mail secrets and sessions remain there.
- Homepage revision: `/api/deployment`; backend revision: `/api/health`.
- `legacy-main` preserves the previous Next.js homepage; `grainy` remains the development branch.
