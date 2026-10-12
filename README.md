# Presentations

Resources and slide decks from talks and sessions I've given at user groups and conferences over the years.

Browse by year — the most recent material lives in [2026/](2026/).

## Presentation website

This archive also powers a static Astro presentation library designed for **Azure Static Web Apps**, not GitHub Pages. Existing slide decks, reference documents, templates and filenames remain the source of truth.

### Run locally

Use Node.js 22.12 or newer (Node.js 24 is used in CI). From the repository root, change into the website folder:

```sh
cd website
npm ci
npm run dev
```

Open the URL printed by Astro, normally http://localhost:4321. The first command copies the repository's small shared images into the generated public asset directory. No Azure credentials are needed.

```sh
npm run validate
npm test
npm run check
npm run build
npx playwright install chromium
npm run test:browser
npm run preview
```

Run all website commands above from `website/`. The production output is `website/dist/`. Browser tests start a separate preview server on port 4322 and cover desktop, tablet, mobile, narrow mobile, keyboard access, WCAG checks, search, combined filters, sorting, direct detail links, downloads and supporting code. Screenshots are stored in the ignored `website/test-results/` directory. External resources are not fetched during validation; their availability can change independently.

On a minimal Linux container, Chromium also needs system libraries. Install them with `npx playwright install --with-deps chromium` in your terminal when you have administrator access; CI already runs this step. Playwright uses Astro's `--ignore-lock` mode so its server remains in the foreground and is cleaned up after tests.

### Architecture

- Astro generates the homepage, event/year browsing, 48 initial presentation pages, a custom 404, robots.txt and sitemap.xml. There is no database, React, authentication or runtime GitHub API request.
- Website source, configuration, scripts and tests live in `website/`. The presentation archive and shared `images/` remain at the repository root.
- `website/src/lib/catalog.mjs` discovers year/event or year/topic folders at the repository root (the parent of the website working directory) and parses Markdown with Marked. Resource HTML is sanitized. Meaningful talk headings and abstracts are reused instead of copied into a second CMS.
- Multiple decks become separate entries. A folder with several titled resource documents becomes several entries unless an explicit association says otherwise. Generic headings use filenames or folder names, with validation notes. Empty folders are omitted and reported.
- Browser JavaScript receives only a build-time search index. Search, topic, event, year and sort state are reflected in shareable query parameters. All pages and resources remain readable without JavaScript; filtering requires it.
- Downloads use the existing public GitHub raw files on `main`. The roughly 650 MB slide archive is deliberately **not** copied into Azure's deployment artifact, which would exceed published Static Web Apps app-size limits. Small local images and fonts are served by the site itself. GitHub availability and raw-file browser behavior apply to downloads; PDF links may open a browser viewer.
- Exact dates and event names are optional. The current archive supports year ordering and four event labels explicitly stated in README text. Folder names are shown as archive context, not claimed as confirmed events. Topic filters are derived conservatively from titles, descriptions and headings; use overrides when you need precise categories.
- `npm run build` verifies that every discovered presentation has a generated page and that advertised downloads, public assets and Azure configuration are present. Missing local links, invalid metadata and duplicate IDs fail the build with source context. Empty or malformed historical external links are omitted with warnings, not silently repaired.

### Add a presentation

1. Add slides and resources to the appropriate existing year folder, preserving the archive convention. A new `YYYY/event-or-topic/` folder is also supported.
2. Add a README with the actual talk title as an H1, an optional `## Abstract`, and links under `## Resources and Links` or topic headings. Relative links to local files are supported, as are existing GitHub links to this repository. Supporting code and other resources can stay in the same folder.
3. From `website/`, run `npm run validate` and review its content notes. Run tests and build before opening a pull request. New pages and filters are generated automatically.

Add an optional `presentation.json` beside the README only when metadata or associations need clarification. Paths are **repository-relative**, not relative to the JSON file:

```json
{
	"id": "permanent-shareable-id",
	"title": "Actual title from your talk",
	"event": "Confirmed event name",
	"date": "2026-10-10",
	"topics": ["Azure Arc"],
	"documents": ["2026/event-or-topic/readme.md"],
	"files": ["2026/event-or-topic/actual-deck.pptx"]
}
```

This is a schema example, not an existing presentation. Use only real metadata and existing paths; omit unknown fields rather than guessing. All fields are optional for a single talk. `description` can override an unsuitable introduction. `files` accepts existing PowerPoint/PDF files; `documents` accepts Markdown. Omit these fields to discover the single talk's files automatically; use empty arrays to explicitly exclude them. For several talks in one folder, use an array of objects and specify `id`, `documents` and `files` for each talk. `2024/kustoquerylanguage/presentation.json` demonstrates linking the query examples to their parent talk without moving either file.

Default IDs derive from folder paths (and document/deck filenames for multi-talk folders), not titles. Set a permanent `id` before sharing a QR code if filenames or associations may change. Do not change that ID after publication. There are no automatic redirects for renamed IDs.

### Azure and GitHub configuration

1. Create an **Azure Static Web App** in your own subscription, choosing the appropriate region and Free or Standard plan. No API or application server is required. Check the chosen plan's preview-environment limits. Do not create a GitHub Pages deployment.
2. Use the supplied `.github/workflows/website.yml` rather than keeping a second portal-generated deployment workflow. Production is configured for the repository's existing default branch, `main`. Update the trigger, `production_branch`, and GitHub source/raw URL helpers together if that branch changes.
3. Copy the Static Web App deployment token into a GitHub Actions repository secret named `AZURE_STATIC_WEB_APPS_API_TOKEN`. Never put it in files, `.env` committed to Git, browser code or repository variables.
4. Set the repository Actions variable `SITE_URL` to the real production HTTPS origin from Azure or your configured custom domain, without a path. Set `AZURE_DEPLOYMENT_ENABLED` to `true` when ready. Before that, the workflow runs validation, tests, typechecking and a build but skips Azure deployment.
5. Optional variables: `WEBSITE_BUILD_COMMAND` (default `npm run build`, executed from `website/`) and `WEBSITE_OUTPUT_DIRECTORY` (default `dist`, relative to `website/`). Change Astro's `outDir`, the verifier, and Playwright preview settings consistently if changing the output directory. The workflow caches dependencies using `website/package-lock.json`, builds with Node.js first, uploads `website/dist/` by default, then deploys the checked artifact with Azure's build disabled.
6. Enable Actions and allow the deployment job's `pull-requests: write` permission if PR preview comments are wanted. Same-repository PRs receive preview deployments when enabled; their environments close on PR closure. Fork PRs run credential-free checks but do not receive secrets or deploy previews. Do not use `pull_request_target` to run untrusted code with a deployment token.
7. Add branch protection requiring the `check` job. Test an actual deployment, a direct presentation URL, an unknown URL returning HTTP 404, and a PR preview after configuring Azure. Azure deployment has not been performed by this implementation.

`website/public/staticwebapp.config.json` provides the real 404 response and security/cache headers. No SPA navigation fallback is used: detail URLs are physical static pages, and search query parameters stay on the homepage. Azure Static Web Apps resolves generated directory index pages. The workflow deploys on pushes/merges to `main` and supports manual dispatch. For an enabled deployment, the production URL is required.

`SITE_URL=https://your-actual-origin npm run build` generates canonical and social URLs plus an absolute sitemap. Replace that value with your own configured origin. Without `SITE_URL`, local builds still succeed, canonical/absolute social URLs are omitted, sitemap.xml is intentionally empty, and robots.txt omits its sitemap declaration. Preview builds use production canonical URLs to avoid creating a second canonical copy.

### Content notes and limitations

The earlier visual mockup was not available during implementation; the site follows the written light/navy/blue library direction. No presentations, dates, descriptions or external resources have been invented.

Many older headings say only "Learn it all", some deck names include "public", and some topic folders do not identify an event. These are shown faithfully with fallback titles. Improve them with verified optional metadata rather than reorganizing the archive. The empty `2018/SQLGLA/README.md` is preserved but generates no page. An empty Azure Arc/Octopus demo link and malformed nested Cloud Direct/.NET Edinburgh event links are omitted and reported. Exact talk dates are currently unavailable, so entries display their source year. Related presentations are based on shared topics, not inferred event history.

The site does not verify external link health or that a slide file is a valid Office/PDF binary. Metadata validation checks existence and supported extensions. Remote README images are not embedded, avoiding broken historical assets and external page-load requests; small shared repository images are used instead. No analytics or tracking services are added.

## About me

Written by Sarah Lean.

[![YouTube Channel Subscribers](https://img.shields.io/youtube/channel/subscribers/UCQ8U53KvEX2JuCe48MxmV3Q?label=YouTube%20subscribers&style=social)](https://www.youtube.com/techielass?sub_confirmation=1)

Find me on:

- Blog: <https://www.techielass.com>
- LinkedIn: <https://www.linkedin.com/in/sazlean/>
- YouTube: <https://www.youtube.com/techielass>

## Reuse

Slides are shared for reference. If you reuse any material, a credit back to this repo is appreciated.

## Speaking

Interested in having me speak at your event? Reach out on [LinkedIn](https://www.linkedin.com/in/sazlean/).