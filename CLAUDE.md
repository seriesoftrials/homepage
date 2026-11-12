## Deploy Configuration (configured by /setup-deploy)

- Platform: Cloudflare Workers + Static Assets (SERIAL account).
- Production URL: https://seriesoftrials.com
- Deploy workflow: `.github/workflows/deploy.yml`, automatically after checks pass on a push to `main`.
- Deploy status command: `gh run list --repo seriesoftrials/homepage --workflow deploy.yml --branch main --limit 5`
- Development branch: `develop`. Start ordinary work from it and target feature PRs at `develop`.
- Merge method: squash feature PRs into `develop`; use a merge commit for release PRs from `develop` into `main`, then merge `main` back into `develop`.
- Project type: web app; public landing source is `grainy/`.
- Post-deploy health check: `npm run deploy:verify` checks the exact deployed commit and asset hashes, database health, auth configuration and protected pages.

### Custom deploy hooks

- Pre-merge: `npm run check`.
- Checks trigger: pushes to `main` or `develop`, and PRs targeting either branch. Development checks do not deploy production.
- Deploy trigger: push/merge to `main` (`CLOUDFLARE_DEPLOY_ENABLED=true`).
- Manual deploy: `npm run deploy` with a SERIAL Cloudflare login or `CLOUDFLARE_API_TOKEN`.
- Homepage Worker: `serial-homepage`, route `seriesoftrials.com/*`.
- Existing member server: `serial`, reached through the `BACKEND` service binding; its D1, mail secrets and sessions remain there.
- Homepage revision: `/api/deployment`; backend revision: `/api/health`.
- Backport any production hotfix from `main` into `develop`.
- `legacy-main` preserves the original `main` at `1ce4fc56199929bbd74fb7f0349d9921acc11ec6`.
- The `grainy` Git branch was retired after its commits were included in `main` and `develop`; `grainy/` remains the active homepage source directory.
- `re` and `static` are earlier version branches. Preserve these version branches independently; adopting a version is an explicit change into `develop`.
