# freecrypto.net — Domain Sale

Decision (2026-08-22): freecrypto.net (premium exact-match, registered 2019, paid ~€2,000)
is **for sale**. Two strategy panels — external (Gemini/GPT-5/Grok) and internal Claude —
concluded the "free crypto" content vertical is unwinnable for a solo operator after three
failed attempts, but the exact-match name still clears a premium as cash. Full rationale in
project memory `freecrypto-freeze-decision`.

## Live listing (Afternic — timgvk account)
| Field | Value | Net after 15% commission |
|---|---|---|
| Buy Now | **$4,900** | ~$4,165 (~€3,820) |
| Minimum Offer | **$2,700** | ~$2,295 (~€2,100) — clears the €2,000 basis |
| Floor Price | none (offers route to seller) | — |
| Lease-to-Own | on, 60 months | — |
| Afternic auto-estimate | $3,416 | — |

- **Commission:** Afternic **Basic = 15%** (reduced from 25% by pointing to Afternic
  nameservers). $15 minimum fee. The $2,700 minimum is grossed up so a minimum-accepted
  offer still nets ≥ €2,000 after commission.
- **Nameservers:** switched Hostinger → `ns1.afternic.com` / `ns2.afternic.com` on 2026-08-22
  (verified no MX/email first). This activates Afternic's on-domain "For Sale" lander and the
  reduced commission. The old Next.js site stops resolving once DNS propagates — intended.
- **Registrar stays Hostinger** (id 31266469, expires 2027-10-24). Domain is unlocked-eligible
  and transferable (60-day post-move lock expired 2026-07-13).
- **Distribution:** listing is also syndicated across the GoDaddy/Afternic reseller network.

## Buyer one-pager / outreach blurb
> Premium exact-match domain **freecrypto.net**. Perfect consumer-facing brand for anything in
> crypto rewards — airdrops, quests, learn-and-earn, faucets, or exchange referral programs.
> Registered 2019 (aged), two-word keyword-in-domain, clean single-owner history, no trademark
> conflict. Buy Now $4,900 or make an offer. Escrow + transfer via Afternic. Serious inquiries only.

A ready-to-send email template is saved as a draft in Tim's Gmail
("Premium domain freecrypto.net — available…"). Duplicate per buyer, swap `[name]`/`[company]`.

## Buyer outreach shortlist
1. Airdrop / quest platforms (Layer3, Galxe-adjacent, TaskOn, airdrop trackers rebranding a front-end)
2. Learn-and-earn products & crypto education brands
3. Exchange growth / referral teams wanting a consumer-friendly rewards front door
4. Crypto affiliate networks & marketing agencies (resell/brand inventory)
5. Faucet / rewards apps seeking a premium keyword upgrade
6. Web3 wallet growth teams

## Seller notes (Tim)
- **Be honest about traffic** — the value is the *name*, not the numbers. Buyers who check
  analytics see single-digit non-brand clicks; inflating it kills deals.
- **`.net` caps the ceiling** vs a `.com`. Realistic clearing zone ~€2,000–3,500; $4,900 is the
  anchor. Don't hold out for five figures.
- **Where offers land:** Afternic "Self-Brokered Leads" + email. Any offer ≥ $2,700 reaches you;
  below that is auto-blocked at the offer form.
- **At sale:** Afternic escrow handles payment; the domain transfers via the Afternic/GoDaddy
  push or an auth code. For an auth-code transfer, unlock + fetch the EPP code from Hostinger
  (`domains_disableDomainLockV1` + `domains_getDomainAuthorizationCodeV1`).
