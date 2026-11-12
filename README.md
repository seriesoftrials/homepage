# SERIAL homepage

The `main` branch deploys the SERIAL landing page to https://seriesoftrials.com, including the
glass S ribbon, entrance, Spirit reader, member portraits, language switcher
and support dialog. The frontend source was copied from SERIAL main commit
`04fe9ae40046ead25d42dcacd1c1403005c020db`.
The landing follows that pre-migration production layout and stays in light mode.
A single static CSS background gradient gradually deepens towards the footer.
There are no animated page backgrounds, document-wide noise overlays or
scroll-driven theme changes. Cards use a light translucent fill without extra blur.

## 브랜치 전략

평소 개발은 `develop`에서 진행하고, 배포할 때 `main`에 반영합니다.

| 브랜치 | 역할 | 검사·배포 |
| --- | --- | --- |
| [`main`](https://github.com/seriesoftrials/homepage/tree/main) | 현재 운영 중인 홈페이지의 배포 기준 | 반영 시 자동 검사 → 운영 배포 → 배포 검증 |
| [`develop`](https://github.com/seriesoftrials/homepage/tree/develop) | 작업을 모으고 검증하는 개발 통합 브랜치 | 자동 검사만 실행. 배포는 `main`으로 릴리스 PR을 보내서 진행 |
| `codex/<작업명>` | `develop`에서 나누는 임시 작업 브랜치 | 작업 후 `develop`으로 PR |
| [`legacy-main`](https://github.com/seriesoftrials/homepage/tree/legacy-main) | 이름을 바꿔 보존한 기존 `main` | 이전 버전 참고용. 자동 운영 배포 없음 |
| [`re`](https://github.com/seriesoftrials/homepage/tree/re), [`static`](https://github.com/seriesoftrials/homepage/tree/static) | 각각의 변경을 보존한 이전 버전 브랜치 | 이전 버전 참고용. 자동 운영 배포 없음 |

### 개발부터 배포까지

```text
codex/<작업명> ──PR──▶ develop ──릴리스 PR──▶ main ──자동 배포──▶ seriesoftrials.com
```

1. 최신 `develop`에서 작업 브랜치를 만들고, 완료한 작업은 `develop`으로 PR을 보냅니다. 작업 PR은 **Squash merge**로 합칩니다.
2. 배포할 준비가 되면 `develop` → `main` 릴리스 PR을 보냅니다. 공유 이력이 유지되도록 **Create a merge commit**으로 합칩니다.
3. 배포 후에는 `main`을 `develop`에 다시 병합합니다. `main`에 긴급 수정이 들어간 경우에도 `develop`에 반영합니다.

```sh
git fetch origin
git switch develop
git pull --ff-only
git switch -c codex/update-homepage
```

### `grainy` 브랜치와 소스 폴더

`grainy`는 별도로 올렸던 버전 브랜치입니다. 모든 커밋이 `main`과 `develop`에
포함된 것을 확인해 **로컬·원격 브랜치를 삭제했습니다**.
현재 홈페이지의 실제 소스인 **[`grainy/`](grainy/)** 폴더는 계속 사용합니다.
브랜치를 삭제한 것이며, 이 폴더나 소스를 삭제한 것은 아닙니다.

`legacy-main`·`re`·`static`은 개발·배포 단계가 아닌 이전 버전 보관용입니다.
각 브랜치의 고유한 변경을 확인하기 전에는 자동으로 합치거나 삭제하지 않습니다.

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

## Production deployment

GitHub Actions uses `.github/workflows/deploy.yml` and the repository Secret
`CLOUDFLARE_API_TOKEN`. The repository Variable `CLOUDFLARE_DEPLOY_ENABLED` must be
`true` to deploy. Pushes to `develop` and PRs targeting `develop` or `main` run
checks without publishing or requiring the secret. Only `main` can run the
production deployment job.

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
