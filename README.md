# SERIAL homepage — grainy

The `grainy` branch serves the current SERIAL landing page at `/`, including the
grain, glass S ribbon, entrance, Spirit reader, member portraits, language switcher
and support dialog. The frontend source was copied from SERIAL main commit
`04fe9ae40046ead25d42dcacd1c1403005c020db`.

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
| Layout, grain and typography | `grainy/public/ver2.css` |
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

This branch contains public frontend source and assets. It does not include the
Cloudflare Worker, member authentication, member email list, database or runtime
configuration. Join and support keep the original email links. A push to `grainy`
does not merge it into `main` or change the production domain.
