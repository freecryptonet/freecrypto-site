# freecrypto.net deployment runbook

Hostinger Business plan + Node.js auto-deploy from GitHub (`freecryptonet/freecrypto-site` → `main`).

Initial wiring was done via the Node.js onboarding in hPanel on 2026-05-14. This
file documents what still needs to be done manually after the first deploy and
what to do for subsequent changes.

## 1. After every `git push` to `main`

Hostinger auto-deploys via the GitHub integration. No manual step is required.

Check progress in hPanel → Websites → freecrypto.net → Deployments, or via the
MCP:

```
hosting_listJsDeployments({ domain: "freecrypto.net" })
hosting_showJsDeploymentLogs({ domain: "freecrypto.net", buildUuid: "…" })
```

## 2. One-time MariaDB setup

The Hostinger MCP doesn't cover MySQL user/db creation. Do this once in hPanel:

1. hPanel → Websites → freecrypto.net → **Databases → Beheer (Management)**
2. **Nieuwe database aanmaken** (Create new database):
   - Database name: `u289452321_freecrypto` (hPanel will prefix automatically)
   - Database user: `u289452321_freecrypto`
   - Password: generate a strong one, save it to a password manager
3. **Privileges**: grant ALL on `u289452321_freecrypto.*` to the user
4. Apply the schema:
   ```bash
   # Locally with SSH tunnel
   ~/start-mariadb-tunnel.bat
   # Then in F:\projects\freecrypto:
   npm run migrate
   npm run seed
   ```

   Or remotely via phpMyAdmin (hPanel → Databases → phpMyAdmin), paste the
   contents of `migrations/001_initial_schema.sql` into the SQL tab.

## 3. Environment variables

In hPanel → Websites → freecrypto.net → **Deployments → Environment variables**
(or the "Omgevingsvariabelen" section in the deploy settings panel), add:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | `mysql://u289452321_freecrypto:PASSWORD@127.0.0.1:3306/u289452321_freecrypto` |
| `NEXT_PUBLIC_SITE_URL` | `https://freecrypto.net` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-XXXXXXXXXX` (create at analytics.google.com) |
| `NEXT_PUBLIC_AADS_ZONE_LEADERBOARD` | A-Ads zone ID for 728×90 leaderboard |
| `NEXT_PUBLIC_AADS_ZONE_SIDEBAR` | A-Ads zone ID for 300×600 sidebar |
| `NEXT_PUBLIC_AADS_ZONE_INLINE` | A-Ads zone ID for 300×250 in-listing native |
| `NEXT_PUBLIC_AADS_ZONE_FOOTER` | A-Ads zone ID for 728×90 footer |
| `EVM_RPC_URL_ETHEREUM` | (optional) Alchemy/Ankr Ethereum RPC URL |
| `EVM_RPC_URL_ARBITRUM` | (optional) Alchemy/Ankr Arbitrum RPC URL |
| `EVM_RPC_URL_OPTIMISM` | (optional) Alchemy/Ankr Optimism RPC URL |
| `EVM_RPC_URL_BASE` | (optional) Alchemy/Ankr Base RPC URL |
| `RESEND_API_KEY` | (optional) `re_…` from resend.com |
| `NEWSLETTER_FROM_ADDRESS` | (optional) `"freecrypto.net <hi@freecrypto.net>"` |
| `NEWSLETTER_UNSUBSCRIBE_SECRET` | Generate with `openssl rand -base64 32` |

After adding/changing any env var, trigger a redeploy (hPanel → Deployments →
"Redeploy", or push an empty commit: `git commit --allow-empty -m "ops: env" && git push`).

## 4. SSL certificate

Auto-provisioned by Hostinger after DNS propagates. Check hPanel → Beveiliging
→ **SSL**. If "Force HTTPS" is off, turn it on.

## 5. Cron jobs

Set up in hPanel → Geavanceerd → **Cron Jobs**:

| Schedule | Command | Purpose |
| --- | --- | --- |
| `0 2 * * *` | `cd $HOME/domains/freecrypto.net/public_html && /usr/bin/node node_modules/tsx/dist/cli.mjs scripts/ingest.ts >> $HOME/logs/freecrypto-ingest.log 2>&1` | Daily ingest from DefiLlama + AirdropAlert |
| `0 14 * * 0` | `cd $HOME/domains/freecrypto.net/public_html && /usr/bin/node node_modules/tsx/dist/cli.mjs scripts/digest.ts >> $HOME/logs/freecrypto-digest.log 2>&1` | Weekly newsletter digest, Sundays 14:00 UTC |

> The exact node path on Hostinger Business is typically `/usr/bin/node` or
> bundled with the deploy at `~/domains/freecrypto.net/public_html/.next/...`.
> Adjust the path after the first deploy if cron complains.

## 6. Editing exchange referral codes

`seeds/visit_codes.json` ships with `REPLACE_ME` placeholders. After Tim has
real referral URLs:

1. Edit the file, replacing each `REPLACE_ME` with the real ref param
2. `git commit -am "ops: real exchange refs"` and `git push`
3. SSH to Hostinger and run `npm run seed` once to upsert into `visit_codes` —
   or use phpMyAdmin to update the `target_url` column directly

## 7. Adding new airdrops to the live `/check` lookup

Edit `seeds/known_contracts.json`, push, then `npm run seed` on the server.
Each entry needs:

- `airdrop_meta` block (if the airdrop isn't already in `airdrops` table)
- `contract_addr` (checksummed EVM address)
- `method` — `"claimable-view"` (calls `claimableTokens(address)` /
  `claimable(address)`) or `"erc20-balance"` (calls `balanceOf(address)` at
  `snapshot_block`)

## 8. Rollbacks

Two paths:

- **Quick:** hPanel → Deployments → click an older successful build → "Redeploy"
- **Permanent:** `git revert <bad-commit> && git push` — Hostinger auto-deploys
  the revert
