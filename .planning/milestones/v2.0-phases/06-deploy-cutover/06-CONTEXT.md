# Phase 6: Deploy + Cutover - Context

**Gathered:** 2026-07-10
**Status:** Ready for planning
**Mode:** Runbook-driven — this phase requires real actions against Juan's live Hostinger server and DNS that Claude cannot perform directly (no server credentials, no DNS access). The deliverable is a precise, sequenced runbook (scripts + exact manual steps) for Juan to execute himself, not autonomous execution.

<domain>
## Phase Boundary

El sitio corre en producción en Hostinger Cloud/Business como proceso Node persistente, con el cutover ejecutado sin pérdida de contenido ni de rankings respecto al sitio actual.

</domain>

<decisions>
## Implementation Decisions

### Execution model — HARD CONSTRAINT
- Claude does not have SSH credentials, Hostinger panel access, or DNS provider access, and will not ask Juan to paste them into chat (credential handling is out of scope per safety rules).
- Every plan in this phase must produce: (a) any local artifacts/scripts/config Claude CAN produce and verify locally (ecosystem file for PM2, deployment scripts, env var checklist, go-live verification scripts), and (b) an exact, numbered runbook of manual steps for Juan to run himself on the real server/DNS panel, with precise commands to paste and expected output to confirm at each step.
- Claude should NOT mark any task in this phase "done" based on Juan merely saying he ran a command — where possible, ask Juan to paste back command output (not screenshots requiring browser tools) so Claude can verify success from the pasted text.

### Hosting facts (as told by Juan — confirm exact values during execution)
- Plan: Hostinger Cloud tier — Juan did not specify exact tier name (Startup/Professional/Business) when asked; confirm exact plan name/resource limits (RAM, vCPU, Postgres connection limits if using Hostinger-managed Postgres, or confirm still using external Neon) as an early manual step in this phase, since success criteria #2 and #3 explicitly require verifying against the "real contracted tier."
- SSH access: Juan confirmed he already has working SSH access to the Hostinger server.
- DNS: juan-tech.com's DNS is NOT on Vercel (the old site's host) — it's on a separate provider (Cloudflare or a registrar, unconfirmed which). This simplifies cutover (no risk of Vercel undoing DNS changes), but the exact provider/panel needs to be confirmed with Juan during the DNS-cutover plan, since the exact UI steps for changing an A/CNAME record differ by provider.
- Database: this project uses Neon Postgres (external managed, `DATABASE_URI` in `.env`) — NOT a Hostinger-hosted Postgres instance, per this project's existing `.env` and CLAUDE.md's stack docs. Success criterion #3 ("pool de conexiones Postgres... contra el límite real del plan de Hostinger contratado") should be read as: verify Neon's connection limits (relevant to Neon's plan, not Hostinger's) are not exceeded by the app's pool config running on Hostinger's Node process — confirm this interpretation is correct with Juan if genuinely ambiguous, rather than assuming Postgres itself is being self-hosted on Hostinger.

### Old site status
- The old site's Vercel deployment (juan-tech.com on Vercel) is confirmed DEPLOYMENT_DISABLED already (established fact from Phase 4) — it is not currently serving live traffic. This changes the cutover risk profile: there is no "old site still receiving traffic during cutover window" race condition to manage in the traditional sense, but the content-freeze requirement (success criterion #5) still applies to whatever the CURRENT source of truth is (the new Postgres/Payload backend itself, now that migration is done) — freeze means no new content published to the new backend between the final pre-launch check and go-live, not "freeze the old dead site."

### Claude's Discretion
- Exact process manager choice (PM2 vs Hostinger's native Node app supervisor) — research Hostinger's actual Node hosting product during plan-phase research and recommend based on what's actually available on Juan's confirmed plan tier, don't assume.
- Exact structure/count of plans for this phase (e.g., separate plans for: build+deploy script, process supervisor setup, DNS cutover, go-live checklist, content freeze procedure) — use judgment, but keep the DNS cutover step as its own isolated, clearly-flagged-as-high-risk plan given it affects live production traffic and search rankings.

</decisions>

<code_context>
## Existing Code Insights

- `package.json` already has the standalone build pipeline: `build` runs `payload migrate && payload generate:importmap && payload generate:types && next build`, and `postbuild` copies `public/` and `.next/static/` into `.next/standalone/`. `start:standalone` runs `node .next/standalone/server.js`. This matches ROADMAP success criterion #1 exactly — the build script already produces what's needed, this phase needs to get it running persistently on the real server.
- `.env` (local, gitignored) has real `DATABASE_URI` (Neon), `PAYLOAD_SECRET`, Cloudinary creds, `CONTACT_TO_EMAIL`, and now a real `RESEND_API_KEY` (added during Phase 5 closeout) — these same values (or Hostinger-specific equivalents) need to be set as real environment variables on the Hostinger server, not committed anywhere.
- Phase 4's `URL-INVENTORY.json` (`.planning/phases/04-migraci-n-mongo-postgres/URL-INVENTORY.json`) is the frozen 152-URL contract that ROADMAP success criterion #4 requires the production sitemap not to diverge from.
- `src/app/(frontend)/[locale]/` has robots.txt/sitemap.xml/llms.txt routes already built in Phase 2 — go-live verification needs to fetch these from the real production URL, not just confirm they exist in code.
- Redirects plugin (`@payloadcms/plugin-redirects`) already wired since Phase 1/4 — go-live checklist needs to confirm 301s resolve correctly against the live production domain.

</code_context>

<specifics>
## Specific Ideas

- Runbook format: numbered steps, exact commands to copy-paste, and where verification requires reading output, ask Juan to paste the output back rather than assuming success.
- Treat the DNS cutover as the single highest-risk, most-isolated step — its own plan, explicit warnings, and a rollback procedure documented before Juan executes it.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
