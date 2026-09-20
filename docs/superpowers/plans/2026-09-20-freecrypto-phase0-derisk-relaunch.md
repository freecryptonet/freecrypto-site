# freecrypto.net Phase 0 — De-risk & Relaunch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax. **NOTE:** Phase 0 is a de-risk + ops runbook, not a TDD code build. Several steps are **`[TIM]`-only** (FaucetPay account access, domain/registrar actions) — Claude has no FaucetPay credentials and must not fabricate results. The TDD code build is Phase 1, gated by the Go/No-Go (Task 5).

**Goal:** Cheaply determine whether the business model is *measurable* (can we attribute per-referral 7-day activation?) and design a fallback if not — then, only on a Go, bring the site back online. No content before this resolves (unanimous panel guidance).

**Architecture:** A zero-risk dashboard audit first, then a written data-access request to FaucetPay, then (only if safe and meaningful) a small clean-identity attribution test, then a fallback measurement design, a Go/No-Go gate, and finally the infra relaunch. Ordered cheapest/safest-first.

**Tech Stack:** FaucetPay affiliate dashboard + support (Tim's account), Hostinger MCP + hPanel (DNS), Playwright (hPanel automation), SSH to VPS 72.62.154.119, Google Search Console.

## Global Constraints

- Referral link: `https://faucetpay.io/r/301005` (ref-ID **301005**) — verbatim.
- **PROTECT ref-ID 301005.** Never create self-referrals (own IP / VPN / device / KYC cluster) under it — FaucetPay anti-fraud bans self-referrers, which would destroy both the test and the live earning channel. Any attribution test uses **clean, unrelated third-party identities only**, after a ToS check. (Panel: this was the plan's biggest blind spot.)
- **No content build in Phase 0.** De-risk + infra only.
- **No fabricated data** (spec §9.1) — findings docs record only what is actually observed.
- **Single-vendor risk:** the whole model depends on FaucetPay. Treat their data access as a dependency to confirm in writing, not assume.
- Deploy model: `git push origin main` triggers CI `deploy.yml`; manual deploy must hold the `flock` (CLAUDE.md). Site currently unreachable (NS on Afternic).
- Decisive KPI: **% of referred signups doing a PTC/offerwall/survey action within 7 days.**

---

### Task 1: FaucetPay affiliate telemetry audit  `[TIM]` (Claude documents)

Zero-risk, ~10 min, done first — Gemini: *log in and verify the dashboard before restoring any infra.*

**Files:**
- Create: `docs/superpowers/research/faucetpay-telemetry.md`

**Interfaces:**
- Produces: a `MEASURABLE: yes|partial|no` verdict + the exact fields the dashboard/API exposes — consumed by every later task.

- [ ] **Step 1 `[TIM]`: Log into FaucetPay → Affiliate / Referral dashboard** (ref-ID 301005). Screenshot each relevant screen.
- [ ] **Step 2: Document what is visible.** Claude fills `faucetpay-telemetry.md` against this checklist:
  - Per-referral rows (individual users) or **aggregate totals only**?
  - **Signup timestamp** per referral? **Event / last-active** timestamp?
  - Commission **split by activity type** (PTC / offerwall / survey / swap) or one lump?
  - Does `r/301005?sub=xyz` (**sub-ID / custom tracking param**) get accepted and surface anywhere in reports?
  - **API / CSV export / webhook** for affiliate data?
  - **Reporting latency** (realtime / 24h / 48h) and history depth.
- [ ] **Step 3: Verdict + fork.** Write at the top: `MEASURABLE: yes | partial | no`.
  - If **no per-user rows and no sub-ID** (panel: ~99% likely) → **skip Task 3 entirely** (don't risk the account); go Task 2 → Task 4 (macro-correlation).
  - If **per-user or sub-ID exists** → Task 3 is worth running (with clean identities).
- [ ] **Step 4: Commit**
```bash
git add docs/superpowers/research/faucetpay-telemetry.md
git commit -m "research: FaucetPay affiliate telemetry audit (measurability verdict)"
```

---

### Task 2: Ask FaucetPay directly (written confirmation)  `[TIM]` (Claude drafts)

Cheaper and safer than any test accounts — get the answer from the source, and cover branding permission in the same message.

**Files:**
- Modify: `docs/superpowers/research/faucetpay-telemetry.md` (append "FaucetPay support response")

**Interfaces:**
- Consumes: Task 1's open questions.
- Produces: written confirmation of (a) affiliate data granularity (per-referral/sub-ID/API/webhook), and (b) permission to use the FaucetPay name/logo/network figures (spec §9.2).

- [ ] **Step 1: Claude drafts a short support/email message** to FaucetPay asking: is affiliate data available at per-referral / sub-ID / event level (PTC/offerwall/survey), via dashboard, CSV, or API/webhook? And: may we use the FaucetPay name/logo and cite network figures on a referral site?
- [ ] **Step 2 `[TIM]`: Send it** via FaucetPay support/contact.
- [ ] **Step 3: Record the response** (verbatim) in the research doc when it arrives.
- [ ] **Step 4: Commit**
```bash
git add docs/superpowers/research/faucetpay-telemetry.md
git commit -m "research: FaucetPay data-access + branding request/response"
```

---

### Task 3: Clean-identity attribution test  `[TIM]` — CONDITIONAL

Run **only if** Task 1 showed per-user/sub-ID attribution is even possible **and** a ToS check confirms it's allowed. **Never self-refer** (see Global Constraints). If skipped, say so in the doc and proceed to Task 4.

**Files:**
- Modify: `docs/superpowers/research/faucetpay-telemetry.md` (append "Attribution test")

- [ ] **Step 1: ToS check.** Claude + Tim confirm FaucetPay's terms permit referring genuine new users this way (they do — that's the affiliate program; the ban risk is *self*-referral/multi-account, which we avoid).
- [ ] **Step 2: Design the test.** Real, unrelated people (not you, not one VPN) sign up via `r/301005` (with distinct `?sub=` if supported), spread across geo/device; each does one PTC + one micro-offerwall action, times recorded. Aim for as many clean identities as realistically available (n=1–3 proves the *pipe* only; more spreads out anti-fraud/latency noise — do not over-claim statistics from a small n).
- [ ] **Step 3 `[TIM]`: Execute & observe (after 24–72h).** Can the dashboard attribute those signups + actions to your referral (ideally the sub-ID)?
- [ ] **Step 4: Record `ATTRIBUTION: works | macro-only | none`** with observed latency.
- [ ] **Step 5: Commit**
```bash
git add docs/superpowers/research/faucetpay-telemetry.md
git commit -m "research: clean-identity attribution test result"
```

---

### Task 4: Fallback measurement design

The default path if attribution is aggregate-only (panel's likely outcome). Closes the "no Plan B" blind spot.

**Files:**
- Create: `docs/superpowers/research/measurement-fallback.md`

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces: the measurement approach Phase 1 will implement, with its confidence level stated honestly.

- [ ] **Step 1: Pick the fallback**, with reasoning:
  - **Sub-ID correlation** (if any sub-ID surfaces): map our `/visit` click cohorts (source/geo/device — already in `visit_clicks`) to referral sub-IDs.
  - **Macro-correlation** (default): correlate our server-side click-cohort volume/timing (we fully control this) against aggregate FP commission deltas by category. State the confidence limits explicitly.
  - **Vendor confirmation**: rely on any event-level access FaucetPay confirms in Task 2.
- [ ] **Step 2: Define the concrete KPI computation** under the chosen fallback (what we log, what we read from FP, how we combine, expected confidence).
- [ ] **Step 3: Note the single-vendor risk** and whether a second referral network is worth trialing later (do not build it now — YAGNI).
- [ ] **Step 4: Commit**
```bash
git add docs/superpowers/research/measurement-fallback.md
git commit -m "research: fallback measurement plan for activation KPI"
```

---

### Task 5: Go / No-Go checkpoint  `[TIM decision]`

**Files:** none (decision recorded in research doc + memory).

- [ ] **Step 1: Present evidence.** Claude summarizes Tasks 1–4: is activation measurable (directly or via fallback) at acceptable confidence?
- [ ] **Step 2 `[TIM]`: Decide.**
  - **Go** → Task 6 (relaunch), then the Phase 1 build plan.
  - **No-Go / rethink** → do NOT build content; the model may be unsteerable — revisit passive-A-Ads-shell or sell-the-package (earlier panel rounds).
- [ ] **Step 3: Record** the decision in `faucetpay-telemetry.md` and memory `freecrypto-freeze-decision.md`.

---

### Task 6: Infra relaunch  `[TIM + Claude]` — only on "Go"

Bring the site back online. Order matters (spec §10).

**Interfaces:**
- Consumes: Task 5 = Go.
- Produces: live https://freecrypto.net serving `fc:3003`, GSC re-verified — the platform Phase 1 builds on.

- [ ] **Step 1 `[TIM]`: Withdraw the Afternic listing** for freecrypto.net (stop offers/broker flow).
- [ ] **Step 2: Revert nameservers** `ns1/ns2.afternic.com` → Hostinger defaults (Hostinger MCP `domains_updateDomainNameserversV1`; fall back to hPanel via Playwright). Verify: `nslookup -type=ns freecrypto.net 8.8.8.8` (allow propagation).
- [ ] **Step 3: Restore DNS** → A (+ AAAA if used) → VPS `72.62.154.119`; re-add the GSC verification DNS-TXT (memory `gsc-freecrypto`). Hostinger DNS MCP; for record *deletion* use hPanel/Playwright (MCP delete is broken, per CLAUDE.md).
- [ ] **Step 4: Verify.** `nslookup -type=a freecrypto.net 8.8.8.8` → VPS IP; `curl -sI https://freecrypto.net` → 200 from the Next.js app (not the Afternic lander). If not, SSH in, confirm pm2 `fc` on 3003, redeploy per CLAUDE.md (flock-guarded).
- [ ] **Step 5: Re-verify Search Console** + resubmit `sitemap.xml` (`sc-domain:freecrypto.net`).
- [ ] **Step 6: Record** completion in memory.

---

## Self-Review

**Spec coverage:** Phase 0 covers spec §10 (relaunch, Task 6), §11 critical dependency (measurability, Tasks 1–4), §9.2 branding permission (Task 2). §11a distribution and all Phase 1 content/design/funnel are intentionally out of scope, gated by Task 5.

**Placeholder scan:** no TBD/TODO. Task 3 is explicitly conditional. `[TIM]` steps flagged because Claude lacks FaucetPay access and must not fabricate.

**Consistency:** `faucetpay-telemetry.md` created in Task 1, appended in Tasks 2/3/5; `measurement-fallback.md` in Task 4. KPI wording matches spec verbatim. Self-referral prohibition stated once in Global Constraints and enforced in Task 3.

**Panel-round-2 fixes applied:** removed self-referral test (ban risk); dashboard-audit-first with an early skip fork; added the written FaucetPay ask (Task 2) before any test; clean-identity-only + ToS check for the conditional test; single-vendor risk + Plan B (Task 4).

## Next

Phase 1 (TDD code build: design system, "ways to earn" homepage, ~5 profit-intent pages, wallet funnel via `/visit` + interstitial, cohort/UTM logging, shop re-skin, faucet hook, trust/compliance) gets its own plan **after** the Task 5 Go/No-Go.
