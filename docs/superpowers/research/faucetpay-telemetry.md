# FaucetPay affiliate telemetry audit — Task 1 findings

**Date:** 2026-09-20 · **Account:** `bitcoinfaucetsinfo` · **Ref-ID:** 301005
**Source:** live inspection of https://faucetpay.io/affiliate (Dashboard / Rate & rules / Tracking links tabs).

## VERDICT

- **MEASURABLE: partial — sufficient for a kill/scale gate, NOT for a literal per-user "7-day activation" KPI.**
  - Attribution is **per tracking-link (channel)**, not per individual user with event timestamps.
  - Each link exposes **signups + lifetime-earned** counters → we can compute **earnings-per-signup per channel**, which is a better business metric than the 7-day proxy. Create one named link per traffic source and compare.
- **ECONOMICS: the model is falsified at current scale by 6 years of first-party data.**
  - Default link `r/301005`, live since **2020-05-17**: **45 signups → $0.03 lifetime earned.**
  - ≈ **$0.0007 per referred user, lifetime.** ~$0.005/year total.

## Commission rates (first-party, Rate & rules tab — "live values")

**Platform earnings:** PTC views **50%** · Staking **50%** · Offerwall rewards **15%** · Ad network **10%** · Exchange spreads **1.5%** · Faaslimbo/Faastowers/Hashdice **0.4%** · Crash/Towers **0.3%** · Basilisk slots **0.1%**.
**Casino (share of house edge, not wager):** Dice **40%** · Limbo **30%** · Mines **25%** · Roulette **20%** · Blackjack/Diamonds/Plinko **10%**.

- **No "faucet claim" line exists in the rate table** — despite the hero copy ("earn a share of every faucet claim"). Faucet claims pay negligibly/nothing. Confirms: faucets are a hook, not a revenue source.
- The real earners are **PTC (50%) and Staking (50%)**, then **Offerwall (15%)** and **games (house-edge %)**.

## Program rules (Rate & rules tab)

- Referrals are **linked for life** (persist across device/browser changes).
- Commissions accrue to a **dedicated affiliate balance**; redeem any time — each coin needs ≥ **$0.0001 USD** to move.
- **Self-referrals, duplicate accounts, and incentivized traffic (auto-clickers, bots, paid bid traffic) VOID earnings and may suspend the account.** → (a) never self-refer (protect 301005); (b) **we cannot incentivize traffic** — rules out "earn by clicking" reward loops as an acquisition tactic.
- Game commissions come from the house edge; the user's payout is never reduced.

## Tracking / measurement tooling (Tracking links tab)

- Up to **30 custom named links**, format `faucetpay.io/r/<name>` (6–15 letters, no digits). 1/30 used.
- Table columns: **Name · URL · Signups · Lifetime earned · Created.** → per-channel cohort attribution, natively.
- No per-user rows, no event-type breakdown per referral, no timestamped activity feed visible. Aggregate + per-link only.

## Other

- Footer exposes **API Docs** and **Verify** (payout verification) — usable for the honest on-chain "verify" trust block (spec §9.1) instead of a fake live feed.
- Reporting latency not precisely determined (today's income resets 00:00 UTC; lifetime is cumulative).

## Implication for the Go/No-Go (Task 5)

The measurability question is **answered: yes, cheaply, via named tracking links** (earnings-per-signup per channel). But the more important question — *does the model make money?* — has a hard first-party answer: **6 years + 45 referrals = $0.03.** Even if a dedicated activation hub lifted earnings-per-signup 100×, that's ~$0.07/user — you'd need tens of thousands of *active* referred users for meaningful income, from a low-authority solo site that can't incentivize traffic. This strengthens the panel's "marginal/unviable" read with real data. Decision is Tim's; the evidence points to No-Go for referral-as-primary-income.
