/**
 * Turns seeds/stores.raw.json (facts) into seeds/stores.json (facts + our
 * original prose). Feist-safe: classifies facts, writes original commentary,
 * never copies Satsback text.
 *
 * Only slugs in CURATION get published (indexable) copy — the Phase-1 launch
 * set of Bitcoin-native shops + globally-searched brands where "[store]
 * bitcoin cashback" has English search intent. Everything else is written
 * with empty prose so the row exists for internal linking but stays noindex
 * until enriched (the deep NL cluster is Phase 2).
 *
 * Copy varies per store by category, cashback kind, and a deterministic
 * slug hash (so pages differ structurally, not just by noun-swap).
 *
 *   npx tsx scripts/build-store-content.ts
 */
import fs from "node:fs";
import path from "node:path";
import { parseCashback } from "../src/lib/stores/cashback";

interface RawStore { satsback_slug: string; name: string; cashback_text: string | null; logo_url: string | null }
type Geo = "global" | "eu" | "nl" | "other";
interface Curation { category_slug: string; geo_scope: Geo; is_bitcoin_native?: boolean; angle: string }

const CURATION: Record<string, Curation> = {
  // --- Bitcoin-native "Essentials" (bitcoiner audience; converts on exchanges too) ---
  "blockstream-store": { category_slug: "bitcoin-gear", geo_scope: "global", is_bitcoin_native: true, angle: "the official Blockstream shop for Jade hardware wallets and Bitcoin gear" },
  "bitbox": { category_slug: "bitcoin-gear", geo_scope: "global", is_bitcoin_native: true, angle: "the Swiss maker of the BitBox02 hardware wallet" },
  "cryptosteel": { category_slug: "bitcoin-gear", geo_scope: "global", is_bitcoin_native: true, angle: "the maker of indestructible stainless-steel seed-phrase backups" },
  "seedor": { category_slug: "bitcoin-gear", geo_scope: "global", is_bitcoin_native: true, angle: "a maker of steel seed-phrase backup plates built to survive fire and flood" },
  "start9": { category_slug: "bitcoin-gear", geo_scope: "global", is_bitcoin_native: true, angle: "the maker of self-hosted servers that run your own Bitcoin and Lightning node" },
  "konsensus-network": { category_slug: "bitcoin-gear", geo_scope: "global", is_bitcoin_native: true, angle: "a publisher of Bitcoin books and educational material" },
  "shopinbit": { category_slug: "marketplaces", geo_scope: "global", is_bitcoin_native: true, angle: "a marketplace where you can buy almost anything and pay with crypto" },
  "wavespace-bitcoin-visa-debit-card": { category_slug: "bitcoin-gear", geo_scope: "eu", is_bitcoin_native: true, angle: "the wavecard® Bitcoin Visa debit card that lets you spend BTC anywhere" },

  // --- Globally-searched brands ---
  // Fashion
  "adidas-21": { category_slug: "fashion", geo_scope: "global", angle: "the global sportswear brand adidas" },
  "hm-4": { category_slug: "fashion", geo_scope: "global", angle: "the high-street fashion retailer H&M" },
  "shein-19": { category_slug: "fashion", geo_scope: "global", angle: "the fast-fashion marketplace SHEIN" },
  "mango-14": { category_slug: "fashion", geo_scope: "global", angle: "the international fashion brand Mango" },
  "foot-locker": { category_slug: "fashion", geo_scope: "global", angle: "the sneaker and athletic-footwear retailer Foot Locker" },
  "under-armour-23": { category_slug: "fashion", geo_scope: "global", angle: "the performance-sportswear brand Under Armour" },
  "lounge-by-zalando": { category_slug: "fashion", geo_scope: "eu", angle: "Zalando's members-only fashion outlet, Lounge by Zalando" },
  "about-you-13": { category_slug: "fashion", geo_scope: "eu", angle: "the European fashion platform ABOUT YOU" },
  "bergfreunde": { category_slug: "fashion", geo_scope: "eu", angle: "the outdoor and mountaineering gear retailer Bergfreunde" },
  // Travel
  "booking": { category_slug: "travel", geo_scope: "global", angle: "the global hotel and accommodation platform Booking.com" },
  "getyourguide-12": { category_slug: "travel", geo_scope: "global", angle: "the tours and activities marketplace GetYourGuide" },
  "skyscanner-12": { category_slug: "travel", geo_scope: "global", angle: "the flight-comparison site Skyscanner" },
  "trivago": { category_slug: "travel", geo_scope: "global", angle: "the hotel price-comparison site Trivago" },
  "marriott-bonvoy-2": { category_slug: "travel", geo_scope: "global", angle: "the Marriott Bonvoy family of hotels" },
  "turkish-airlines-2": { category_slug: "travel", geo_scope: "global", angle: "the flag carrier Turkish Airlines" },
  "klm-4": { category_slug: "travel", geo_scope: "eu", angle: "the Dutch flag carrier KLM" },
  "tripcom-13": { category_slug: "travel", geo_scope: "global", angle: "the online travel agency Trip.com" },
  // Marketplaces
  "aliexpress": { category_slug: "marketplaces", geo_scope: "global", angle: "the global marketplace for low-cost electronics and just about everything else" },
  "temu": { category_slug: "marketplaces", geo_scope: "global", angle: "the fast-growing budget marketplace Temu" },
  "lego-10": { category_slug: "marketplaces", geo_scope: "global", angle: "the official LEGO store" },
  // Tech & electronics
  "galaxus-4": { category_slug: "tech-electronics", geo_scope: "eu", angle: "the Swiss online department store Galaxus" },
  "sharkninja-10": { category_slug: "tech-electronics", geo_scope: "global", angle: "the maker of Ninja and Shark home appliances" },
  "conrad": { category_slug: "tech-electronics", geo_scope: "eu", angle: "the electronics and components retailer Conrad" },
  "alternate": { category_slug: "tech-electronics", geo_scope: "eu", angle: "the German electronics retailer ALTERNATE" },
  // Services & software
  "nordvpn": { category_slug: "services", geo_scope: "global", angle: "one of the most popular privacy VPNs" },
  "namecheap": { category_slug: "services", geo_scope: "global", angle: "the domain registrar and web host Namecheap" },
  "hostinger-9": { category_slug: "services", geo_scope: "global", angle: "the web-hosting provider Hostinger" },
  "eset": { category_slug: "services", geo_scope: "global", angle: "the antivirus and internet-security vendor ESET" },
  "prime-video-9": { category_slug: "services", geo_scope: "global", angle: "Amazon's on-demand video streaming service" },
  // Health & beauty
  "douglas": { category_slug: "health-beauty", geo_scope: "eu", angle: "the European beauty and cosmetics retailer Douglas" },
  "holland-barrett": { category_slug: "health-beauty", geo_scope: "eu", angle: "the health, wellness, and supplements retailer Holland & Barrett" },
};

/** Deterministic index from a slug — same store always picks the same variant. */
function pick<T>(slug: string, arr: T[]): T {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return arr[h % arr.length];
}

function catWords(cat: string): string {
  return cat.replace(/-/g, " ");
}

/** Does this reward pay actual Bitcoin (vs. a fixed discount code)? */
function paysBitcoin(kind: string): boolean {
  return kind === "percent" || kind === "sats";
}

function rewardPhrase(kind: string, text: string): string {
  if (kind === "percent") return `${text} of your order value back in Bitcoin, paid as sats to a Lightning wallet you control`;
  if (kind === "sats") return `a fixed ${text} in Bitcoin per qualifying order, paid to a Lightning wallet you control`;
  if (kind === "discount") return `a ${text} applied at checkout — an instant saving rather than cashback`;
  return "Bitcoin cashback on qualifying orders";
}

function describe(slug: string, name: string, angle: string, cbText: string, kind: string, cat: string, btc: boolean): string {
  const opener = pick(slug, [
    `${name} is ${angle}.`,
    `${name} — ${angle} — is on Satsback.`,
    `${name}, ${angle}, is one of the stores paying Bitcoin back through Satsback.`,
  ]);
  const rewardLine = `Buy through Satsback and you get ${rewardPhrase(kind, cbText)}.`;
  const secondPara = btc
    ? paysBitcoin(kind)
      ? `For bitcoiners this is close to free stacking: you were going to buy from ${name} anyway, and the reward lands as real Bitcoin instead of a loyalty-scheme IOU.`
      : `For bitcoiners it's a straightforward saving on gear you already want — the code comes off the price at checkout, no funding or waiting involved.`
    : paysBitcoin(kind)
      ? pick(slug, [
          `If ${name} is already on your shopping list, routing the order through Satsback is free money on spending you'd do regardless — this page covers the current rate, how the tracking really works, and whether it's worth the extra step for a ${catWords(cat)} purchase.`,
          `Rather than a coupon or cashback voucher, ${name} shoppers get paid in Bitcoin here. Below: the live rate, the honest truth about tracking reliability, and when it's actually worth using for ${catWords(cat)}.`,
        ])
      : `It's a fixed discount code rather than percentage cashback, so you know the saving up front. Below: the exact offer, how to redeem it through Satsback, and whether it beats hunting for a regular ${catWords(cat)} coupon.`;
  return `## Earn Bitcoin at ${name}\n\n${opener} ${rewardLine}\n\n${secondPara}`;
}

function howItWorks(name: string, cbText: string, kind: string): string {
  if (!paysBitcoin(kind)) {
    return [
      `## How the ${name} offer works`,
      ``,
      `1. Create a free Satsback account (no KYC required) and open the ${name} page on Satsback.`,
      `2. Reveal the offer — ${cbText} — and copy the code or follow through to ${name}.`,
      `3. Paste the code at ${name}'s checkout; the saving is applied to your order immediately.`,
      ``,
      `Because this is a discount code rather than tracked cashback, there's no waiting for the sale to confirm — you see the saving at checkout. Codes can expire or change, so check the current offer on the ${name} page before you buy.`,
    ].join("\n");
  }
  return [
    `## How ${name} Bitcoin cashback works`,
    ``,
    `1. Create a free Satsback account (no KYC required) and add the browser extension.`,
    `2. Open ${name} through Satsback — the extension prompts you to activate rewards with one click.`,
    `3. Shop and check out as normal. Your cashback (${cbText}) shows as *pending* in your Satsback dashboard.`,
    `4. After ${name} confirms the sale, the sats become withdrawable to any Bitcoin Lightning wallet.`,
    ``,
    `**Tracking caveat — worth reading.** Satsback depends on affiliate tracking, and users report roughly two out of three orders track cleanly (it sits around 3.2/5 on the Chrome Web Store). To give yourself the best odds: disable ad-blockers on the ${name} tab, don't run other coupon or cashback extensions at checkout, and make the Satsback tab the last thing you touch before paying. If an order doesn't appear within a few days, Satsback support can chase it with your receipt.`,
  ].join("\n");
}

function worthIt(name: string, kind: string, value: number | null, cat: string, btc: boolean): string {
  let verdict: string;
  if (kind === "percent" && value != null && value >= 3) {
    verdict = `At ${value}%+, ${name} is one of the stronger ${catWords(cat)} rates on Satsback — comfortably worth the two-minute setup.`;
  } else if (kind === "percent" && value != null && value >= 1.5) {
    verdict = `The rate is solid for ${catWords(cat)}; on a normal-sized ${name} order it adds up to a worthwhile chunk of sats.`;
  } else if (kind === "discount") {
    verdict = `This is a flat discount code rather than percentage cashback, so the value is fixed regardless of basket size — best used on a single planned ${name} purchase.`;
  } else if (kind === "sats") {
    verdict = `${name} pays a fixed number of sats per order here, so it's most rewarding on smaller baskets where that flat reward is a bigger share of what you spend.`;
  } else {
    verdict = `The rate is modest, so it's most worth it on larger ${name} orders where even a small percentage becomes meaningful sats.`;
  }
  let note: string;
  if (!paysBitcoin(kind)) {
    note = `One caveat: a discount code is a one-off saving, not recurring Bitcoin cashback, and codes can expire — so confirm the current offer before you count on it. On gear you were going to buy from ${name} anyway, it's still a clean win.`;
  } else if (btc) {
    note = `Because the reward is paid in Bitcoin, you're effectively dollar-cost-averaging into BTC every time you shop — the reason bitcoiners tend to prefer sats-back over fiat cashback in the first place.`;
  } else {
    note = `Two things to weigh: the reward is Bitcoin, so its fiat value moves with BTC — a plus if you're stacking long-term, a variable if you're not. And Satsback rarely stacks with ${name}'s own loyalty program on the same order, so compare the two and use whichever pays more.`;
  }
  return `## Is it worth it?\n\n${verdict}\n\n${note}`;
}

function faqs(name: string, cbText: string, kind: string) {
  if (!paysBitcoin(kind)) {
    return [
      { question: `What's the current ${name} offer on Satsback?`, answer_md: `${cbText}, applied at ${name}'s checkout. Offers can change, so check the ${name} page for the live code before buying.` },
      { question: `Do I need to verify my identity (KYC) to use it?`, answer_md: `No. Satsback is free and requires no KYC — you only need a free account to unlock the ${name} offer.` },
      { question: `Is it Bitcoin cashback or a discount?`, answer_md: `For ${name} this is a discount code — an instant saving at checkout — rather than tracked Bitcoin cashback. Either way it's free to use through Satsback.` },
    ];
  }
  return [
    { question: `How much Bitcoin do I earn at ${name}?`, answer_md: `Currently ${cbText}, credited in sats to your Satsback dashboard once ${name} confirms the order.` },
    { question: `Do I need to verify my identity (KYC) to earn?`, answer_md: `No. Satsback is free and requires no KYC — you only need an account and the browser extension to earn Bitcoin at ${name}.` },
    { question: `When can I withdraw my ${name} cashback?`, answer_md: `Once the order moves from *pending* to *confirmed* (after ${name}'s return window closes), your sats are withdrawable to any Bitcoin Lightning wallet.` },
  ];
}

// ============================================================
// Dutch (nl) cluster — Phase 2. Satsback's inventory is NL-heavy and the
// Dutch "[winkel] bitcoin cashback" SERP is uncontested (Lolli/Fold are
// US-only). These render at /nl/shop.
// ============================================================
const NL_CURATION: Record<string, Curation> = {
  "thuisbezorgdnl": { category_slug: "groceries-food", geo_scope: "nl", angle: "de bekendste maaltijdbezorger van Nederland" },
  "hema": { category_slug: "marketplaces", geo_scope: "nl", angle: "het Nederlandse warenhuis HEMA" },
  "mediamarkt": { category_slug: "tech-electronics", geo_scope: "nl", angle: "de elektronicaketen MediaMarkt" },
  "lidlnl": { category_slug: "groceries-food", geo_scope: "nl", angle: "supermarktketen Lidl" },
  "kpn-2": { category_slug: "services", geo_scope: "nl", angle: "telecomprovider KPN" },
  "odido-2": { category_slug: "services", geo_scope: "nl", angle: "telecomprovider Odido (voorheen T-Mobile)" },
  "plein": { category_slug: "marketplaces", geo_scope: "nl", angle: "het online warenhuis Plein.nl" },
  "anwb-webwinkel": { category_slug: "marketplaces", geo_scope: "nl", angle: "de webwinkel van de ANWB" },
  "greetznl-3": { category_slug: "marketplaces", geo_scope: "nl", angle: "kaarten- en cadeauwinkel Greetz" },
  "brunanl": { category_slug: "marketplaces", geo_scope: "nl", angle: "boeken- en tijdschriftenwinkel Bruna" },
  "douglas": { category_slug: "health-beauty", geo_scope: "nl", angle: "parfumerie- en beautyketen Douglas" },
  "gall-gall-2": { category_slug: "groceries-food", geo_scope: "nl", angle: "slijterijketen Gall & Gall" },
  "scapino": { category_slug: "fashion", geo_scope: "nl", angle: "schoenen- en sportwinkel Scapino" },
  "expert": { category_slug: "tech-electronics", geo_scope: "nl", angle: "elektronicaketen Expert" },
  "koffievoordeel-2": { category_slug: "groceries-food", geo_scope: "nl", angle: "koffie- en theespecialist Koffievoordeel" },
  "simyo": { category_slug: "services", geo_scope: "nl", angle: "de voordelige telecomprovider Simyo" },
  "vidaxlnl": { category_slug: "marketplaces", geo_scope: "nl", angle: "online warenhuis vidaXL voor huis en tuin" },
  "conrad": { category_slug: "tech-electronics", geo_scope: "nl", angle: "elektronica- en techniekwinkel Conrad" },
  "plutosport": { category_slug: "fashion", geo_scope: "nl", angle: "sportwinkel Plutosport" },
  "foot-locker": { category_slug: "fashion", geo_scope: "nl", angle: "sneakerwinkel Foot Locker" },
  "lounge-by-zalando": { category_slug: "fashion", geo_scope: "nl", angle: "de members-only outlet Lounge by Zalando" },
  "booking": { category_slug: "travel", geo_scope: "nl", angle: "hotelboekingsplatform Booking.com" },
  "klm-4": { category_slug: "travel", geo_scope: "nl", angle: "de Nederlandse luchtvaartmaatschappij KLM" },
  "ibood": { category_slug: "tech-electronics", geo_scope: "nl", angle: "dagaanbiedingensite iBOOD" },
  "allekabels": { category_slug: "tech-electronics", geo_scope: "nl", angle: "kabel- en elektronicaspecialist Allekabels" },
  "drogistnl": { category_slug: "health-beauty", geo_scope: "nl", angle: "de online drogist Drogist.nl" },
};

const NL_CAT: Record<string, string> = {
  "groceries-food": "boodschappen", "fashion": "kleding", "tech-electronics": "elektronica",
  "travel": "reis", "marketplaces": "online", "services": "diensten", "health-beauty": "beauty",
  "bitcoin-gear": "bitcoin",
};

function nlCat(slug: string): string {
  return NL_CAT[slug] ?? "online";
}

function nlRate(text: string): string {
  return (text || "")
    .replace(/^up to/i, "tot")
    .replace(/discount code/i, "kortingscode")
    .replace(/(\d+)\s*free month/i, "$1 maand gratis");
}

function nlRewardPhrase(kind: string, text: string): string {
  const t = nlRate(text);
  if (kind === "percent") return `${t} van je bestelbedrag terug in Bitcoin, uitbetaald als sats naar een Lightning-wallet die jij beheert`;
  if (kind === "sats") return `een vast bedrag van ${t} in Bitcoin per bestelling, naar een Lightning-wallet die jij beheert`;
  if (kind === "discount") return `een ${t} bij het afrekenen — een directe korting in plaats van cashback`;
  return "Bitcoin cashback op je bestellingen";
}

function nlDescribe(name: string, angle: string, cbText: string, kind: string, cat: string): string {
  const reward = `Via Satsback krijg je ${nlRewardPhrase(kind, cbText)}.`;
  const second = paysBitcoin(kind)
    ? `Shop je toch al bij ${name}? Dan is dit gratis geld op uitgaven die je sowieso doet. Hieronder de actuele cashback, hoe het tracken écht werkt, en of het de moeite waard is voor een ${nlCat(cat)}-aankoop.`
    : `Het is een vaste kortingscode in plaats van procentuele cashback, dus je weet de korting vooraf. Hieronder de exacte aanbieding, hoe je hem via Satsback verzilvert, en of het beter is dan een gewone ${nlCat(cat)}-kortingscode zoeken.`;
  return `## Bitcoin cashback bij ${name}\n\n${name} is ${angle}. ${reward}\n\n${second}`;
}

function nlHowItWorks(name: string, cbText: string, kind: string): string {
  if (!paysBitcoin(kind)) {
    return [
      `## Zo verzilver je de ${name}-aanbieding`,
      ``,
      `1. Maak een gratis Satsback-account aan (geen KYC nodig) en open de ${name}-pagina op Satsback.`,
      `2. Bekijk de aanbieding — ${nlRate(cbText)} — en kopieer de code of ga door naar ${name}.`,
      `3. Plak de code bij het afrekenen van ${name}; de korting wordt meteen toegepast.`,
      ``,
      `Omdat dit een kortingscode is en geen getrackte cashback, hoef je niet te wachten tot de verkoop bevestigd is — je ziet de korting direct. Codes kunnen verlopen of veranderen, dus check de actuele aanbieding op de ${name}-pagina voor je bestelt.`,
    ].join("\n");
  }
  return [
    `## Zo werkt Bitcoin cashback bij ${name}`,
    ``,
    `1. Maak een gratis Satsback-account aan (geen KYC nodig) en installeer de browser-extensie.`,
    `2. Ga naar ${name} via Satsback — de extensie vraagt je met één klik om de beloning te activeren.`,
    `3. Reken af zoals altijd. Je cashback (${nlRate(cbText)}) verschijnt als *in behandeling* in je Satsback-dashboard.`,
    `4. Zodra ${name} de verkoop bevestigt, kun je de sats opnemen naar elke Bitcoin Lightning-wallet.`,
    ``,
    `**Let op — het tracken.** Satsback werkt via affiliate-tracking, en gebruikers melden dat ongeveer twee op de drie bestellingen goed doorkomen (rond de 3,2/5 in de Chrome Web Store). Zet adblockers uit op de ${name}-tab, gebruik geen andere kortings-extensies bij het afrekenen, en houd de Satsback-tab als laatste open voordat je betaalt. Komt een bestelling na een paar dagen niet binnen, dan kan Satsback-support hem met je bonnetje natrekken.`,
  ].join("\n");
}

function nlWorthIt(name: string, kind: string, value: number | null, cat: string): string {
  let verdict: string;
  if (kind === "percent" && value != null && value >= 3) {
    verdict = `Met ${nlRate(String(value))}%+ hoort ${name} bij de betere ${nlCat(cat)}-tarieven op Satsback — de twee minuten instellen ruimschoots waard.`;
  } else if (kind === "percent" && value != null && value >= 1.5) {
    verdict = `Het tarief is prima voor ${nlCat(cat)}; op een normale bestelling bij ${name} telt het al snel op tot een leuk bedrag aan sats.`;
  } else if (kind === "discount") {
    verdict = `Dit is een vaste kortingscode in plaats van procentuele cashback, dus de waarde ligt vast ongeacht je bestelgrootte — het best voor één geplande aankoop bij ${name}.`;
  } else if (kind === "sats") {
    verdict = `${name} betaalt hier een vast aantal sats per bestelling, dus het levert relatief het meest op bij kleinere bestellingen.`;
  } else {
    verdict = `Het tarief is bescheiden, dus het loont vooral bij grotere bestellingen bij ${name} waar een klein percentage toch flink wat sats wordt.`;
  }
  const note = paysBitcoin(kind)
    ? `Omdat de beloning in Bitcoin wordt uitbetaald, spaar je bij elke aankoop een beetje sats — precies waarom veel mensen sats-back verkiezen boven gewone cashback. De waarde beweegt wel mee met de koers van Bitcoin.`
    : `Let op: een kortingscode is eenmalig en kan verlopen, dus controleer de actuele aanbieding voordat je erop rekent. Op iets dat je toch al bij ${name} zou kopen, is het gewoon meegenomen.`;
  return `## Is het de moeite waard?\n\n${verdict}\n\n${note}`;
}

function nlFaqs(name: string, cbText: string, kind: string) {
  if (!paysBitcoin(kind)) {
    return [
      { question: `Wat is de actuele ${name}-aanbieding op Satsback?`, answer_md: `${nlRate(cbText)}, toe te passen bij het afrekenen van ${name}. Aanbiedingen kunnen wijzigen, dus check de ${name}-pagina voor de actuele code.` },
      { question: `Moet ik me verifiëren (KYC) om het te gebruiken?`, answer_md: `Nee. Satsback is gratis en vraagt geen KYC — je hebt alleen een gratis account nodig om de ${name}-aanbieding te ontgrendelen.` },
      { question: `Is het Bitcoin cashback of een korting?`, answer_md: `Bij ${name} is dit een kortingscode — een directe korting bij het afrekenen — en geen getrackte Bitcoin cashback. Hoe dan ook is het gratis te gebruiken via Satsback.` },
    ];
  }
  return [
    { question: `Hoeveel Bitcoin verdien ik bij ${name}?`, answer_md: `Op dit moment ${nlRate(cbText)}, als sats bijgeschreven in je Satsback-dashboard zodra ${name} de bestelling bevestigt.` },
    { question: `Moet ik me verifiëren (KYC) om te verdienen?`, answer_md: `Nee. Satsback is gratis en vraagt geen KYC — je hebt alleen een account en de browser-extensie nodig om Bitcoin te verdienen bij ${name}.` },
    { question: `Wanneer kan ik mijn ${name}-cashback opnemen?`, answer_md: `Zodra de bestelling van *in behandeling* naar *bevestigd* gaat (na de retourtermijn van ${name}), kun je je sats opnemen naar elke Bitcoin Lightning-wallet.` },
  ];
}

function main() {
  const raw: RawStore[] = JSON.parse(fs.readFileSync(path.join(process.cwd(), "seeds", "stores.raw.json"), "utf8"));
  type Faq = { question: string; answer_md: string };
  const out = raw.map((r) => {
    const cur = CURATION[r.satsback_slug];
    const nlCur = NL_CURATION[r.satsback_slug];
    const cb = parseCashback(r.cashback_text ?? "");
    const btc = !!cur?.is_bitcoin_native;

    const en = cur
      ? {
          description_md: describe(r.satsback_slug, r.name, cur.angle, r.cashback_text ?? "cashback", cb.kind, cur.category_slug, btc),
          how_it_works_md: howItWorks(r.name, r.cashback_text ?? "your cashback", cb.kind),
          worth_it_md: worthIt(r.name, cb.kind, cb.value, cur.category_slug, btc),
          faqs: faqs(r.name, r.cashback_text ?? "the current rate", cb.kind) as Faq[],
        }
      : { description_md: "", how_it_works_md: "", worth_it_md: "", faqs: [] as Faq[] };

    const nl = nlCur
      ? {
          description_nl_md: nlDescribe(r.name, nlCur.angle, r.cashback_text ?? "cashback", cb.kind, nlCur.category_slug),
          how_it_works_nl_md: nlHowItWorks(r.name, r.cashback_text ?? "je cashback", cb.kind),
          worth_it_nl_md: nlWorthIt(r.name, cb.kind, cb.value, nlCur.category_slug),
          faqs_nl: nlFaqs(r.name, r.cashback_text ?? "het huidige tarief", cb.kind) as Faq[],
        }
      : { description_nl_md: "", how_it_works_nl_md: "", worth_it_nl_md: "", faqs_nl: [] as Faq[] };

    return {
      slug: r.satsback_slug, name: r.name, satsback_slug: r.satsback_slug, logo_url: r.logo_url,
      cashback_text: r.cashback_text,
      category_slug: (cur?.category_slug ?? nlCur?.category_slug ?? null) as string | null,
      geo_scope: (cur?.geo_scope ?? nlCur?.geo_scope ?? "global") as Geo,
      is_bitcoin_native: btc,
      ...en,
      ...nl,
    };
  });
  fs.writeFileSync(path.join(process.cwd(), "seeds", "stores.json"), JSON.stringify(out, null, 2));
  const enIdx = out.filter((s) => (s.description_md.length + s.how_it_works_md.length + s.worth_it_md.length) >= 800).length;
  const nlIdx = out.filter((s) => (s.description_nl_md.length + s.how_it_works_nl_md.length + s.worth_it_nl_md.length) >= 800).length;
  console.log(`Wrote ${out.length} stores (${enIdx} EN indexable, ${nlIdx} NL indexable) to seeds/stores.json`);
}

main();
