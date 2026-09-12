/// Raid bosses: port of pages/raids.js. Tier comes from the h2 preceding each
/// .grid; HTMLRewriter streams in document order, so an h2.header sets the
/// current tier and the cards that follow take it.

const TIER_MAP: Record<string, string> = {
  "1": "1-Star Raids",
  "3": "3-Star Raids",
  "5": "5-Star Raids",
  mega: "Mega Raids",
};

type Boss = {
  name: string;
  tier: string;
  canBeShiny: boolean;
  types: { name: string; image: string }[];
  combatPower: {
    normal: { min: number; max: number };
    boosted: { min: number; max: number };
  };
  boostedWeather: { name: string; image: string }[];
  image: string;
};

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

/// jsdom resolved relative img srcs against the page URL; HTMLRewriter hands
/// back the raw attribute, so absolutize to keep the published shape identical.
const absolute = (src: string): string =>
  src.startsWith("/") ? `https://leekduck.com${src}` : src;

export async function scrapeRaidBosses(): Promise<Boss[] | null> {
  const res = await fetch("https://leekduck.com/raid-bosses/", {
    headers: { "user-agent": UA },
  });
  if (!res.ok) return null;

  const bosses: Boss[] = [];
  let tier = "";
  let boss: Boss | null = null;
  let cpNormal = "";
  let cpBoosted = "";
  let tierText = "";

  const flushCP = () => {
    if (!boss) return;
    const parse = (raw: string) => {
      const t = raw.replace(/^CP\s*/i, "").trim();
      const parts = t.split("-").map((s) => parseInt(s.trim(), 10));
      const min = Number.isFinite(parts[0] ?? NaN) ? (parts[0] ?? -1) : -1;
      const max = Number.isFinite(parts[1] ?? NaN) ? (parts[1] ?? min) : min;
      return { min, max };
    };
    boss.combatPower.normal = parse(cpNormal);
    boss.combatPower.boosted = parse(cpBoosted);
    cpNormal = "";
    cpBoosted = "";
  };

  const rewriter = new HTMLRewriter()
    .on("h2.header", {
      element(el) {
        const dataTier = el.getAttribute("data-tier") ?? "";
        if (dataTier) {
          tier = TIER_MAP[dataTier.toLowerCase()] ?? dataTier;
        } else {
          tierText = "";
          el.onEndTag(() => {
            tier = tierText.trim();
            tierText = "";
          });
        }
      },
      text(t) {
        tierText += t.text;
      },
    })
    .on("div.grid div.card", {
      element() {
        if (boss) flushCP();
        boss = {
          name: "",
          tier,
          canBeShiny: false,
          types: [],
          combatPower: {
            normal: { min: -1, max: -1 },
            boosted: { min: -1, max: -1 },
          },
          boostedWeather: [],
          image: "",
        };
        bosses.push(boss);
      },
    })
    .on("div.grid div.card p.name, div.grid div.card .identity .name", {
      text(t) {
        if (boss) boss.name += t.text;
      },
    })
    .on("div.grid div.card div.boss-img img", {
      element(el) {
        if (boss) boss.image = absolute(el.getAttribute("src") ?? "");
      },
    })
    .on("div.grid div.card div.boss-img .shiny-icon", {
      element() {
        if (boss) boss.canBeShiny = true;
      },
    })
    .on(
      "div.grid div.card div.boss-type img, div.grid div.card div.boss-type .type img",
      {
        element(el) {
          if (!boss) return;
          const name = (
            el.getAttribute("title") ??
            el.getAttribute("alt") ??
            ""
          ).toLowerCase();
          if (name)
            boss.types.push({
              name,
              image: absolute(el.getAttribute("src") ?? ""),
            });
        },
      },
    )
    .on("div.grid div.card div.cp-range", {
      text(t) {
        cpNormal += t.text;
      },
    })
    .on(
      "div.grid div.card div.boosted-cp-row .boosted-cp, div.grid div.card div.boosted-cp-row span.boosted-cp",
      {
        text(t) {
          cpBoosted += t.text;
        },
      },
    )
    .on(
      "div.grid div.card div.weather-boosted img, div.grid div.card div.boss-3 img",
      {
        element(el) {
          if (!boss) return;
          let name = (el.getAttribute("alt") ?? "").toLowerCase();
          if (!name) {
            const m = (el.getAttribute("src") ?? "").match(/(\w+)\.png$/);
            name = m ? (m[1] ?? "").toLowerCase() : "";
          }
          if (name)
            boss.boostedWeather.push({
              name,
              image: absolute(el.getAttribute("src") ?? ""),
            });
        },
      },
    );

  await rewriter.transform(res).arrayBuffer();
  flushCP();
  bosses.forEach((b) => (b.name = b.name.trim()));
  return bosses;
}
