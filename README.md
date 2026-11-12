# SERIAL homepage

The `main` branch deploys the SERIAL landing page to https://seriesoftrials.com, including the
glass S ribbon, entrance, Spirit reader, member portraits, language switcher
and support dialog. The frontend source was copied from SERIAL main commit
`04fe9ae40046ead25d42dcacd1c1403005c020db`.
The landing follows that pre-migration production layout and stays in light mode.
A single static CSS background gradient gradually deepens towards the footer.
There are no animated page backgrounds, document-wide noise overlays or
scroll-driven theme changes. Cards use a light translucent fill without extra blur.

## Run

Use Node.js 22.18 or later.

```sh
npm ci
npm run dev
```

Open <http://localhost:3000>. The landing assets are built automatically before
`dev` and `build`.

```sh
npm run lint
npm run build
npm start
```

## Edit the landing

| Content | Source |
| --- | --- |
| Landing HTML | `grainy/index.html` |
| Original article and full Intro page | `grainy/intro.html` |
| Layout, background and typography | `grainy/public/ver2.css` |
| Entrance and shared buttons | `grainy/public/ver2-intro.css`, `grainy/public/action-button.css` |
| Ribbon, navigation, languages and dialogs | `grainy/src/` |
| Original ribbon geometry, motion and Three.js | `grainy/assets/serial-ribbon-sequence/` |
| Images, portraits, fonts and licenses | `grainy/public/` |
| Static build and asset validation | `scripts/build-grainy.mjs` |
| Next.js route mapping | `next.config.ts` |

`npm run build:grainy` bundles the browser code and embeds the original Intro
article in the Spirit reader. It writes generated files to `public/grainy/` and
checks the HTML, CSS and Spirit frame references for missing local assets.
After editing the landing during development, rerun `npm run build:grainy` and
refresh the browser. Restart `npm run dev` after adding a new top-level asset path.

Next.js `beforeFiles` rewrites serve the landing at `/`, `/index.html`, and `/ver2`,
and the original article at `/intro`. Original asset URLs resolve to
`public/grainy/`. This preserves the original HTML, CSS and motion without applying
the existing React layout or Lenis scroll engine to these pages. Other Next.js
routes and components remain in the repository.

## Branches and production deployment

- `main`: production. A push or merge runs checks, deploys, and verifies the exact commit.
- `grainy`: development. Pushes do not deploy production; open a PR into `main` when ready.
- `legacy-main`: the previous `main`, preserved at `1ce4fc56199929bbd74fb7f0349d9921acc11ec6`.

GitHub Actions uses `.github/workflows/deploy.yml` and the repository Secret
`CLOUDFLARE_API_TOKEN`. The repository Variable `CLOUDFLARE_DEPLOY_ENABLED` must be
`true` to deploy. PRs run checks without publishing or requiring the secret.

```sh
npm run check          # lint, Next.js build, Worker tests and Cloudflare dry run
npm run deploy         # build and deploy using a SERIAL Cloudflare credential
npm run deploy:verify  # exact commit, asset hashes and existing member services
```

Production deploys the generated `public/grainy/` assets and `worker/index.mjs`
with Wrangler, independently of the Next.js preview server. Edit `grainy/` for
the live homepage; the older React pages remain available in local Next.js previews.

The `serial-homepage` Worker handles the `seriesoftrials.com/*` route in front
of the existing `serial` Worker. It serves this repository's landing and assets;
login, members, protected updates, APIs, Brand and other existing pages reach
`serial` through a service binding. The member email list, D1 database, session
secrets and mail credentials stay in the existing private backend. Join and
support retain their email links. No database migration is part of a homepage deploy.

`/api/deployment` identifies this repository's deployed commit. `/api/health`
continues to report the existing backend. See [deployment settings](CLAUDE.md).

To roll back homepage content, revert the relevant commit on `main`. To remove
the frontend layer entirely, remove only the `serial-homepage` route
`seriesoftrials.com/*` in Cloudflare; the existing `serial` Custom Domain remains
the origin. Do not delete the `serial` Worker or its D1 database.
