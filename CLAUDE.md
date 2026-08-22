# freecrypto.net — operational pins

> ## 🛑 FROZEN 2026-08-22 — do NOT build new content/features here
> An 8-model strategy panel (Claude ×5 + Gemini + Grok + GPT-5) reviewed live GSC data and voted **7–1 to MINIMIZE-AND-KEEP-ALIVE**. Verdict: after 13 months and two failed strategies (airdrop → cashback earn-hub), freecrypto produces ~7 non-brand organic clicks/month; commercial terms are buried at pos 48–71 in the most affiliate-saturated SERP online; realistic revenue ceiling is ~$15–25/mo; and it has zero audience/link overlap with the six automotive sites that are the real portfolio. Tim's **attention** is the scarce resource, not hosting.
> **The rule:** NO new store pages, /bonus guides, NL-cluster scaling, or SEO sprints. Leave the site live on autopilot (pm2 `fc`, cron ingest) — carrying cost is ~zero, so it stays up as a free call option. Redirect all freecrypto hours to the automotive cluster (usaparts.eu / vindecoder.site).
> **Kill-trigger:** Revisit GSC ~2026-11-20 (90 days). If non-brand organic clicks are still < ~30/month, SUNSET — 301 the domain to the highest-converting automotive asset (usaparts.eu) per the panel's dissent. Decision record: project memory `freecrypto-freeze-decision`.

- **App lives on VPS, NOT Business plan.** SSH: `ssh -i ~/.ssh/autodtcs_key root@72.62.154.119`. App: `/home/deploy/freecrypto` (deploy user, pm2 name `fc`, port 3003).
- **Deploy:** `git push origin main` triggers `.github/workflows/deploy.yml` (uses `VPS_SSH_KEY` repo secret). Remote is SSH (`git@github.com:freecryptonet/freecrypto-site.git`) — local PAT auth retired 2026-05-16, key `~/.ssh/github_ed25519`.
- **Manual deploy:** `sudo -u deploy bash -c 'exec 9>/home/deploy/freecrypto.deploy.lock; flock -w 600 9 || { echo "another deploy holds the lock"; exit 1; }; cd /home/deploy/freecrypto && git pull && npm ci && npx next build && pm2 reload fc --update-env'` — the `flock` is required: it shares one lock with CI's `deploy.yml` so a manual deploy can't race an in-flight CI build (that collision failed a run on 2026-07-26). Better yet, if CI is what's stuck, re-run the workflow instead of deploying manually.
- **PORT trap:** `next start` does NOT read `PORT` env var. pm2 entrypoint MUST pass `-p 3003`: `pm2 start npx --name fc -- next start -p 3003`.
- **`NEXT_PUBLIC_*` env vars are baked at build time.** Changes need `next build`, not just `pm2 reload`.
- **Editorial seed edits:** `npm run seed:sql` regenerates `migrations/002_seed_data.sql` → import via `mysql freecrypto < ...` over SSH (not phpMyAdmin anymore — that DB is gone).
- **Indexability gate:** `isAirdropIndexable` in `src/lib/seo.ts` is the single source of truth for what gets into the sitemap + escapes noindex. Threshold = 800 chars combined body. Editing the threshold ripples to both sitemap and per-page metadata.
- **Mobile grid pattern:** every grid container MUST start with `grid-cols-1` before `sm:grid-cols-2 ...` — without it CSS Grid `auto` tracks size to AAds intrinsic 728px width and overflow the viewport.
- **Hostinger DNS MCP `DNS_deleteDNSRecordsV1` schema is broken** (no `filters` param). Use Playwright on hPanel DNS-zone editor for record deletions.
