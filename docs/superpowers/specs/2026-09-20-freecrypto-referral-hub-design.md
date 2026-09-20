# freecrypto.net — activation-first "earn crypto" hub

**Date:** 2026-09-20
**Status:** Concept approved after 4 external-panel rounds. Design system validated (v2 scored 7.5–8.0). This revision pivots the *strategy* from a faucet directory to an activation-first earn hub. Ready for implementation planning.
**Supersedes:** the SELL freeze (2026-08-22), `2026-07-25-freecrypto-earn-hub-pivot-design.md`, and the earlier faucet-directory draft of this file.

---

## 1. Context & how the concept evolved

freecrypto.net was frozen to sell (2026-08-22, 3-0 panel). After 30 days with **zero bids**, Tim reversed: keep the domain, build it, optionally sell later as a *complete website*.

The concept was then stress-tested across four panel rounds (Gemini/GPT/Grok via `kentekenfeiten/panel.mjs`). The design was validated, but the panel dismantled the first *strategy* (a faucet directory + Satsback as co-equal heroes) on two grounds:

- **Adverse selection.** A public faucet list attracts claim-only, low-intent, adblock-heavy users who never do the FaucetPay activities that actually pay commission — and never buy through Satsback. *"You optimize the top of funnel on the one behavior that pays no commission."*
- **Geo/audience mismatch.** Faucet traffic skews South Asia / Africa; Satsback merchants attribute in US / West-EU. The two pillars serve different audiences and fight for focus.

A hands-off variant was also considered and rejected: the binding constraint is **distribution/authority** (backlinks, retention), which is inherently hands-on — hands-off + a low-authority exact-match domain ≈ zero traffic ≈ cents. Tim's decision (2026-09-20): **drop the hands-off requirement and build the revenue-oriented, hands-on version.**

## 2. The concept

An **activation-first "earn crypto" hub**: target people with genuine *profit intent* (willing to put in effort), route them to a FaucetPay wallet via our referral link, and steer them toward the activities that actually generate commission.

**Why this beats a faucet directory:** commission comes from referred users' **platform activity**, not from faucet claims. So the site optimizes for the *profitable* cohort and the *profitable* behavior from the first click.

## 3. Monetization model

Primary: **FaucetPay referral** (`https://faucetpay.io/r/301005`, ref-ID 301005).
- Lifetime, paid from FaucetPay's own revenue (not deducted from the user).
- Driven by referred users' activity: **PTC ~50%, offerwall ~25%, surveys, swaps ~1.5% — NOT faucet claims.** (Confirm exact rates in Tim's affiliate dashboard.)
- Therefore the funnel is two-stage: (a) signup via our link, then (b) **activation** toward PTC/offerwall/surveys.

Secondary: **A-Ads** (passive display, already integrated) and **Satsback affiliate** (already built; kept as a secondary section, not a co-hero).

We do **not** run our own faucet. The FaucetPay owner-API is not required; the public **`faucetlist`** endpoint feeds the (small) faucet hook.

## 4. Goals & non-goals

**Goals**
- Attract profit-intent traffic via winnable, revenue-adjacent SEO.
- Convert to FaucetPay signups via our link, then activate toward paying behavior.
- Instrument the funnel so we can see activation and decide scale vs. kill on data.
- Relaunch the live site (currently down — §10).

**Non-goals**
- A faucet directory as the thesis (faucets are a small hook only).
- Satsback as a co-equal pillar.
- Running our own faucet; holding a crypto float.
- Hands-off operation (explicitly dropped — revenue needs hands-on distribution).
- A dark theme / theme toggle.

## 5. Information architecture

Content leads; faucets and shop are supporting. Ranked by contribution to revenue.

| Route | Purpose | Priority |
|---|---|---|
| `/` | Earn-first home: wallet CTA + "ways to earn, ranked by what pays" | core |
| `/earn/[method]` | The money content: `offerwalls`, `paid-to-click`, `surveys`, `swaps` — how each works, honest pay, tips, wallet CTA | **core (new)** |
| `/faucetpay-review` (+ "is FaucetPay legit", "how much can you earn") | Profit-intent informational / trust content | **core (new)** |
| `/faucets`, `/faucets/[coin]` | Faucet hook — small, links up to the paying methods | hook |
| `/shop`, `/shop/[store]`, `/shop/category/[slug]` | Satsback cashback (re-skin, secondary) | secondary (exists) |
| `/guides`, `/guides/[slug]` | Supporting evergreen guides | support (exists) |
| `/visit/[code]` | Referral/affiliate redirector (noindex, click-logged) | reuse |
| about / privacy / terms | Legal + disclosures | update |

Removed: `/airdrops`, `/bonus`, `/calendar`, `/chains`, `/categories`, `/check` (airdrop era) — retire/410, keep redirects only where inbound links exist.

## 6. Architecture & reuse

Stack unchanged: **Next.js 16 + MariaDB (`mysql2`) + Tailwind 3**, pm2 `fc:3003` on VPS 72.62.154.119.

- **Content:** the `/earn/[method]` + FaucetPay-review pages are largely evergreen editorial (Claude-authored), stored/rendered via the existing markdown pipeline (`marked`, `src/lib/markdown.ts`) and seed/DB flow.
- **Faucet hook (small):** cron pull of FaucetPay `faucetlist` → `faucets` table, mirroring `scripts/ingest.ts` / `runIngest.ts`. Read from DB, never live.
- **Referral attribution (reuse):** every wallet/claim/method CTA routes through `/visit/[code]` → `visit_codes.target_url` = `r/301005` (or the specific offerwall/faucet). Cloaked, noindex, click-logged.
- **Instrumentation (new — panel's #1 requirement):** UTM tagging on outbound `/visit` links + click cohorts (source, geo, device, adblock signal) in the existing `visit_clicks` logging. The one KPI that matters: **% of referred signups doing a PTC/offerwall action within 7 days** (measured via FaucetPay affiliate dashboard, correlated to our click cohorts). See §11.
- **SEO gate (reuse):** `src/lib/seo.ts` 800-char threshold generalizes; thin pages stay noindex + out of sitemap.
- **A-Ads (reuse):** placed low, never mid-content.
- **Satsback (reuse):** `stores` table + `scrape:satsback` + `cashback.ts` kept; presentation re-skinned, demoted.

## 7. Funnel & CTA hierarchy

Dominant repeated action: **"Create your free FaucetPay wallet."**
1. **Hero:** primary CTA + microcopy "you need one to get paid"; lead into "ways to earn, ranked."
2. **Ways to earn (centerpiece):** methods ranked by real payoff — offerwalls > PTC > surveys > faucets (tiny) — each linking to its `/earn/[method]` guide. Encodes the honest hierarchy and steers to paying behavior.
3. **First-click interstitial** on any outbound "start earning / claim" link for users without a wallet ("Do you have a FaucetPay wallet yet?") — prevents referral leakage.
4. **Final CTA band** repeats signup.

## 8. SEO strategy

Profit-intent, revenue-adjacent long-tail (winnable for low authority, closer to money than faucet/coin pages):
- **Trust/decision:** "is FaucetPay legit", "FaucetPay review", "is [offerwall] worth it".
- **Method/how-to:** "how to actually earn crypto online", "best crypto offerwalls", "FaucetPay PTC/offerwall strategy", "how much can you earn from surveys/faucets".
- **Secondary:** per-coin faucet pages and "[store] bitcoin cashback" long-tail.
Honesty is the wedge — the incumbents are thin/spammy; genuinely useful, current content is the differentiator. Keep the 800-char indexability gate.

## 9. Trust, compliance & activation (hard requirements)

1. **Verifiable proof or none.** Any "latest payouts" / stats block must be real and verifiable (clickable tx/explorer links or genuine FP figures) or it is removed. No fabricated social proof.
2. **FaucetPay branding permission** — confirm name/logo/figures usage; attribute the source.
3. **Honest copy** — cashback pays in real BTC via Satsback; never claim faucet + Satsback share one wallet. Faucets are shown as tiny; offerwalls/PTC as the real earners. No inflated earnings claims.
4. **Disclosures** — affiliate ribbon near the hero CTA + risk/earnings + country-availability disclaimer.
5. **Activation content (core, not optional)** — the `/earn/[method]` pages exist specifically to move referred users toward PTC/offerwall/surveys. This is the product, not an add-on.

## 10. Relaunch blocker (infra)

Site is **down / listed**: NS moved to `ns1/ns2.afternic.com` (2026-08-22) → Afternic for-sale lander; app unreachable; GSC TXT dropped. Relaunch: (1) withdraw Afternic listing → (2) revert NS to Hostinger → (3) restore A/AAAA → VPS 72.62.154.119 → (4) re-add GSC TXT, re-verify, resubmit sitemap → (5) redeploy `fc`. Registrar stays Hostinger; payout was PayPal.

## 11. KPI, measurement & kill/scale gate

The panel's blind spot across every round: wallet creation ≠ commission. So measurement is a launch requirement, not a nicety.

- **North-star KPI:** % of referred signups completing a PTC/offerwall/survey action within 7 days.
- **Supporting:** signups per 100 sessions; activation by geo/device; A-Ads RPM; Satsback conversions.
- **Unit economics:** track effective revenue per activated user (proxy LTV) vs. cost per acquisition (mostly time; A-Ads is net-positive). 
- **Gate:** after a measurement window (~90 days from relaunch), scale content only if activation is non-trivial and proxy-LTV > CAC × 1.5. Otherwise pivot the content mix or wind down to a passive A-Ads shell. **Log what is dropped; no silent scaling on vanity metrics (traffic/signups).**
- **Critical dependency (panel, unanimous):** the gate is only as good as the data. Before launch, prove we can attribute signup → 7-day PTC/offerwall activity at cohort level (FaucetPay affiliate dashboard fields + our `/visit` UTM/click cohorts). If FP's dashboard doesn't expose per-referral activity granularly enough, the gate is blind and the whole model is unsteerable — resolve this in Phase 0, not after building content.

### 11a. Distribution (the residual risk the panel keeps flagging)
Low-authority SEO brings no day-1 traffic. Phase 1 must include one **hands-on seeding channel** (honest Reddit/X/forum participation + optionally small paid) with strict CAC tracking — SEO is the compounding layer, not the launch engine. Treat distribution as a first-class task, not an afterthought.

## 12. Phasing (reversed from the directory-first draft)

- **Phase 0 — Relaunch infra:** §10. Unblocks everything.
- **Phase 1 — Measured MVP (hands-on):** light design system on `/`; the "ways to earn, ranked" centerpiece; ~5 profit-intent pages (`/earn/offerwalls`, `/earn/paid-to-click`, `/earn/surveys`, `faucetpay-review`, "how much can you earn"); wallet funnel via `/visit` + first-click interstitial; **instrumentation + KPI dashboard**; re-skin `/shop` as secondary; small faucet hook; trust/compliance (§9); remove airdrop IA.
- **Phase 2 — Scale (only past the §11 gate):** expand method/coin/store pages, more activation content, payout-proof automation.

## 13. Open questions / risks

- Exact FaucetPay referral rates (confirm in dashboard).
- Whether we can observe per-referral activity granularly enough to compute the KPI (FP affiliate dashboard is likely the only signal).
- `faucetlist` field coverage (payout/timer or names only).
- FaucetPay branding permission.
- Distribution: SEO is slow for low authority — see §11a. Which single seeding channel do we commit to, and who runs it?
- **Geo-approval match:** profit-intent traffic vs. where offerwalls/PTC actually approve and pay. A mismatch (traffic from regions offerwalls reject) silently kills the activation KPI — check offerwall geo-approval before scaling that content.
- **Legal/AML:** FaucetPay branding permission; who bears liability for payouts/AML given we only refer (no float) — confirm we are purely an affiliate with no custody obligations.
- The homepage payout-proof block ships as **"withdraw & verify on-chain"** (real minimums + explorer links), NOT a fake live-claim feed — per §9.1 and the panel's ship-blocker.

## 14. Out of scope

Faucet directory as thesis; Satsback as co-hero; running our own faucet; dark theme/toggle; NL-first (English-first at launch, NL a later hreflang option); scraping competitor catalogs (facts-only; `faucetlist` API is the source).
