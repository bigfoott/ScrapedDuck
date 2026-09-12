/// Events: the only feed-backed scraper. Leek Duck publishes events.json with
/// offset-qualified ISO 8601 timestamps; we pass them through VERBATIM. The old
/// CI scraper normalised them through toISOString() and turned bare wall-clock
/// raid times into the runner's local zone read as UTC — the Mega Finale fault.
/// Do not re-parse, do not re-format, do not "fix" the timezone.

import { fetchJSON } from "../fetch";

const FEED_URL = "https://leekduck.com/feeds/events.json";
const EVENTS_PAGE = "https://leekduck.com/events/";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

type FeedDates = Map<string, { start: string | null; end: string | null }>;

export type EventEntry = {
  eventID: string;
  name: string;
  eventType: string;
  heading: string;
  link: string;
  image: string;
  start: string | null;
  end: string | null;
  extraData: null;
};

export async function scrapeEvents(): Promise<EventEntry[]> {
  const dates = await loadFeedDates();

  const res = await fetch(EVENTS_PAGE, { headers: { "user-agent": UA } });
  if (!res.ok) throw new Error(`events page -> HTTP ${res.status}`);

  // One card per <a class="event-item-link">; children fill it in document
  // order. `current` is null outside any card, so stray matches are dropped.
  let current: Card | null = null;
  const cards: Card[] = [];

  type Card = {
    heading: string;
    name: string;
    image: string;
    classList: string;
    href: string;
  };

  const rewriter = new HTMLRewriter()
    .on("div.events-list a.event-item-link", {
      element(el) {
        current = {
          heading: "",
          name: "",
          image: "",
          classList: "",
          href: el.getAttribute("href") ?? "",
        };
        cards.push(current);
      },
    })
    .on("div.events-list a.event-item-link .event-item-wrapper > p", {
      text(t) {
        if (current) current.heading += t.text;
      },
    })
    .on("div.events-list a.event-item-link h2", {
      text(t) {
        if (current) current.name += t.text;
      },
    })
    .on("div.events-list a.event-item-link .event-img-wrapper > img", {
      element(el) {
        if (current) current.image = fixImage(el.getAttribute("src") ?? "");
      },
    })
    .on("div.events-list a.event-item-link .event-item-wrapper", {
      element(el) {
        if (current) current.classList = el.getAttribute("class") ?? "";
      },
    });

  await rewriter.transform(res).arrayBuffer();

  return cards.flatMap((card) => {
    const slug = card.href.split("/events/")[1]?.replace(/\/$/, "") ?? "";
    if (!slug) return [];
    const d = dates.get(slug);
    return [
      {
        eventID: slug,
        name: card.name.trim(),
        eventType: eventTypeFrom(card.classList),
        heading: card.heading.trim(),
        link: `https://leekduck.com/events/${slug}/`,
        image: card.image,
        // VERBATIM from the feed. See module comment.
        start: d?.start ?? null,
        end: d?.end ?? null,
        extraData: null,
      },
    ];
  });
}

function eventTypeFrom(classList: string): string {
  return classList
    .replace("event-item-wrapper", "")
    .replace("skeleton-loading", "")
    .trim()
    .replace("é", "e");
}

async function loadFeedDates(): Promise<FeedDates> {
  const feed = await fetchJSON<
    { eventID?: string; start?: string; end?: string }[]
  >(FEED_URL);
  const map: FeedDates = new Map();
  for (const e of feed) {
    if (e.eventID) {
      map.set(e.eventID, { start: e.start ?? null, end: e.end ?? null });
    }
  }
  return map;
}

function fixImage(src: string): string {
  return src.includes("cdn-cgi")
    ? `https://cdn.leekduck.com/assets/${src.split("/assets/")[1]}`
    : src;
}
