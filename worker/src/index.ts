/// Entry point: cron scrapes every source into KV, HTTP serves it.
/// Routes: GET /:source (events|raids|eggs|research|rocket-lineups|promo-codes),
/// optional ?pretty. The Hundo worker reads these with a plain fetch.

import type { Env } from "./types";
import { scrapeEvents } from "./scrapers/events";
import { scrapeRaidBosses } from "./scrapers/raids";
import {
  scrapeEggs,
  scrapeResearch,
  scrapeRocketLineups,
  scrapePromoCodes,
} from "./scrapers/misc";

const SOURCES = [
  "events",
  "raids",
  "eggs",
  "research",
  "rocket-lineups",
  "promo-codes",
] as const;
type Source = (typeof SOURCES)[number];

const isSource = (s: string): s is Source =>
  (SOURCES as readonly string[]).includes(s);

/// Same check on a token so the manual refresh endpoint can't be called by
/// third parties. Set with: npx wrangler secret put REFRESH_TOKEN
const authorized = (request: Request, env: Env): boolean => {
  const token = env.REFRESH_TOKEN;
  if (!token) return false;
  return request.headers.get("authorization") === `Bearer ${token}`;
};

export default {
  async scheduled(
    _controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ) {
    ctx.waitUntil(refresh(env, "events"));
    ctx.waitUntil(refresh(env, "raids"));
    ctx.waitUntil(refresh(env, "eggs"));
    ctx.waitUntil(refresh(env, "research"));
    ctx.waitUntil(refresh(env, "rocket-lineups"));
    ctx.waitUntil(refresh(env, "promo-codes"));
  },

  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);
    const source = url.pathname.replace(/^\//, "").replace(/\.json$/, "");

    // POST /:source/refresh — run the scraper now, no cron wait.
    if (request.method === "POST" && url.pathname.endsWith("/refresh")) {
      if (!authorized(request, env)) {
        return json({ error: "unauthorized" }, 401);
      }
      const target = url.pathname
        .replace(/^\//, "")
        .replace(/\/refresh$/, "");
      if (!isSource(target)) {
        return json({ sources: SOURCES }, 404);
      }
      ctx.waitUntil(refresh(env, target));
      return json({ started: target }, 202);
    }

    if (!isSource(source)) {
      return json({ sources: SOURCES }, 404);
    }

    const cached = await env.DATA.get(source);
    if (cached === null) {
      return json({ error: `${source} not yet scraped` }, 503);
    }

    const body =
      url.searchParams.has("pretty")
        ? JSON.stringify(JSON.parse(cached), null, 4)
        : cached;
    return new Response(body, {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "access-control-allow-origin": "*",
        "cache-control": "public, max-age=300",
      },
    });
  },
};

/// One scraper run, stored to KV. On failure the previous value stays — a
/// scrape error never blanks the API.
async function refresh(env: Env, source: Source): Promise<void> {
  try {
    const data = await SCRAPERS[source]();
    if (data === null) throw new Error(`${source} scrape returned null`);
    await env.DATA.put(source, JSON.stringify(data));
  } catch (err) {
    console.error(`scrape ${source} failed:`, err);
  }
}

const SCRAPERS: Record<
  Source,
  () => Promise<unknown[] | { breakthrough: unknown; tasks: unknown[] } | null>
> = {
  events: scrapeEvents,
  raids: scrapeRaidBosses,
  eggs: scrapeEggs,
  research: scrapeResearch,
  "rocket-lineups": scrapeRocketLineups,
  "promo-codes": scrapePromoCodes,
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
