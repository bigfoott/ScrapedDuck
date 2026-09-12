# scrapedduck-api

Cloudflare Worker that scrapes leekduck.com on a cron and serves the JSON
through our own API. Replaces the GitHub Actions + `data` branch pipeline.

## Layout

- `src/index.ts` — scheduled handler (cron `*/10`) writes each scrape to KV;
  fetch handler serves `GET /:source` (+ `.json` suffix allowed, `?pretty`).
- `src/scrapers/` — HTMLRewriter ports of the old jsdom scrapers.
- On any scrape failure the previous KV value is left untouched: a scrape
  error never blanks the API.

## Sources

`events` `raids` `eggs` `research` `rocket-lineups` `promo-codes`

## Deploy

```
npx wrangler kv namespace create DATA   # paste the id into wrangler.jsonc
npx wrangler deploy
```

## Consumer cutover

Point the What's The Hundo worker's `EVENTS_URL`/`RAIDS_URL` at
`https://scrapedduck-api.<account>.workers.dev/events` and `/raids` once this
is deployed. The JSON shapes match the old `data` branch files; timestamps in
`events` are passed through verbatim from Leek Duck's feed (see the comment in
`src/scrapers/events.ts` — this is the fix for the Mega Finale fault).

## Not ported (yet)

- `.ics` calendar generation (`combinedetails.js`) — the Hundo worker dropped
  its `.ics` consumer (ADR 0005); add if another consumer appears.
- Per-event `extraData` detail scrapes (`detailedscrape.js`) — `extraData` is
  `null` in v1. Port the detail scrapers (raid-hour bosses, max battles,
  community day, GBL) the same way when a consumer needs them.
