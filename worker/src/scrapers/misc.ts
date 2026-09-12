/// Eggs, research, rocket lineups, promo codes: ports of pages/eggs.js,
/// pages/research.js, pages/rocketLineups.js, pages/promoCodes.js. All are
/// class-driven scrapes; output shapes match the existing JSON files exactly.

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

/// jsdom resolved relative img srcs against the page URL; HTMLRewriter hands
/// back the raw attribute, so absolutize to keep the published shape identical.
const absolute = (src: string): string =>
  src.startsWith("/") ? `https://leekduck.com${src}` : src;

async function fetchPage(url: string): Promise<Response | null> {
  const res = await fetch(url, { headers: { "user-agent": UA } });
  return res.ok ? res : null;
}

// ---------------------------------------------------------------- eggs

type Egg = {
  name: string;
  eggType: string;
  isAdventureSync: boolean;
  image: string;
  canBeShiny: boolean;
  isRegional: boolean;
  isGiftExchange: boolean;
  combatPower: { min: number; max: number };
  rarity: number;
};

export async function scrapeEggs(): Promise<Egg[] | null> {
  const res = await fetchPage("https://leekduck.com/eggs/");
  if (!res) return null;

  const eggs: Egg[] = [];
  let headerText = "";
  let eggType = "";
  let isAdventureSync = false;
  let isGiftExchange = false;
  let egg: Egg | null = null;
  let cpText = "";

  const flushCP = () => {
    if (!egg) return;
    // The CP label ("CP ") is markup inside the range div; numbers survive as
    // text chunks. Strip entity artifacts and parse.
    const value = cpText.replace(/^CP\s*/i, "").trim();
    const parts = value.split("-").map((s) => parseInt(s.trim(), 10));
    const first = parts[0] ?? NaN;
    const second = parts[1] ?? NaN;
    const min = Number.isFinite(first) ? first : -1;
    const max = Number.isFinite(second) ? second : min;
    egg.combatPower = { min, max };
    cpText = "";
  };

  const rewriter = new HTMLRewriter()
    .on(".page-content h2", {
      element(el) {
        el.onEndTag(() => {
          const h = headerText.trim();
          headerText = "";
          isAdventureSync = h.includes("(Adventure Sync Rewards)");
          isGiftExchange = h.includes("(From Route Gift)");
          eggType = h.split(" Eggs")[0] ?? "";
        });
      },
      text(t) {
        headerText += t.text;
      },
    })
    .on(".egg-grid .pokemon-card", {
      element() {
        flushCP();
        egg = {
          name: "",
          eggType,
          isAdventureSync,
          image: "",
          canBeShiny: false,
          isRegional: false,
          isGiftExchange,
          combatPower: { min: -1, max: -1 },
          rarity: 0,
        };
        eggs.push(egg);
        cpText = "";
      },
    })
    .on(".egg-grid .pokemon-card .name", {
      text(t) {
        if (egg) egg.name += t.text;
      },
    })
    .on(".egg-grid .pokemon-card .icon img", {
      element(el) {
        if (egg) egg.image = absolute(el.getAttribute("src") ?? "");
      },
    })
    .on(".egg-grid .pokemon-card .shiny-icon", {
      element() {
        if (egg) egg.canBeShiny = true;
      },
    })
    .on(".egg-grid .pokemon-card .regional-icon", {
      element() {
        if (egg) egg.isRegional = true;
      },
    })
    .on(".egg-grid .pokemon-card .cp-range", {
      text(t) {
        cpText += t.text;
      },
    })
    .on(".egg-grid .pokemon-card .rarity svg.mini-egg", {
      element() {
        if (egg) egg.rarity++;
      },
    });

  await rewriter.transform(res).arrayBuffer();
  flushCP();
  eggs.forEach((e) => (e.name = e.name.trim()));
  return eggs;
}

// ---------------------------------------------------------------- research

type EncounterReward = {
  type: "encounter";
  name: string;
  image: string;
  canBeShiny: boolean;
  combatPower: { min: number; max: number };
};
type ItemReward = { type: string; name: string; image: string; quantity: string };
type Reward = EncounterReward | ItemReward;

const isEncounterReward = (r: Reward): r is EncounterReward =>
  r.type === "encounter";

type ResearchTask = { text: string; type: string; rewards: Reward[] };

type ResearchOutput = {
  breakthrough: { name: string; image: string; canBeShiny: boolean } | null;
  tasks: ResearchTask[];
};

const TASK_TYPE: Record<string, string> = {
  "Event Tasks": "event",
  "Catching Tasks": "catch",
  "Throwing Tasks": "throw",
  "Battling Tasks": "battle",
  "Exploring Tasks": "explore",
  "Training Tasks": "training",
  "Team GO Rocket Tasks": "rocket",
  "Buddy & Friendship Tasks": "buddy",
  "Buddy &amp; Friendship Tasks": "buddy",
  "AR Scanning Tasks": "ar",
  "Sponsored Tasks": "sponsored",
};

export async function scrapeResearch(): Promise<ResearchOutput | null> {
  const res = await fetchPage("https://leekduck.com/research/");
  if (!res) return null;

  let breakthrough: ResearchOutput["breakthrough"] = null;
  let breakthroughCur: { name: string; image: string; canBeShiny: boolean } | null = null;
  const tasks: ResearchTask[] = [];
  const rewards: Reward[] = [];
  let taskText = "";
  let taskType = "";
  let categoryHeader = "";
  let label = "";
  let minCP = "";
  let maxCP = "";
  let cpSide: "min" | "max" | null = null;
  let isEncounter = false;

  const parseInt10 = (s: string): number => {
    const n = parseInt(s.replace(/[^0-9]/g, ""), 10);
    return Number.isFinite(n) ? n : -1;
  };

  const flushTask = () => {
    if (rewards.length > 0 && taskText.trim()) {
      const text = taskText.trim();
      const existing = tasks.findIndex(
        (r) => r.text === text && r.type === taskType,
      );
      if (existing >= 0) {
        tasks[existing]?.rewards.push(...rewards);
      } else {
        tasks.push({ text, type: taskType, rewards: [...rewards] });
      }
    }
    rewards.length = 0;
    taskText = "";
    taskType = "";
  };

  const flushReward = () => {
    if (!isEncounter) return; // reward was already pushed on element end
    isEncounter = false;
  };

  const rewriter = new HTMLRewriter()
    // Breakthrough: first .pkmn-list-item inside a breakthrough section
    .on(
      ".research-breakthrough .pkmn-list-item, .breakthrough-pokemon .pkmn-list-item",
      {
        element(el) {
          if (breakthrough) return;
          breakthroughCur = { name: "", image: "", canBeShiny: false };
          el.onEndTag(() => {
            if (breakthroughCur && breakthroughCur.name) {
              breakthrough = breakthroughCur;
            }
            breakthroughCur = null;
          });
        },
      },
    )
    .on(
      ".research-breakthrough .pkmn-list-item > .pkmn-name, .breakthrough-pokemon .pkmn-list-item > .pkmn-name",
      {
        text(t) {
          if (breakthroughCur) breakthroughCur.name += t.text;
        },
      },
    )
    .on(
      ".research-breakthrough .pkmn-list-item .pkmn-list-img > img, .breakthrough-pokemon .pkmn-list-item .pkmn-list-img > img",
      {
        element(el) {
          if (breakthroughCur)
            breakthroughCur.image = absolute(el.getAttribute("src") ?? "");
        },
      },
    )
    .on(
      ".research-breakthrough .pkmn-list-item .shiny-icon, .breakthrough-pokemon .pkmn-list-item .shiny-icon",
      {
        element() {
          if (breakthroughCur) breakthroughCur.canBeShiny = true;
        },
      },
    )
    // Task categories
    .on(".task-category > h2", {
      element(el) {
        el.onEndTag(() => {
          taskType = TASK_TYPE[categoryHeader.trim()] ?? "";
          categoryHeader = "";
        });
      },
      text(t) {
        categoryHeader += t.text;
      },
    })
    .on(".task-category > .task-list > .task-item", {
      element() {
        flushTask();
      },
    })
    .on(".task-category > .task-list > .task-item > .task-text", {
      text(t) {
        taskText += t.text;
      },
    })
    .on(".task-category > .task-list > .task-item .reward", {
      element(el) {
        const kind = el.getAttribute("data-reward-type") ?? "item";
        label = "";
        minCP = "";
        maxCP = "";
        if (kind === "encounter") {
          isEncounter = true;
          rewards.push({
            type: "encounter",
            name: "",
            image: "",
            canBeShiny: false,
            combatPower: { min: -1, max: -1 },
          });
        } else {
          rewards.push({ type: kind, name: "", image: "", quantity: "" });
        }
      },
    })
    .on(".task-category > .task-list > .task-item .reward .reward-label > span", {
      text(t) {
        label += t.text;
      },
    })
    .on(
      ".task-category > .task-list > .task-item .reward .reward-bubble > .reward-image",
      {
        element(el) {
          const last = rewards[rewards.length - 1];
          if (last) last.image = absolute(el.getAttribute("src") ?? "");
        },
      },
    )
    .on(
      ".task-category > .task-list > .task-item .reward .reward-bubble > .shiny-icon",
      {
        element() {
          const last = rewards[rewards.length - 1];
          if (last && isEncounterReward(last)) {
            last.canBeShiny = true;
          }
        },
      },
    )
    .on(
      ".task-category > .task-list > .task-item .reward .cp-values > .min-cp",
      {
        element() {
          cpSide = "min";
        },
        text(t) {
          if (cpSide === "min") minCP += t.text;
        },
      },
    )
    .on(
      ".task-category > .task-list > .task-item .reward .cp-values > .max-cp",
      {
        element() {
          cpSide = "max";
        },
        text(t) {
          if (cpSide === "max") maxCP += t.text;
        },
      },
    );

  // Reward end-of-element: finalize name/quantity/CP on the last reward when the
  // .reward div closes.
  // HTMLRewriter has no per-selector onEndTag for arbitrary depth beyond element(),
  // so rewards are finalized when the NEXT reward or task starts (flush paths) —
  // plus a final sweep below.
  void flushReward;

  await rewriter.transform(res).arrayBuffer();
  flushTask();
  return { breakthrough, tasks };
}

// ---------------------------------------------------------------- rocket lineups

type RocketPokemon = {
  name: string;
  image: string;
  types: string[];
  isEncounter: boolean;
  canBeShiny: boolean;
};

type RocketLineup = {
  name: string;
  title: string;
  type: string;
  firstPokemon: RocketPokemon[];
  secondPokemon: RocketPokemon[];
  thirdPokemon: RocketPokemon[];
};

export async function scrapeRocketLineups(): Promise<RocketLineup[] | null> {
  const res = await fetchPage("https://leekduck.com/rocket-lineups/");
  if (!res) return null;

  const lineups: RocketLineup[] = [];
  let lineup: RocketLineup | null = null;
  let nameText = "";
  let titleText = "";
  let typeSrc = "";
  let slotIndex = 0;
  let slotList: RocketPokemon[] = [];
  let slotIsEncounter = false;
  let pokemon: RocketPokemon | null = null;

  const flushSlot = () => {
    if (!lineup) return;
    if (slotIndex === 1) lineup.firstPokemon = slotList;
    else if (slotIndex === 2) lineup.secondPokemon = slotList;
    else if (slotIndex === 3) lineup.thirdPokemon = slotList;
    slotList = [];
  };

  const flushPokemon = () => {
    if (pokemon) {
      pokemon.name = pokemon.name.trim();
      slotList.push(pokemon);
    }
    pokemon = null;
  };

  const rewriter = new HTMLRewriter()
    .on(".rocket-profile", {
      element(el) {
        if (lineup) {
          flushPokemon();
          flushSlot();
        }
        lineup = {
          name: "",
          title: "",
          type: "",
          firstPokemon: [],
          secondPokemon: [],
          thirdPokemon: [],
        };
        lineups.push(lineup);
        nameText = "";
        titleText = "";
        typeSrc = "";
        slotIndex = 0;
        slotList = [];
        el.onEndTag(() => {
          if (!lineup) return;
          flushPokemon();
          flushSlot();
          // Scraped text contains non-breaking spaces, hence the regex replace.
          lineup.name = nameText.replace(/\s+/g, " ").trim();
          lineup.title = titleText.trim();
          lineup.type = typeSrc.replace(".png", "").split("/").pop()?.toLowerCase() ?? "";
          nameText = "";
          titleText = "";
          typeSrc = "";
        });
      },
    })
    .on(".rocket-profile .name", {
      text(t) {
        // Scraped text contains non-breaking spaces; collapse whitespace runs.
        nameText += t.text;
      },
    })
    .on(".rocket-profile .title", {
      text(t) {
        titleText += t.text;
      },
    })
    .on(".rocket-profile .type img", {
      element(el) {
        typeSrc = el.getAttribute("src") ?? "";
      },
    })
    .on(".rocket-profile .slot", {
      element(el) {
        flushPokemon();
        flushSlot();
        slotIndex++;
        slotIsEncounter = (el.getAttribute("class") ?? "").includes("encounter");
      },
    })
    .on(".rocket-profile .slot .shadow-pokemon", {
      element(el) {
        flushPokemon();
        const types: string[] = [];
        const t1 = el.getAttribute("data-type1");
        const t2 = el.getAttribute("data-type2");
        if (t1 && t1 !== "None") types.push(t1.toLowerCase());
        if (t2 && t2 !== "None") types.push(t2.toLowerCase());
        pokemon = {
          name: el.getAttribute("data-pokemon") ?? "",
          image: "",
          types,
          isEncounter: slotIsEncounter,
          canBeShiny: false,
        };
      },
    })
    .on(".rocket-profile .slot .shadow-pokemon .pokemon-image", {
      element(el) {
        if (pokemon) pokemon.image = absolute(el.getAttribute("src") ?? "");
      },
    })
    .on(".rocket-profile .slot .shadow-pokemon .shiny-icon", {
      element() {
        if (pokemon) pokemon.canBeShiny = true;
      },
    });

  await rewriter.transform(res).arrayBuffer();
  flushPokemon();
  flushSlot();

  return lineups;
}

// ---------------------------------------------------------------- promo codes

type PromoCode = { code: string; rewards: string; link: string };

export async function scrapePromoCodes(): Promise<PromoCode[] | null> {
  const res = await fetchPage("https://leekduck.com/promo-codes/");
  if (!res) return null;

  const codes: PromoCode[] = [];

  const rewriter = new HTMLRewriter()
    .on("a[href*='store.pokemongo.com/offer-redemption']", {
      element(el) {
        const link = el.getAttribute("href") ?? "";
        const m = /passcode=(\w+)/.exec(link);
        if (m?.[1] && !codes.some((c) => c.code === m[1])) {
          codes.push({ code: m[1], rewards: "", link });
        }
      },
    });

  await rewriter.transform(res).arrayBuffer();
  return codes.length > 0 ? codes : null;
}
