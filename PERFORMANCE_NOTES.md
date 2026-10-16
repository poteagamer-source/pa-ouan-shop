# Performance changes — 15 October 2026

## Measured build results

| Metric | Before | After |
| --- | ---: | ---: |
| Main JavaScript chunk, minified | 853.30 kB | 283.30 kB |
| Main JavaScript chunk, gzip | 231.95 kB | 89.04 kB |
| All 42 bundled source PNG images | 73,884,041 bytes | — |
| WebP alternatives for those 42 images | — | 1,341,202 bytes |

These are file-size measurements, not measured page-load times. Each page also
loads its own chunks. Not every image is requested on every page. PNG originals
remain available for compatibility; total deployment disk size therefore grows.
The web UI selects WebP for known bundled images and preserves uploaded/remote URLs.

## Changes

- Route-level lazy loading keeps charts and staff screens out of the initial bundle.
- Reproducible WebP conversion (maximum 800 × 800, aspect ratio preserved, quality 82).
- Lazy image loading except for the first three menu cards; asynchronous decoding.
- One shared EventSource connection per browser tab, closed after its last subscriber leaves.
- Kitchen refresh requests are serialized and coalesced; events received during a
  request schedule another refresh rather than being lost.
- Kitchen polling every five seconds is used when disconnected. A healthy stream
  gets a reconciliation refresh every 60 seconds and after reconnect/visibility changes.
- Kitchen elapsed-time labels update locally without a database request.
- Served history details are fetched in pages of 50. Aggregate totals and the
  existing order-hour chart cover all matching served orders, independent of page.
  Recent-order cards receive a separate latest-four list on later pages.
- Menu data remains cached across navigation, revalidates on reconnect and stock/product
  updates, and retains periodic recovery. API requests time out after 15 seconds.

## Verification

- TypeScript and Vite production build passed.
- Four Playwright checks run in Chrome with mocked API data and controllable realtime:
  WebP loading, history pagination/full totals, disconnected polling fallback,
  and event-driven kitchen refresh.
- Read-only checks against the configured database confirmed history pages 0/1
  and rejected negative/fractional pages. This database only had two matching
  served orders; pagination beyond 50 was checked with browser fixtures (120 orders).
- No schema migration or production payment was performed. No throughput/load-test
  result is claimed. Index tuning remains dependent on representative query plans.

## Commands

Run from `pa-auan-shop`:

```sh
npm run images:optimize
npm run build
npm run test:performance
```

Playwright requires Node 20+ and this configuration uses installed Chrome.
This workspace has Node 19 by default, so checks were run using:

```sh
npx --yes --package=node@22 --call "node node_modules/@playwright/test/cli.js test --reporter=line"
```

Build comparisons were written to `performance-baseline` and `performance-after`.
Both comparison folders were removed on 16 October 2026 after review; they are
not required for deployment. Generated build folders and dependencies are ignored
by Git; local copies remain available. Deploy the frontend and API together:
the new frontend requires `GET /api/orders/served-history`.

## Release verification — 16 October 2026

- Monthly graph and table share one yearly summary, with 12 months and year navigation.
- Sales API returns Bangkok calendar dates as `YYYY-MM-DD` strings to avoid
  PostgreSQL date conversion shifting month/year boundaries with server timezone.
- All 11 Chrome tests passed: 4 performance, 4 printing, and 3 sales-report tests.
  Sales fixtures cover month/year boundaries, zero months, chart/table agreement,
  independent daily filters, year navigation, and error retry.
- Receipt assertions and printing notes now match the existing A4 receipt UI.
- Production build and syntax checks for the changed API routes passed.
- Browser tests use mocked API responses, not production transactions.
- Run the full suite with Node 22 and installed Chrome:
  `npx playwright test --reporter=line` from `pa-auan-shop`.
- Render builds both projects from source via `render.yaml`; neither tracked
  `node_modules` nor tracked `dist` is required. Lockfiles remain versioned.
