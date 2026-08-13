# Feature Research — Monetization (v2.1)

**Domain:** Monetization layer for a technical practitioner's personal site (software engineer + technical SEO), bilingual EN/ES, low-to-moderate organic traffic
**Researched:** 2026-08-13
**Confidence:** MEDIUM overall — see the confidence legend below. Every affiliate row was fetched live against the vendor's own page on 2026-08-13.

> Scope note: this file covers ONLY the new monetization surface. Existing features (home, blog, case studies, author page, 4 service landings, 2 geo landings, websites portfolio, contact form, sitemap XSL/HTML, llms.txt) are treated as given and are referenced only as dependencies.

---

## Confidence Legend (read this before using the tables)

The GSD `classify-confidence` seam rates every web-sourced provider (`webfetch`, `websearch`) as **LOW** at the provider level, because web content is not a curated registry. That tier is honest about the *channel*, but it flattens a real distinction that matters a lot for the affiliate table. So each row carries a second tag, the **source tier**:

| Source tier | Meaning | How to treat it |
|-------------|---------|-----------------|
| **PRIMARY** | Fetched from the vendor's own page or legal terms on 2026-08-13, numbers quoted from that page | Safe to act on. Still re-confirm at signup — vendors change rates without notice. |
| **PRIMARY-PARTIAL** | Vendor's own page fetched, but it does not publish the specific number (cookie window, threshold) | Act on what's quoted; treat missing fields as unknown, not as zero. |
| **SECONDARY** | Only aggregator/listicle sources | Do NOT put in a plan as fact. Verify before applying. |
| **ABSENCE-VERIFIED** | Checked vendor's own site/FAQ/partners page and found no program | Reliable enough to exclude from the roadmap. |

Provider tier from the seam (`classify-confidence --provider webfetch --verified`) = LOW. Both tiers are reported so nothing is over-claimed.

---

## 1. The "My Stack / Tools I Use" Page

### What the real examples actually do

Five pages were fetched and read directly, not summarized from advice posts.

| Example | Grouping | Per-item commentary | Affiliate links | Disclosure | Prices | Email capture |
|---------|----------|---------------------|-----------------|------------|--------|---------------|
| **Wes Bos** — `wesbos.com/uses` | 7 named sections (Editor + Terminal, Desktop Apps, Backup Strategy, Recording, Cameras and Lighting, Desk Setup, Other Gear) | Yes — every item has a "why" and often a switching story: *"Visual Studio Code is my current editor which I switched to in September 2017 after years of Sublime Text."* | Yes, mostly Amazon | Yes, at the top, in his own voice: *"Most of these links are amazon affiliate links, so I'll get philthy rich if you click them and buy something."* | Occasionally, as a credibility flex: *"I'm currently using Operator Mono for a font. Yes I paid the $200 for it. Yes I actually like it."* | No |
| **Kent C. Dodds** — `kentcdodds.com/uses` | 11+ categories incl. Services, Tech, Editor, CLIs, Office, Smart Home & EV | Thin but present — one clause each: *"Playwright — I use this for E2E testing"*, *"Cursor — My preferred editor"*, *"Remix/React Router v7 — The best framework to build a web app"* | Yes — Amazon `tag=kentcdodds-20`, plus branded short links `kcd.im/fathom`, `kcd.im/cloudinary` | Yes, early: *"Full disclosure, many links on this site are affiliate links."* | No | No |
| **Aleyda Solis** — `aleydasolis.com/en/search-engine-optimization/seo-tools/` | 4 job-to-be-done sections (Keyword Research, On Page Analysis, Link Building, Tracking & Analysis) | Yes, and framed by *use case*, not by feature list | **No** — plain outbound links | None (she isn't monetizing it) | Free/paid is flagged per tool ("completely free") but no prices | **Yes** — SEOFOMO newsletter block in header ("45,000+ fellow SEOs") and again in the footer |
| **Aleyda Solis** — `/seo-for-web-migrations/` | Topic hub for one problem | Yes | No | n/a | All free, **no email gate** | Yes, newsletter block |
| **uses.tech** directory | 930 listed `/uses` pages | n/a — it's an index | n/a | n/a | n/a | n/a |

### Anatomy of the version that converts vs. the link dump

What separates them, distilled from the above:

1. **Grouped by job, not by vendor.** Aleyda's page groups by *what you're trying to do* (keyword research, on-page, tracking). Wes groups by *context* (editor, recording, desk). Neither groups alphabetically or by "SEO tools / dev tools" — a category label a buyer doesn't think in is a dead category.
2. **A first-person switching story per item.** "I switched to X in 2017 after years of Y" is the single highest-signal sentence pattern on Wes's page. It proves use, gives a reason, and pre-empts "why not the alternative". Kent's one-clause version works too but is measurably thinner.
3. **Honest negatives.** The one thing *none* of the studied pages does well, and the clearest opening for Juan: a "what I stopped using and why" line, or a "don't buy this if…" qualifier per tool. Pages that only praise read as paid.
4. **Prices as a credibility device, not a spec sheet.** Wes mentioning he paid $200 for a font is not price info, it's proof of skin in the game. Publishing a full pricing table is a maintenance trap (see anti-features).
5. **Disclosure in the author's own voice, placed before the first link.** Both monetized examples put it at the top, plainly worded, and neither hedges. Confidence in the disclosure reads as confidence in the recommendations.
6. **A "what I'd pick if I were starting today" block.** Not present on any of the five pages. This is the strongest available differentiator: it converts because it answers the actual reader question ("what should *I* do") rather than the vanity question ("what do *you* use"), and it is the natural home for the highest-value affiliate links.
7. **Screenshots are optional and mostly absent.** Wes has one desk photo; the rest have none. Do not build a screenshot pipeline for v1 — Cloudinary cost and CWV cost with no evidence of return.
8. **The CTA is the practitioner, not the tool.** Aleyda's page CTA is her newsletter. Kent's is "share this page". Neither pushes a hard sell. For Juan the right terminal CTA is the audit/consulting service he already has landing pages for — the stack page is a competence demonstration first and an affiliate page second.

**Anti-pattern observed in the wild:** every affiliate tool roundup is silently ordered by commission rate. Readers in a technical niche detect this instantly. Order by genuine preference and let a lower-paying or zero-paying tool win where it deserves to (Screaming Frog pays nothing and should still be recommended first where it's the right answer — that non-monetized recommendation is what makes the monetized ones believable).

---

## 2. Affiliate Programs — Live-Verified Table

All rows checked **2026-08-13**. "Recurring" is the column that matters most: it's the difference between a one-time $50 and an annuity.

### Verified as OPEN and applicable

| Program | Commission | Recurring? | Cookie | Network | Accepts small sites? | Source tier | Checked URL |
|---------|-----------|------------|--------|---------|---------------------|-------------|-------------|
| **DinoRANK** | 40% of first month, then **10% on every renewal until the user cancels**. Annual plans: 10% at signup + 10% per renewal | **YES — until cancellation** | 15 days | In-house | Yes — explicitly targets consultants/SEOs, no traffic minimum stated | PRIMARY | `dinorank.com/afiliacion/` |
| **Kinsta** | Up to **$500 one-time bounty** by plan **+ 10% lifetime monthly recurring** | **YES — lifetime** | 60 days, last-touch | In-house | Yes, but manual screening. Requires own domain in the dev/business niche **and an affiliate disclosure published on your site**. Auto-approves existing Kinsta customers. Rejects subdomains, thin content, coupon sites | PRIMARY | `kinsta.com/affiliates/` |
| **DigitalOcean** | **10% of the referred user's monthly spend, every month for 12 months** | **YES — 12 months** | Not stated on DO's own page (third parties say 90d) | **CJ / Commission Junction** per DO's own page | Yes — *"Anyone can join"* stated verbatim | PRIMARY-PARTIAL | `digitalocean.com/affiliates` |
| **SE Ranking** | 30% of subscription orders placed through the referral link | Terms do **not** contain a renewal/lifetime clause → treat as **first purchase**. (The "30% recurring lifetime" figure circulating on listicles is unverified) | **120 days**, last-click | In-house | Yes — a free SE Ranking account can join, no traffic minimum. No affiliate links in paid ads | PRIMARY | `seranking.com/affiliate-program.html`, `/legal/affiliate.html` |
| **Semrush** | **$50–$450 per sale** by product + loyalty tier (Basic $50–300, Platinum $80–450) **+ $10 per trial activation** | **NO** — per-sale bounty | **120 days**, last-click | **Impact.com** | Conditional: needs **≥1,000 monthly unique visitors** or 1,000 organic followers, relevant marketing content, verified contact matching the domain | PRIMARY | `semrush.com/lp/affiliate-program/en/` |
| **Hostinger (Affiliate)** | Starts at **40% revshare**, up to 60% on Horizons one-month plans | **NO** — *"No commission is granted for… renewals, or upgrades"* | **30 days**, overwritten by any later affiliate link | In-house | Conditional: needs blog/social/YouTube in IT or business with **≥1,000 traffic**; ~5 business day approval | PRIMARY | `hostinger.com/affiliates`, `/affiliates/faqs` |
| **Hostinger (Referral)** — fallback | 20% of purchase price, up to **$450** first-referral bonus; referred user gets 20% off | No | n/a | In-house | **Yes — no traffic requirement.** Hostinger itself points sub-1,000-traffic sites here. Reward pays only after the referred user keeps the service **45+ days** | PRIMARY | `hostinger.com/referral-program` |
| **Surfer SEO** | Tiered CPA: 75% / 100% / 125% of first **monthly** payment (0–10 / 11–50 / 51+ customers), or 15% / 20% / 25% on **yearly** | Not documented as recurring — commission is *"from user's first payment"* | Not published | **PartnerStack** | *"The competition is stiff"* — selective, requires demonstrated audience alignment | PRIMARY-PARTIAL | `surferseo.com/affiliate-program/` |
| **Amazon Associates** (already active) | Fixed rate card: 4.00% "All Other Categories"; **2.50% PC & PC Components**; 4.00% Fashion/Electronics-adjacent; 3.00% Tools/Home/Headphones; 2.00% Televisions; 4.50% Physical Books | No | 24h (well-known; not restated on the rate card page) | Amazon | Already accepted | PRIMARY | `affiliate-program.amazon.com/help/node/topic/GRXPHT8U84RAYDXZ` |
| **Vercel** | Not published. Legal terms say fees are **one-time unless the Program Guidelines say otherwise**, last-click model, no rate or window disclosed publicly | Stated one-time by default | Not published | **Dub Technologies** | Requires being of majority age, a Vercel account in good standing, tax docs, valid payment method | PRIMARY-PARTIAL | `vercel.com/legal/affiliate-marketing-terms` |

### REJECTED — commonly recommended, not actually usable

This list exists because a stale awesome-list would have put half of these in the roadmap.

| Program | Status | Evidence |
|---------|--------|----------|
| **Ahrefs** | **DEAD.** `ahrefs.com/affiliate` returns **404**. Program closed; Ahrefs now negotiates individual sponsorship deals with a handful of top partners. Tim Soulo's own post gives the reason: ~3% of affiliates drove 90% of leads, plus billing-side technical debt | 404 on vendor URL + founder statement |
| **Screaming Frog** | **NO PROGRAM.** Own FAQ has only a Resellers clause — *"Resellers can purchase an SEO Spider licence online on behalf of a client"* and *"We do not offer discounted rates for resellers."* No commission of any kind | `screamingfrog.co.uk/seo-spider/faq/` — ABSENCE-VERIFIED |
| **Sitebulb** | **NO PUBLIC PROGRAM** findable on their own site (checked homepage nav/footer and site-scoped search). If wanted, it's an email-the-vendor question, not a signup | ABSENCE-VERIFIED |
| **Cloudflare** | **NO PUBLISHER PROGRAM.** `cloudflare.com/partners` lists only PowerUP (Resell / Manage / Distribute / Consult), Technology Alliance, Global System Integrators, Service Providers — all business/agency partnerships. Aggregators claiming "20% recurring, 30-day cookie" contradict each other and the vendor page | ABSENCE-VERIFIED |
| **Neon** | **NOT A GENERAL PROGRAM.** Referral is restricted to accepted open-source projects, paid via GitHub Sponsors. A content site does not qualify | ABSENCE-VERIFIED |
| **Cloudinary** | **NO AFFILIATE.** Their own support states affiliation is not a supported partner type | ABSENCE-VERIFIED |
| **Payload CMS** | **AGENCY PARTNER ONLY**, capped at roughly 30 agencies selected on real Payload work. No commission structure published. (Worth applying to for *lead flow*, which is a different business case — not affiliate revenue) | `payloadcms.com/become-a-partner` |
| **Resend** | No affiliate/referral program found (`resend.com/partners` → 404) | ABSENCE-VERIFIED |
| **Cursor** | **NO OFFICIAL PROGRAM.** Only an Ambassadors program (`cursor.com/ambassadors`, which explicitly prefers you not join other advocacy programs) and a plain user referral link. Community forum threads dated 2026 are still users *asking* for an affiliate program. Directory entries claiming "20% recurring" are community-maintained, not vendor-backed | ABSENCE-VERIFIED |
| **Anthropic / Claude, OpenAI, GitHub Copilot** | **NO AFFILIATE PROGRAMS.** Nothing official found for any of them | ABSENCE-VERIFIED |
| **DataForSEO** | `dataforseo.com/affiliate-program` → 404. No verifiable program | ABSENCE-VERIFIED |

### Numbers you will see quoted that are WRONG

- **"Semrush pays 40% recurring"** and **"Semrush pays 33% recurring for the first year"** — both stale, pre-2021. The live program is a per-sale bounty on Impact. This appears in current 2026-dated listicles, which is exactly why the vendor page is the only acceptable source.
- **"SE Ranking: 30% recurring lifetime"** — repeated widely; SE Ranking's own legal terms contain no renewal clause. Unverified.
- **"Cursor affiliate: 20% recurring"** — community directory entry, no vendor page.
- **"Cloudflare affiliate: 20% recurring / $50–200 per referral"** — two aggregators, two different answers, zero vendor backing.

### The strategic read

Juan's genuinely-used stack maps poorly to affiliate revenue, and that's the most important finding here. **Cloudflare, Cloudinary, Resend, Payload, Neon, Cursor and Claude — the tools he actually builds on — pay nothing.** The programs that do pay are mostly one-off bounties gated behind a 1,000-visitor minimum he may not clear yet.

Three programs are worth applying to first, in this order:

1. **DinoRANK** — recurring until cancellation, no traffic gate, Spanish-market fit, and Juan has a *real* credential here (he ran a DinoRANK workshop in Lima). Highest authenticity-to-payout ratio on the list.
2. **Kinsta** — the only sizeable recurring + big one-time bounty combo that a dev-niche site can qualify for. Note the hard prerequisite: **the affiliate disclosure must already be published on the site before applying.** That makes the disclosure component a *blocker*, not a nice-to-have.
3. **DigitalOcean** — 12 months of 10% revshare and "anyone can join", so it's the lowest-friction acceptance on the list.

Semrush and Hostinger-affiliate are **phase 2, gated on the 1,000-visitor threshold**. Until then, Hostinger's Referral program is the honest substitute (no traffic minimum) and Juan actually uses Hostinger, so it's a genuine recommendation.

---

## 3. Digital Products in This Niche

### What the market actually looks like

Live-checked price points for technical SEO digital products (Gumroad + Notion Marketplace, 2026-08-13):

| Product type | Real live examples | Observed price band | Format |
|--------------|-------------------|---------------------|--------|
| Notion/Sheets audit checklist | "Notion Technical SEO Checklist Template", "DIY SEO Checklist", "Easy SEO Checklist" | **$0–$35** — heavily commoditized, many free | Notion duplicate link |
| Deeper audit template | "Deep Site SEO Audit Template" ($35), "SEO Audit Report Template" | **$29–$49** | Notion / Sheets |
| Roadmap / process product | "SEO Roadmap Notion Template" | **$19–$49** | Notion |

The checklist tier is a race to zero. Notion Marketplace lists several technical SEO audit checklists for free, and Aleyda Solis gives away a full **URL-changes migration checklist as an open Google Sheet with no email gate at all**. A paid generic SEO checklist from Juan would be competing against a free asset from the most-cited technical SEO consultant in the Spanish-speaking world. That's an unwinnable fight and should be named as such.

### What actually fits Juan's proven expertise

The defensible products are the ones a competitor can't clone from a blog post, and where Juan can point at shipped work as proof:

| Product | Why it's defensible for Juan | Realistic band | Effort |
|---------|------------------------------|----------------|--------|
| **Site migration blueprint** (runbook + pre/post validation sheet + rollback plan) | Migration is the highest-stakes, highest-regret technical SEO job, and Juan has done a real platform migration end-to-end (this very site: Mongo→Postgres, Next+Payload rebuild) with the artifacts to prove it | **$49–$99** | MEDIUM |
| **Next.js + Payload SEO starter / reference implementation** | The single most differentiated asset. Almost nobody selling SEO products can ship code; almost nobody shipping Payload starters knows technical SEO. Sitemap XSL, hreflang, canonical across dual segments, JSON-LD builders, llms.txt — he has already solved all of these in production | **$79–$199** | HIGH |
| **AEO/GEO readiness audit template** | Newest, least-commoditized category; he already has the GEO service landing and llms.txt shipped | **$29–$59** | LOW-MEDIUM |
| **Schema/rich-results generator or pack** | Concrete, verifiable output; pairs naturally with the blog | **$19–$49** | MEDIUM |
| Generic technical SEO checklist | — **do not build** — | commoditized to $0 | — |

### What makes them convert

- Proof of use on the seller's own site — Juan can literally say "this site runs it, go view-source". None of the Gumroad sellers can.
- A free tier that is genuinely useful (the checklist) feeding a paid tier that is genuinely bigger (the runbook + the code).
- Bundling with the service: the product is the down-market version of the audit service he already sells. It qualifies leads instead of cannibalizing them.

**Roadmap position:** this whole section is correctly **deferred to v2.2** per the milestone framing. The research supports that deferral — it's the highest-effort, slowest-payback branch, and it depends on a payment platform decision plus an email list that doesn't exist yet.

---

## 4. Email / Lead Magnets

### What works for a technical audience

The competitor evidence is unusually clean here: **Aleyda Solis gives everything away with no email gate and still runs a ~45,000-subscriber newsletter (SEOFOMO)**, with signup blocks in the header and footer of resource pages. The gate is not what builds the list — the recurring value promise is. Her migration resources page hands over a Google Sheet, a SpeakerDeck deck, and a video guide, all ungated, with a newsletter block beside them.

That is the pattern to copy, and it happens to be the one that costs Juan nothing in CWV.

Lead magnets ranked by fit:

1. **The migration validation sheet** (free version) — highest intent, matches a service he sells.
2. **A "technical SEO for Next.js" cheat sheet** — matches his unique angle and the blog's actual readership.
3. **The AEO/GEO readiness checklist** — newest topic, most shareable.
4. Generic "SEO checklist" — lowest fit, highest competition.

### Placement and realistic expectations

Conversion benchmarks in this space come from marketing blogs, not primary research — treat all of these as **SECONDARY, directional only**:

- Inline forms inside long-form content are reported at roughly 15–22% opt-in vs ~4–8% for exit-intent popups, with inline beating sidebar by 2–3x.
- Delayed popups (20–50s) reported as converting better than immediate ones.

Given the numbers are soft and the popup delta is negative anyway, the decision is easy: **inline capture blocks inside relevant posts and at the end of the stack page; no popups at all.** On a site with low-to-moderate traffic, the absolute subscriber delta from a popup is a few people per month, and the cost is a layout-shift risk on a site whose entire stated Core Value is impeccable performance.

Anti-patterns to name explicitly:

- **Any popup/modal or third-party email widget** — CLS/INP risk plus an external script, against a hard project constraint.
- **Gating the good stuff.** Aleyda's ungated approach outperforms; gating a checklist on a low-traffic site converts a small number of readers into a smaller number of subscribers and a lot of bounces.
- **A second email provider.** Resend is already integrated. Adding Kit/Beehiiv/Mailchimp adds a script, a vendor, a GDPR surface and a bill.
- **Newsletter with no publishing cadence.** An empty list decays. If the cadence isn't committed to, capture emails for lead-magnet delivery only and say so on the form.

---

## 5. Content Formats That Monetize

### Current Google reality (verified against Google's own docs, 2026-08-13)

Three facts that change how this is planned, and all three contradict commonly-repeated advice:

1. **The Helpful Content System is RETIRED as a separate system.** Google's own ranking systems guide lists it under retired systems: *"In March 2024, it evolved and became part of our core ranking systems."* There is no separate HCU to optimize for or recover from — it's core ranking now.
2. **The Reviews system is still a live, separate system.** It *"aims to better reward high quality reviews, content that provides insightful analysis and original research, and is written by experts or enthusiasts who know the topic well."* This is the system that governs "X vs Y" and "best tools for Z" content, and its stated criteria — original research, first-hand expertise — are precisely Juan's advantage over affiliate content farms.
3. **Affiliate links are explicitly fine.** Google's spam policies state verbatim: *"It's not a violation of our policies to have such links as long as they are qualified with a `rel="nofollow"` or `rel="sponsored"` attribute value."* The violation is **thin affiliation**: *"publishing content with product affiliate links where the product descriptions and reviews are copied directly from the original merchant without any original content or added value."*

So the rule is simple and mechanical: **every affiliate link gets `rel="sponsored"`, and every affiliate page carries original first-hand material.** The first is an engineering requirement (enforce it in code, not in editorial discipline). The second is an editorial requirement.

Also relevant: **site reputation abuse** applies to third-party content published to exploit a host's rankings. Juan writing his own content is not exposed to this — but it rules out ever selling guest-post slots or hosting sponsored third-party content on the domain.

### Format ranking for this site

| Format | Monetization fit | Google-risk | Fit with existing content |
|--------|-----------------|-------------|---------------------------|
| **Case study with a tooling callout** | HIGH — highest trust, lowest sleaze | Very low | Direct: the `CaseStudies` collection already exists and is the site's strongest asset |
| **Deep tutorial with tool links** (e.g. "hreflang in Next.js + Payload") | HIGH | Very low | Direct: blog + the Next.js/Payload angle already claimed on Home |
| **"X vs Y" comparison** (Sitebulb vs Screaming Frog, DinoRANK vs Semrush) | HIGH — but note the top-fit comparison subjects include tools with **no** program, so write it honestly and monetize only the side that pays | Medium — governed by the Reviews system; needs first-hand testing evidence | New format |
| **"Best tools for Z" roundup** | MEDIUM | **Highest** — this is the format thin-affiliation targets | New format; only worth it with original testing |
| **Stack / uses page** | MEDIUM-HIGH, and it's the durable evergreen | Low | New page |

---

## Feature Landscape

### Table Stakes (required for this to work at all)

| Feature | Why Expected | Complexity | Notes / dependency on existing features |
|---------|--------------|------------|------------------------------------------|
| Affiliate disclosure block, bilingual, rendered above the first affiliate link | FTC/consumer expectation; **and a hard prerequisite of Kinsta's application** | LOW | New Payload block or a field on the page. Must be `localized: true` — v1.5 found 3+ real bugs from non-localized fields. Content must be written, not templated |
| `rel="sponsored noopener"` + `target="_blank"` applied automatically to every affiliate link | Google's stated condition for affiliate links being policy-compliant | LOW | Enforce in the link-rendering component so an editor cannot forget it. Do NOT rely on editorial discipline |
| A `Tools` collection (name, category, URL, affiliate URL, one-line verdict, personal take, free/paid flag, `usedSince`) | Every tool appears on the stack page, in comparisons, and in tutorials — retyping links guarantees drift | LOW-MEDIUM | New Payload collection. Localize the prose fields; keep URLs unlocalized but be deliberate about it |
| Bilingual "Mi Stack / My Stack" page | Core deliverable of the milestone; must exist in both locales like everything else | MEDIUM | Reuses `Pages` + blocks pattern (same decision as the service landings — no new collection). Needs a new `ToolStack` block |
| First-party click tracking via an internal redirect route (`/go/[slug]` → 302) | You cannot decide what to double down on without click data; and third-party trackers are barred by the performance constraint | LOW-MEDIUM | A Next.js route handler + a counter. **Zero client JS, zero CWV cost.** Caveat: check each program's terms on link cloaking — Amazon in particular restricts it, so Amazon links should stay direct |
| Inline email capture block posting to Resend | Only way to build an owned audience; Resend already integrated | MEDIUM | New block + server action + Resend Audiences. No new vendor, no third-party script |
| Cookie/consent handling for affiliate + analytics cookies | ES/EU traffic is an explicit target (Madrid landing) | MEDIUM | Coordinate with the legal research file; affiliate redirect links that set no first-party cookie keep this much simpler |

### Differentiators (where Juan actually wins)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **"What I'd pick if I were starting today"** section on the stack page | Absent from all five studied examples. Answers the reader's real question and is the natural home for the best-paying links, without ordering the main list by commission | LOW | Pure copy. Highest return per unit of effort in this milestone |
| **Honest negatives** — a "what I stopped using and why" line per tool, and at least one prominent zero-commission recommendation | The credibility mechanism that makes the paid recommendations believable to a technical audience. Screaming Frog pays nothing and should still be recommended where it's right | LOW | Copy only. Requires the discipline to leave money on the table on purpose |
| **Lighthouse/CWV scores shown on the stack page itself** | Nobody else's stack page proves the author's competence while recommending tools. Ties monetization to the site's Core Value instead of fighting it | LOW-MEDIUM | The `Websites` collection (v1.9) already stores Lighthouse scores — the pattern and the data shape exist |
| **Spanish-market angle** (DinoRANK, ES-language tooling) | English-language SEO affiliate content is saturated; Spanish technical-SEO tool content is not, and Juan has a real DinoRANK credential from the Lima workshop | LOW | Pairs with the `/seo-tecnico-lima` and `/seo-tecnico-madrid` landings that already exist |
| **Cross-link stack ↔ case studies ↔ services** | Turns the stack page from a leaf into a hub that feeds the consulting funnel, which is worth more per visitor than any affiliate commission on this traffic level | LOW | Reuses the related-content pattern already built for service landings in v1.5 |
| **Next.js + Payload SEO reference implementation** (paid, v2.2) | The genuinely uncopyable product — the intersection of shipping code and technical SEO is nearly empty | HIGH | Deferred. Depends on payment platform decision |

### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Email popup / exit-intent modal | "Popups convert" | CLS/INP risk on a site whose entire Core Value is performance; inline forms are reported to outperform them anyway; on low traffic the absolute gain is a handful of subscribers | Inline capture block inside posts and at the end of the stack page |
| Display ads (AdSense/Ezoic) | Passive income | Destroys CWV, destroys perceived seniority, and at this traffic level pays a rounding error. Directly contradicts the project's Core Value | Affiliate + services + products |
| Third-party affiliate link manager (JS-based cloaker, e.g. a plugin that rewrites links client-side) | "Easier tracking" | External script, layout/INP cost, and a dependency on a vendor for something a route handler does in 20 lines | First-party `/go/[slug]` 302 route |
| Cloaking Amazon links behind the redirect | Consistency with other links | Amazon Associates restricts link cloaking; a violation risks the account he already has | Keep Amazon links direct; cloak only programs that permit it |
| A paid generic "technical SEO checklist" | Easy first product | Aleyda gives an equivalent away free with no gate; several are free on Notion Marketplace. Competing there damages positioning for no revenue | Free checklist as the lead magnet; sell the migration runbook and the code |
| Gating the lead magnet behind a mandatory email | "Build the list" | The most-cited competitor in the niche proves the ungated model builds a bigger list. Gating on low traffic converts few and bounces many | Ungated asset + adjacent newsletter block |
| A second email provider (Kit/Beehiiv/Mailchimp) | Better newsletter features | New vendor, new script, new GDPR surface, new bill — for a list of zero | Resend Audiences/Broadcasts, already in the stack |
| A pricing table per tool on the stack page | "Readers want prices" | SaaS prices change constantly; a stale price is worse than no price and the maintenance never ends | Free/paid flag + a "roughly what tier I'm on" note; link out for current pricing |
| "Best 25 SEO tools" mega-roundup | Ranks for commercial terms | This is the exact shape Google's thin-affiliation policy targets, and Juan can't have first-hand experience with 25 tools | 3-way comparisons of tools he has actually run, with real screenshots/data |
| Selling guest posts / sponsored third-party posts | Fast money | Squarely inside Google's site reputation abuse policy | Own-voice sponsored content only, disclosed, or nothing |
| Ordering the stack page by commission rate | Maximizes revenue per click | Technical readers detect it; it's also the single most-named failure mode of these pages | Order by genuine preference; disclose; include zero-commission picks |

---

## Feature Dependencies

```
Affiliate disclosure block (bilingual)
    └──BLOCKS──> Kinsta affiliate application (they require a published disclosure)
    └──requires──> Payload localized field handling (v1.5 bug pattern)

Tools collection
    └──feeds──> Stack page (ToolStack block)
    └──feeds──> Comparison posts
    └──feeds──> Tutorial inline tool callouts

Stack page
    └──requires──> Tools collection + disclosure block + /go redirect route
    └──requires──> next-intl [locale] routing (exists)
    └──requires──> plugin-seo meta on Pages (exists)
    └──enhances──> Service landings (cross-link into the consulting funnel)

/go/[slug] click tracking
    └──requires──> Tools collection (slug source)
    └──CONFLICTS──> Amazon Associates link-cloaking rules (exempt Amazon)

Email capture block
    └──requires──> Resend Audiences + a real RESEND_API_KEY
    └──BLOCKED BY──> Phase 6 (RESEND_API_KEY is still a placeholder)
    └──requires──> cookie/consent handling for ES/EU traffic

Digital products (v2.2)
    └──requires──> payment platform decision (separate research file)
    └──requires──> email list (from Email capture)

Semrush + Hostinger affiliate acceptance
    └──BLOCKED BY──> 1,000 monthly unique visitors threshold
```

### Dependency Notes

- **Disclosure blocks Kinsta:** Kinsta's stated acceptance criteria include an affiliate disclosure already published on the applicant's site. Build and deploy the disclosure *before* applying, or the application is wasted.
- **Email capture blocks on Phase 6:** `RESEND_API_KEY` is still a placeholder per PROJECT.md. Newsletter capture cannot be verified end-to-end until that's real. Build it behind an env gate (the same pattern already used for Cloudinary) so it degrades cleanly.
- **Click tracking conflicts with Amazon:** exempt Amazon links from the redirect. Model this as a per-tool boolean (`cloakingAllowed`), not a global setting.
- **Traffic threshold gates two programs:** Semrush and Hostinger-affiliate both require ~1,000 monthly visitors. Applying early risks a rejection that may be hard to reverse. Apply to DinoRANK / DigitalOcean / Kinsta first; hold the other two.

---

## MVP Definition

### Launch With (v2.1)

- [ ] **Affiliate disclosure block, bilingual** — legally required, and a hard prerequisite for the Kinsta application
- [ ] **`Tools` collection** — single source of truth; everything else reads from it
- [ ] **Affiliate link component enforcing `rel="sponsored noopener"`** — makes Google-policy compliance structural rather than editorial
- [ ] **`/go/[slug]` 302 redirect + click counter (Amazon exempt)** — first-party, zero client JS, zero CWV cost
- [ ] **Bilingual Stack page** with grouped-by-job sections, per-tool first-person take, honest negatives, at least one zero-commission recommendation, a "what I'd pick starting today" block, and a terminal CTA to the existing services
- [ ] **Applications submitted:** DinoRANK → DigitalOcean → Kinsta (in that order)
- [ ] **Inline email capture block on Resend**, env-gated, no popup

### Add After Validation (v2.1.x)

- [ ] **First comparison post** using tools he genuinely runs — trigger: stack page live and indexed
- [ ] **Free migration validation sheet** as an ungated lead magnet — trigger: email capture verified working
- [ ] **Semrush + Hostinger affiliate applications** — trigger: 1,000 monthly unique visitors confirmed in GSC/analytics
- [ ] **Lighthouse scores on the stack page** — trigger: stack page shipped, reuse the `Websites` data shape

### Future Consideration (v2.2+)

- [ ] **Site migration blueprint** ($49–99) — defer: needs a payment platform and an email list
- [ ] **Next.js + Payload SEO reference implementation** ($79–199) — defer: highest effort, but the only truly uncopyable product
- [ ] **AEO/GEO readiness template** — defer: cheapest of the three products, good v2.2 opener
- [ ] **Surfer / other PartnerStack programs** — defer: selective acceptance, better odds with an established stack page as the application asset

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|-----------|---------------------|----------|
| Affiliate disclosure block (bilingual) | MEDIUM | LOW | **P1** (blocker for Kinsta) |
| `rel="sponsored"` enforcement in the link component | HIGH (policy safety) | LOW | **P1** |
| `Tools` collection | MEDIUM | LOW-MEDIUM | **P1** |
| Stack page + `ToolStack` block | HIGH | MEDIUM | **P1** |
| "What I'd pick starting today" block | HIGH | LOW | **P1** |
| Honest negatives / zero-commission picks | HIGH (trust) | LOW | **P1** |
| `/go/[slug]` click tracking | MEDIUM (decision data) | LOW-MEDIUM | **P1** |
| Program applications (DinoRANK, DigitalOcean, Kinsta) | HIGH (the revenue itself) | LOW (admin work) | **P1** |
| Inline email capture on Resend | HIGH | MEDIUM | **P2** (env-gated on Phase 6) |
| Cross-links stack ↔ case studies ↔ services | HIGH (funnel value > affiliate value at this traffic) | LOW | **P2** |
| Lighthouse scores on stack page | MEDIUM | LOW-MEDIUM | **P2** |
| Comparison post format | HIGH | MEDIUM | **P2** |
| Free migration sheet lead magnet | HIGH | LOW-MEDIUM | **P2** |
| Migration blueprint (paid) | HIGH | MEDIUM | **P3** (v2.2) |
| Next.js + Payload SEO starter (paid) | HIGH | HIGH | **P3** (v2.2) |
| Display ads | LOW | LOW | **never** |
| Popups | LOW | LOW | **never** |

---

## Competitor Feature Analysis

| Feature | Aleyda Solis | Wes Bos / Kent C. Dodds | Juan's approach |
|---------|--------------|-------------------------|-----------------|
| Tools page | Yes, grouped by job, **not monetized** | Yes, grouped by context, **Amazon + SaaS affiliate** | Grouped by job, monetized, with honest negatives — takes Aleyda's structure and Wes's monetization |
| Disclosure | n/a | Top of page, plain, in the author's own voice | Same placement, bilingual, rendered from a block so it can't be forgotten |
| Per-item commentary | Use-case framing | First-person switching stories | Both: use-case grouping + switching story + a "don't buy this if" |
| Lead magnets | Ungated Sheets/decks/videos | None | Ungated, following the model that demonstrably built a 45k list |
| Email capture | Header + footer newsletter blocks, no popup | None | Inline blocks, no popup |
| Paid products | Free tooling + consultancy | Courses (their main business) | Deferred to v2.2; services stay the primary revenue |
| Proof of technical competence on the page itself | No | No | **Lighthouse scores + view-source** — the open gap |

---

## Sources

Fetched live on **2026-08-13**. Provider tier per the `classify-confidence` seam = LOW (web channel); source tier per row is noted above.

**Vendor primary sources (PRIMARY / PRIMARY-PARTIAL):**
- `https://www.semrush.com/lp/affiliate-program/en/`
- `https://www.hostinger.com/affiliates` and `https://www.hostinger.com/affiliates/faqs`
- `https://www.hostinger.com/referral-program`
- `https://seranking.com/affiliate-program.html` and `https://seranking.com/legal/affiliate.html`
- `https://dinorank.com/afiliacion/`
- `https://surferseo.com/affiliate-program/`
- `https://kinsta.com/affiliates/`
- `https://www.digitalocean.com/affiliates`
- `https://vercel.com/legal/affiliate-marketing-terms`
- `https://affiliate-program.amazon.com/help/node/topic/GRXPHT8U84RAYDXZ` (rate card)

**Absence verification:**
- `https://ahrefs.com/affiliate` → **404**; Tim Soulo LinkedIn post on why the program was closed
- `https://www.screamingfrog.co.uk/seo-spider/faq/` (Resellers clause only)
- `https://www.cloudflare.com/partners/` (PowerUP / Technology Alliance / GSI / Service Providers only)
- `https://sitebulb.com/` + site-scoped search (no program found)
- `https://resend.com/partners` → **404**
- `https://dataforseo.com/affiliate-program` → **404**
- `https://payloadcms.com/become-a-partner` (agency program, ~30 agencies, no commission published)
- `https://cursor.com/ambassadors`, Cursor community forum threads (2026, still requesting an affiliate program)
- Cloudinary support community (affiliation not a supported partner type); Neon partner program (GitHub Sponsors, OSS projects only)

**Google documentation:**
- `https://developers.google.com/search/docs/essentials/spam-policies` (thin affiliation; `rel="nofollow"`/`rel="sponsored"` qualification; site reputation abuse)
- `https://developers.google.com/search/docs/appearance/ranking-systems-guide` (Helpful Content System retired → core, March 2024; Reviews system still active)

**Stack-page examples read directly:**
- `https://wesbos.com/uses`
- `https://kentcdodds.com/uses`
- `https://www.aleydasolis.com/en/search-engine-optimization/seo-tools/`
- `https://www.aleydasolis.com/en/search-engine-optimization/seo-for-web-migrations/`
- `https://uses.tech/` (930 listed pages)

**Digital product price points:**
- Notion Marketplace technical SEO audit/checklist templates (several free)
- Gumroad: "Deep Site SEO Audit Template" ($35), "SEO Roadmap Notion Template", "Notion Technical SEO Checklist Template", "DIY SEO Checklist"

**SECONDARY (directional only, not to be planned against as fact):**
- Lead-magnet and popup-vs-inline conversion benchmarks (marketing blogs, 2026-dated, no primary methodology published)
- Aggregator claims contradicted by vendor pages: Semrush "33%/40% recurring", SE Ranking "recurring lifetime", Cursor "20% recurring", Cloudflare affiliate terms, DigitalOcean network (Impact vs CJ)

---
*Feature research for: monetization of a technical practitioner's personal site*
*Researched: 2026-08-13*
*Supersedes: `.planning/research/FEATURES.md.v1.9` (Websites portfolio research, preserved)*
