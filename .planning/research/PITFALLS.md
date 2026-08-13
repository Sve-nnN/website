# Pitfalls Research

**Domain:** Adding affiliate monetization, digital products and email capture to an existing, already-ranking technical-SEO personal site (Payload 3.85 + Next 15 + Postgres/Neon, bilingual EN/ES, self-hosted Node)
**Milestone:** v2.1 Monetización del Sitio
**Researched:** 2026-08-13
**Confidence:** HIGH on Google policy, FTC, Amazon and EU VAT (verbatim from primary sources, dates recorded below). MEDIUM on performance weights (modeled + secondary sources). MEDIUM on revenue math (parametric model built on Amazon's published rate card, not on measured site data). LOW / EXPLICITLY UNVERIFIED on Peruvian domestic tax treatment — flagged, not asserted.

---

## Phase Vocabulary Used In This Document

v2.1 continues phase numbering from Phase 43 (v2.0, closed). The roadmapper may renumber; the names are what matters.

| Label | Suggested # | Scope |
|-------|-------------|-------|
| **BASELINE** | 44 | Regression baseline capture (Lighthouse/CWV + H1/JSON-LD + canonical/hreflang snapshot) before anything is touched — same pattern as Phase 32 in v1.7 |
| **DECIDE** | 45 | Research synthesis → ROI-vs-effort decision on what actually gets built in v2.1 vs deferred to v2.2 |
| **LEGAL** | 46 | Disclosure component, policy pages (affiliate disclosure, updated privacy), consent decision |
| **LINK** | 47 | Affiliate link primitive: Payload schema, `rel` handling, routing/redirect decision, robots/middleware wiring |
| **STACK-PAGE** | 48 | Bilingual "Mi Stack / Herramientas que uso" content |
| **EMAIL** | 49 | Email capture on Resend (Audiences, double opt-in, lead magnet delivery) |
| **GATE** | 50 | Zero-regression close gate (Lighthouse/CWV + SEO parity vs BASELINE) |
| **v2.2-PRODUCTS** | deferred | Digital products, checkout, webhooks |

---

## Critical Pitfalls

### Pitfall 1: Unqualified affiliate links → "Unnatural links from your site" manual action

**What goes wrong:**
Affiliate links ship without `rel="sponsored"` (or at minimum `rel="nofollow"`). Google's link-spam policy treats unqualified compensated outbound links as participation in a link scheme. The enforcement surface is a **manual action**, not an algorithmic nudge: Google Search Console's manual actions list includes **"Unnatural links from your site"**, whose recommended fix is literally "identify paid or policy-violating links and either remove them or add `rel="nofollow"` or similar attributes." A manual action is site-wide-capable and requires a reconsideration request to clear.

For a site whose entire value proposition is "I am a technical SEO expert," a manual action for unqualified affiliate links is not a ranking problem. It is a credibility problem that no amount of recovery undoes.

**Why it happens:**
Three reasons, all live in 2026:
1. Popular affiliate tutorials still say "use nofollow" and stop there, because they predate the September 2019 introduction of `sponsored`.
2. Developers wire `rel` as a per-link editorial field in the CMS, so it can be left blank by whoever fills the content.
3. Rich-text links (Lexical) get `rel` from the editor's link node, which by default does **not** emit `sponsored` — so an affiliate link dropped inline in a blog post silently ships unqualified even when the dedicated affiliate component does it right.

**How to avoid:**
- Make `rel` **non-editable and structural**. The affiliate link component emits `rel="sponsored nofollow noopener"` unconditionally from code. Never a CMS field, never a default that can be overridden to empty. This is the same architectural instinct that produced `src/lib/service-slugs.ts` — one pure helper, one source of truth, applied at render time.
- Google's current wording (Search Central, *Qualify your outbound links to Google*, **last updated 2025-12-10 UTC**): `rel="sponsored"` is the **preferred** marking for paid links; `rel="nofollow"` "is still an acceptable way to flag them." Emitting both (`sponsored nofollow`) is safe and belt-and-braces; there is no penalty for redundancy.
- Cover the **rich-text path** explicitly. Either (a) forbid raw affiliate URLs in Lexical and require a custom inline block that renders the affiliate component, or (b) add a serializer-level rule: any outbound href matching the affiliate-domain allowlist gets `rel="sponsored nofollow"` injected at render time regardless of what Lexical stored.
- Add a build-time or test-time assertion: crawl the rendered HTML of the stack page and every post, assert zero anchors to affiliate domains lacking `sponsored` in `rel`.

**Warning signs:**
- `rel` appears as a text field or select in any Payload config.
- The stack page renders correctly but a blog post's inline "I use this keyboard" link has `rel=""` or no `rel` at all.
- Search Console → Security & Manual Actions shows anything at all.

**Phase to address:** **LINK** (structural emission + allowlist serializer rule) with a verification assertion in **GATE**.

---

### Pitfall 2: Thin affiliation — the actual Google policy that applies here (and the one that does *not*)

**What goes wrong:**
A "Mi Stack" page ships as a grid of product cards with a one-line blurb and a buy button per item, plus manufacturer-copied specs. Google's spam policies (**last updated 2026-05-15 UTC**) define this exactly:

> "Thin affiliation is the practice of publishing content with product affiliate links where the product descriptions and reviews are copied directly from the original merchant without any original content or added value."

Thin content is a **manual action type** ("Thin content with little or no added value") and, since the Helpful Content system was folded into the core ranking systems in the March 2024 core update, it is also an ongoing algorithmic signal that evaluates the **site as a whole**, not just the offending URLs. That last part is the existential bit: a thin commercial section can drag site-wide quality signals, which is how a services page that has nothing to do with affiliate content ends up losing rankings.

Google's own escape hatch is stated in the same policy:

> "Not every site that participates in an affiliate program is a thin affiliate. Good affiliate sites add value by offering meaningful content or features."

**Correcting the popular advice (and the LLM transcript that inspired this milestone):**
The transcript recommended **generic banner placement** and building out product listings. Both are the thin-affiliation pattern almost verbatim. Banner ads and product grids with merchant-supplied copy are the *lowest*-value, *highest*-risk form of affiliate content and, for a 2.5%-commission category (see Pitfall 8), the worst return per unit of SEO risk. The transcript also recommended **Amazon FBA**, which is not a website feature at all — it is a separate inventory business with capital requirements and has no bearing on this site. PROJECT.md already scopes FBA out; this research confirms that is the correct call and it should not be reopened as a "quick win."

**How to avoid:**
- **Owned-experience gating.** Rule: nothing goes on the stack page that Juan does not personally use in real work. Each entry must carry at least one piece of information that cannot be copied from the merchant — what he uses it *for*, what it replaced, what broke, a config snippet, a measurement. That is first-hand experience (the first E in E-E-A-T) and it is also the only thing that makes the page rank.
- **Depth over breadth.** 12 tools with 150 words of genuine reasoning each beats 60 tools with 20 words each, on both SEO risk and conversion.
- **No merchant copy, ever.** Do not pull descriptions from the PA-API into visible body copy (see Pitfall 9 for the separate reason you may need PA-API for prices).
- **No price/spec tables sourced from feeds** as the primary content. Those are the exact "copied directly from the original merchant" artifacts.

**Warning signs:**
- Any stack entry whose body could be pasted onto a competitor's site unchanged.
- A "compare" table that is just spec columns.
- Word-count-per-entry under ~100 words in either locale.
- The ES version is a machine translation of the EN version (see Pitfall 5).

**Phase to address:** **STACK-PAGE** — this is a content-quality gate, not a code gate. Make "owned-experience evidence per entry" an acceptance criterion in the phase plan, not a nice-to-have.

---

### Pitfall 3: Assuming "site reputation abuse" applies here — it does not, and confusing it wastes mitigation effort

**What goes wrong:**
Teams read the 2024 site-reputation-abuse headlines ("Google is killing affiliate content!") and either (a) panic and don't build, or (b) build the wrong mitigations — moving affiliate content to a subdomain, or adding `noindex` to it — which actively destroys the thing that would have made it work.

**What the policy actually says** (Google Search spam policies, last updated 2026-05-15 UTC):

> "Site reputation abuse is a tactic where third-party content is published on a host site mainly because of that host's already-established ranking signals."

The load-bearing word is **third-party**. This policy targets a newspaper renting out `/coupons/` to an affiliate agency, not an individual publishing his own reviews on his own site. Timeline for the record: announced 2024-03-05 with the March 2024 core update; **manual-action enforcement began 2024-05-07**; expanded 2024-11-19 to clarify that first-party involvement or oversight does **not** exempt third-party content; documentation updated 2025-01-21. It is enforced by **manual action only**.

Juan writing about tools Juan uses is first-party content on his own domain. Site reputation abuse is not the risk. **Thin affiliation and scaled content abuse are** (Pitfall 2).

**Where it *would* become a risk:** if v2.2 or later ever accepts guest posts, sponsored placements written by a vendor, or a "partner" section. Then the policy is squarely in play, and Google's own remediation guidance explicitly warns against moving such content to a subdomain or subdirectory because "this may appear to circumvent spam policies."

**How to avoid:**
- Do not build subdomain isolation. Do not `noindex` the stack page. Both are cargo-cult mitigations for a policy that doesn't apply, and both guarantee the content never earns anything.
- Do put the commercial content in a clean subfolder for *reporting* reasons — `/stack/` (EN) and `/stack/` or `/herramientas/` (ES) — so Search Console and analytics can segment it and you can measure whether it helps or hurts. Subfolder segmentation is a **measurement** tool here, not a **protection** tool. State that distinction in the phase plan so nobody mistakes it for isolation.
- Write the rule down now: **no third-party-authored content on this domain, ever.** If a sponsorship opportunity arrives later, it goes in a clearly-labeled, `noindex`ed page or nowhere.

**Warning signs:** anyone proposing `affiliate.juan-tech.com`, or a plan that includes `noindex` on revenue pages.

**Phase to address:** **DECIDE** (kill the wrong mitigations before they get roadmapped) and **STACK-PAGE** (URL structure).

---

### Pitfall 4: E-E-A-T and topical dilution of the services cluster — the real, measurable risk

**What goes wrong:**
This is the pitfall that is actually specific to *this* site. juan-tech.com has spent v1.4 and v1.5 building a tight topical cluster: `/services` + 4 service landings + 2 geo landings + case studies + author page with `knowsAbout`/`hasCredential` JSON-LD. Google's topical understanding of the domain is currently narrow and coherent: *technical SEO consulting, Next.js/Payload engineering, Lima/Madrid*.

Bolting on a commercial section introduces three concrete dilution mechanisms:

1. **Internal link equity redistribution.** If the stack page is linked from the global nav and footer, it inherits sitewide link equity that currently flows to `/services`. On a small site (dozens of pages, not thousands), this is a materially large fraction.
2. **Topical drift in the site-level quality assessment.** Adding a commercially-motivated content type broadens what the site is "about." If the new content is weak, the site-level signal that the core ranking systems apply drags the strong pages down with it.
3. **Entity confusion in the author/Person graph.** If the stack page is not attributed to the same `Person` entity with the same `knowsAbout`, it reads as a bolt-on rather than an extension of the expert's practice.

**Why it happens:**
Because "add it to the nav so people find it" is the default, and because the affiliate content is written in a different voice/depth than the services content — usually thinner, because it feels like a side project.

**How to avoid:**
- **Do not put the stack page in the primary nav in v2.1.** Link it from: the author page (it belongs to the person), relevant blog posts (contextual), and the footer. Reassess after 90 days of Search Console data. This preserves the `/services` equity flow while still making the page discoverable.
- **Make the stack page an extension of the expertise argument, not a departure from it.** Frame it as "the toolchain behind the case studies you just read" — link each tool entry to the case study or service where it was actually used. That converts a dilution risk into an internal-linking *reinforcement* of the services cluster. This is the single highest-leverage design decision in the milestone.
- **Same `Person` attribution.** The stack page carries `author`/`Person` JSON-LD pointing at the same entity as the author page, and the tools mentioned should be consistent with `knowsAbout`.
- **Same content bar.** The stack page's per-entry depth must be comparable to the service landings. If it reads thinner, it is thinner.
- **Measure it.** BASELINE must snapshot Search Console impressions/clicks/average position for the 4 service landings, 2 geo landings and Home, in both locales. GATE re-checks at close, and a 30/60/90-day re-check is a documented follow-up. Without a baseline you cannot distinguish "the affiliate section hurt us" from "seasonality."

**Warning signs:**
- Stack page appears in primary nav in the phase plan.
- Service landing impressions decline in the 30 days after launch while non-service pages hold steady.
- The stack page outranks a service landing for a service-intent query (cannibalization).

**Phase to address:** **BASELINE** (Search Console snapshot is a hard prerequisite — extend the existing Lighthouse/CWV baseline pattern to include SC data), **STACK-PAGE** (internal linking design), **GATE** + a documented 90-day follow-up.

---

### Pitfall 5: Bilingual affiliate pages become the site's first genuine duplicate-content problem

**What goes wrong:**
The stack page is the first content type on this site where the EN and ES versions have a strong pull toward being identical: product names don't translate, specs don't translate, and the temptation to machine-translate a 12-item list is enormous. Two failure modes stack on top of each other:

1. **Thin + duplicate.** An ES page that is a translation of an EN page that was already thin (Pitfall 2) is doubly weak, and now you have two weak URLs instead of one.
2. **Hreflang/canonical breakage on a new route shape.** This project has a documented history here — v1.5 Phase 23 had to fix canonical/hreflang across four URL combinations for the service pages because the URL *segment* differs by locale (`/servicios` vs `/services`), not just the prefix. `next-intl` is configured with `localePrefix: 'as-needed'`, `defaultLocale: 'es'`, `localeDetection: false`. If the stack page also gets a locale-differing segment (`/herramientas` vs `/stack`), it reproduces exactly the four-combination problem, and this time the pages carry affiliate links, so the duplicate is *commercial* duplicate — the category Google is least forgiving about.

**Why it happens:**
Because the four-combination hreflang problem is invisible in dev (both URLs render fine) and only surfaces in Search Console weeks later as "Duplicate, Google chose a different canonical."

**How to avoid:**
- **Pick a single URL segment for both locales** unless there is a genuine keyword reason not to. `/stack/` works in Spanish (it is the word Spanish-speaking devs actually use). This sidesteps the whole four-combination class of bug that v1.5 had to solve. If ES keyword research insists on `/herramientas/`, then the phase must explicitly reuse the `buildServiceHref`/`SERVICE_SLUGS` pattern from `src/lib/service-slugs.ts` — one pure helper, imported by nav, footer, sitemap and canonical/hreflang generation, no hand-typed strings anywhere.
- **The ES version is written, not translated.** Different examples, different framing, ES-market tool alternatives where they exist, ES affiliate URLs where the program has a Spanish storefront (see Pitfall 10). If the two locales have the same word count and the same paragraph structure, it is a translation and it will be treated as one.
- **Different affiliate destinations per locale is a feature, not a bug** — amazon.es for ES visitors, amazon.com for EN — which by itself makes the pages genuinely non-duplicate. But it is also the exact shape of the localized-field trap (Pitfall 10).
- **Verify all URL combinations with `curl`** before closing the phase, the same way v1.4/v1.5 did (10 combinations curl-verified in Phase 19). Assert: self-referencing canonical per locale, reciprocal `hreflang` pairs, `x-default`.

**Warning signs:**
- ES and EN stack pages have identical word counts.
- Search Console → Pages → "Duplicate without user-selected canonical" grows after launch.
- `hreflang` on `/es/stack` points at `/stack` but `/stack` does not point back.

**Phase to address:** **STACK-PAGE**, with the curl verification matrix as an explicit acceptance criterion; **GATE** re-verifies.

---

### Pitfall 6: The `/go/*` redirect route collides with this project's middleware — and silently taxes every click

**What goes wrong:**
This is the single most stack-specific pitfall in the milestone, and it is invisible until you look at the actual middleware.

`src/middleware.ts` has matcher `['/', '/((?!api|admin|_next|_vercel|.*\\..*).*)']`. A route at `/go/[slug]` **matches**. That means every affiliate click, before it redirects, triggers:

1. `next-intl`'s `createIntlMiddleware` processing on a route that is not a locale route. With `localePrefix: 'as-needed'` and `defaultLocale: 'es'`, `/go/xyz` gets treated as an ES-locale path and internally rewritten. If the route handler lives outside the `[locale]` segment, this rewrite can 404 the route outright, or produce a second indexable URL at `/en/go/xyz`.
2. **A same-origin `fetch` to `/api/redirects-lookup`**, which does a Payload Local API query against the `redirects` collection — a full Postgres round-trip, on the **direct/unpooled** Neon connection string (`src/payload.config.ts` uses the UNPOOLED string deliberately, because the pooled `-pooler` string breaks `payload migrate` prepared statements).

So the naive implementation makes every affiliate click cost: an HTTP loopback + a DB query + intl processing + then the actual redirect. On a low-traffic site that is survivable; what is not survivable is that bots hitting `/go/` links multiply that cost, and it holds a scarce direct Neon connection open per click.

**Why it happens:**
Because middleware matchers are negative-lookahead regexes that nobody re-reads when adding a route, and because the loopback-fetch-to-route-handler workaround (documented at length in the middleware file itself, from Phase 02-03) is a non-obvious piece of this codebase's history.

**How to avoid:**
- **Add `go/` to the middleware matcher's negative lookahead:** `'/((?!api|admin|go/|_next|_vercel|.*\\..*).*)'`. **The trailing slash is load-bearing** — the lookahead is anchored right after the leading `/`, so it matches on prefix, not segment; a bare `go` would exclude `/gobierno`, `/golang-para-seo` and any future top-level slug starting with those two letters, bypassing both next-intl and the redirects lookup. Same trap `isPrefixableHref` guards against in `src/i18n/navigation.ts`. Decide deliberately what a bare `/go` (no slug) should do, since `go/` stops matching it. `api`/`admin` carry the same latent prefix bug (`/apitools`, `/administracion`) — follow-up, not Phase 46 scope. Verify by asserting the redirects-lookup route is not hit on a `/go/` request (log or test).
- **Add `Disallow: /go/` to `src/app/robots.ts`.** It currently disallows only `/admin` and `/api`. This is the standard, Google-endorsed handling for affiliate redirect endpoints: it stops crawl waste at the source.
- **Do not also add `noindex` to the route.** `robots.txt` blocks crawling, which means Google never sees an `X-Robots-Tag: noindex`. Pick one. The correct pair is: `Disallow: /go/` in robots.txt **plus** `rel="sponsored nofollow"` on every anchor pointing at it, so Google has no reason to discover or follow the URLs in the first place. Belt-and-braces that actually compose.
- **Use a 302, not a 301 or 308.** These are not permanent moves; affiliate destinations change, and a cached 301 in a user's browser will outlive the affiliate relationship. Set `Cache-Control: private, no-store` on the redirect response.
- **Keep the route out of the sitemap.** `src/lib/sitemap-data.ts` builds the sitemap from collections; make sure an `AffiliateLinks` collection cannot leak into it.

**Warning signs:**
- `/es/go/xyz` or `/en/go/xyz` resolves to anything.
- Server logs show `/api/redirects-lookup` traffic proportional to affiliate clicks.
- Search Console → Crawl stats shows `/go/` URLs being fetched.
- Any `/go/` URL appears in the `site:` index.

**Phase to address:** **LINK**. Middleware matcher + robots.ts are one-line changes but must be in the phase's success criteria, not incidental.

---

### Pitfall 7: Cloaked `/go/*` redirects for **Amazon** links specifically violate the Operating Agreement

**What goes wrong:**
"Always cloak your affiliate links behind `/go/`" is near-universal affiliate advice. For Amazon it is **wrong**, and it is one of the more commonly enforced violations. Amazon Associates **Program Policies (last updated: April 14, 2026)** state, verbatim:

> "You will not cloak, hide, spoof, or otherwise obscure the URL of your Site containing Special Links (including by use of Redirecting Links) or the user agent of the application in which Program Content is displayed or used such that we cannot reasonably determine the site or application from which a customer clicks through such Special Link to an Amazon Site."

and, separately:

> "You will not use a link shortening service, button, hyperlink or other ad placement in a manner that makes it unclear that you are linking to an Amazon Site."

Read carefully, the first clause prohibits obscuring the **referring site** — Amazon must be able to determine where the click came from. A same-domain 302 that preserves the `Referer` header technically survives this. But two very common implementation details break it: a `referrerPolicy="no-referrer"` on the anchor, or a meta-refresh / JS redirect instead of an HTTP 302, either of which strips the referrer and puts you squarely inside the prohibition. The second clause is about user-facing clarity: a bare "Comprar" button pointing at `/go/teclado` with no indication that the destination is Amazon is exactly what it describes.

The downside is asymmetric: account termination plus forfeiture of accrued commissions, and Amazon does not reinstate rejected Associate IDs.

**How to avoid — the opinionated recommendation:**
- **Amazon links: link directly to the Amazon URL with the `tag=` parameter.** No `/go/` indirection. `rel="sponsored nofollow noopener"`, `target="_blank"`, anchor text or adjacent label that names Amazon explicitly ("Ver en Amazon" / "View on Amazon"), and **no `referrerPolicy` override** — let the default send the referrer.
- **Non-Amazon programs: `/go/` is fine** and is genuinely useful (link rotation, one place to change a URL, resilience to program changes). Build the primitive so the destination can be either a direct URL or a `/go/` slug, decided per program.
- **Get click data without cloaking.** Amazon supports up to 100 **tracking IDs** per account. Use a distinct tracking ID per page (`juantech-stack-20`, `juantech-blog-20`) and read the breakdown in Amazon's own reports. This gives you attribution with zero code, zero DB writes, zero CWV cost, and zero policy risk. This is strictly better than building click logging (see Pitfall 13).
- **Never put an Amazon link behind a shortener** (bit.ly, amzn.to via third parties, or your own).
- **Email:** Amazon permits Special Links in email only if solicited — "provided, that such communications are solicited (i.e., opted into by the receiving customer)." Double opt-in (Pitfall 16) satisfies this; a scraped or single-opt-in list does not.

**Warning signs:**
- The affiliate link component applies `/go/` uniformly to all programs including Amazon.
- Any `referrerPolicy` attribute on affiliate anchors.
- A CTA that says "Buy now" without naming the destination store.

**Phase to address:** **LINK**. Make "per-program routing strategy (direct vs `/go/`)" an explicit field/decision in the schema, defaulted to *direct* for Amazon.

---

### Pitfall 8: Amazon's 180-day rule and the commission math nobody checks first

**What goes wrong:**
Two separate Amazon realities, both routinely misremembered:

1. **The 180-day rule.** Per Amazon Associates help: *"Once you've applied, you have 180 days to refer a sale through one of your Associates links"* and *"Your application can be withdrawn if there were not enough qualifying sales for 180 days after your application was submitted."* Amazon states it cannot restore a rejected account or Associates ID. PROJECT.md says Juan's Associates account is "already active" — **that phrasing does not distinguish between "approved after qualifying sales" and "applied and inside the 180-day window."** If it is the latter, the clock is running right now and the milestone has a hard deadline nobody has written down. This must be checked before roadmapping, not after.
   - Separately, and often confused with the above: the Operating Agreement's dormancy clause is *"If at any time there has been no substantial activity on your account for at least 3 years, then we will have the right, with 7 days' written notice to withhold the accrued commission income."* That is three years and it is about withholding accrued commission, not closure. Do not conflate the two.

2. **The commission rate on this site's actual product categories is terrible.** Amazon's published standard rate card:

   | Category | Rate |
   |---|---|
   | PC, PC Components, DVD & Blu-Ray | **2.50%** |
   | Televisions, Digital Video Games | 2.00% |
   | Physical Video Games & Consoles | 1.00% |
   | Physical Books, Kitchen, Automotive | 4.50% |
   | Amazon devices (Echo, Fire, Kindle, Ring) | 4.00% |
   | All other categories | 4.00% |

   A developer stack page is overwhelmingly "PC, PC Components" — keyboards, monitors, docks, SSDs, laptops. That is **2.50%**. A $150 mechanical keyboard yields **$3.75**. A $1,800 laptop yields $45, but laptop purchase intent is not a thing you capture from a portfolio stack page.

**How to avoid:**
- **DECIDE phase, first action:** log into Associates, confirm account status and whether the 180-day clock applies. If it does, that constraint reshapes the entire roadmap ordering (you would ship the stack page before the email capture, not after).
- **Do the revenue math before building.** Parametric model, honest:
  - Stack page pageviews/month: `V`
  - Affiliate link CTR on that page: 2–5% is a realistic band for an editorial stack page with genuine reasoning (higher than a banner, far lower than a "best of" comparison post)
  - Click → purchase conversion on Amazon within the 24-hour cookie: 2–5%
  - ⇒ purchases ≈ `V × 0.0005` to `V × 0.0025`
  - At `V = 1,000`: **0.5–2.5 purchases/month**. At $3.75 each: **$2–$9/month.**
  - At `V = 10,000`: $19–$94/month.
  These are modeled, not measured — but the order of magnitude is the point, and it is not in dispute. **Amazon Associates on a dev stack page is not a revenue strategy. It is a credibility artifact that happens to pay for coffee.**
- **Diversify away from Amazon for the categories that matter.** SaaS/dev-tool affiliate programs (hosting, monitoring, SEO tools, course platforms) pay 20–30% recurring or $50–200 flat, i.e. 10–50× per conversion. The FEATURES/STACK research covers which ones accept low-traffic sites; the pitfall here is *building the whole system around Amazon because that's the account you already have.*
- **Amazon's 24-hour cookie** (vs 30–90 days for most other programs) makes it structurally worse for a site where visitors research and buy later. Factor it in.

**Warning signs:**
- The roadmap treats "Amazon Associates" as the monetization plan rather than one of several link targets.
- Nobody has opened the Associates dashboard during the milestone.
- Revenue projections appear anywhere without the multiplication written out.

**Phase to address:** **DECIDE** (account status check + revenue math as a written deliverable), **STACK-PAGE** (program mix).

---

### Pitfall 9: Displaying Amazon prices without the API — a policy violation hiding as a UX improvement

**What goes wrong:**
Someone adds "$149.99" to a product card because it makes the page more useful. Amazon Program Policies (2026-04-14):

> "Product prices and availability may vary from time to time... your Site may only show prices and availability if: (a) we serve the link... or (b) you obtain Product pricing and availability data via Creators API or PA API and you comply with the requirements..."

And when the data is refreshed less often than hourly, you must show a timestamp plus the exact disclaimer:

> "Product prices and availability are accurate as of the date/time indicated and are subject to change."

Meanwhile PA-API access has its own gate: Amazon requires qualifying sales before granting/keeping API credentials, and revokes access for accounts with no recent sales. So the API path is not available to a site that hasn't sold yet — which is the state this project is in.

**How to avoid:**
- **Do not display prices in v2.1.** Not "approximately," not "around $150," not a price range. This is the correct call regardless of policy, because a hardcoded price is stale within a week and a stale price on a technical-authority site is a credibility hit.
- If prices are ever wanted, it is a v2.2+ scope item with a hard prerequisite (PA-API credentials granted), and it brings a caching layer, a timestamp field, and the verbatim disclaimer string.
- Replace price with something Amazon does not regulate and that is more useful anyway: "what I paid vs what I'd pay again," "the cheaper alternative I tried first and why it didn't work."
- Same restraint applies to product images: use your own photographs of gear you actually own, or Amazon-served link widgets. Do not hotlink or re-host Amazon product imagery.

**Warning signs:** any `price` field in the affiliate schema; any product image whose source is an Amazon CDN URL.

**Phase to address:** **LINK** (schema explicitly has no `price` field) and **STACK-PAGE**.

---

### Pitfall 10: The non-localized field trap, affiliate-link edition — and why the array-level fix is the wrong fix

**What goes wrong:**
This project has hit non-localized-field bugs **five-plus times**: `Header.navItems.url`, `Content` block `link.url`, `TestimonialsCarousel.title`, `CaseStudies.services[].service`, `CallToAction.richText`. The pattern is always the same: a field that *looks* structural (a URL, a slug, a label) turns out to genuinely differ by locale, and the bug only manifests in one language.

The affiliate equivalent is the worst instance yet, because **the URL genuinely must differ per locale and getting it wrong loses money silently**:
- ES visitors should go to `amazon.es` with an `-21` tracking tag (Spain/EU marketplace).
- EN visitors should go to `amazon.com` with a `-20` tag.
- Non-Amazon programs often have separate EU/US affiliate accounts and separate links.

If `url` is not localized, every Spanish visitor is sent to a US storefront with a US tag: they see USD prices and international shipping, they don't convert, and the commission — if any — accrues to the wrong marketplace account. **You would never see an error. You would just see zero ES revenue and assume Spanish traffic doesn't convert.**

Fields that are also traps in this schema: `disclosureText` (must be localized — the FTC/Spanish wordings differ), `ctaLabel` ("View on Amazon" / "Ver en Amazon"), `whyIUseIt` (obviously localized), `program` name.
Fields that must **not** be localized: `rel` (structural, and should not be a field at all — Pitfall 1), `productName` (usually a proper noun), the routing strategy flag.

**Why the "just localize the array" fix is wrong here:**
Payload's array field supports `localized: true` at the array level, and the docs sell it as convenient: "a separate localized dataset is maintained for all data within the array, eliminating the need to localize each nested field individually." But Payload's own merge logic (`packages/payload/src/utilities/mergeLocalizedData.ts`) reveals the gotcha: **for a localized array, updating one locale replaces that locale's entire array wholesale**, with no per-row merge — unlike non-localized arrays, which recursively merge child rows by index. Consequences:
- Row identity is not shared across locales. Adding a tool in ES does not create it in EN; you get structural drift between the two stack pages.
- An editor updating ES can blow away the ES array's other rows if the update payload is partial.
- The two locales can end up with different numbers of tools — which is a duplicate/parity problem for hreflang (Pitfall 5).

**How to avoid:**
- **Model affiliate links as their own top-level collection**, not as a localized array inside a page. One document per tool = one shared identity, indexable, reusable from blog posts, and a single place to update a URL when a program changes.
- **Inside that collection, localize at the field level, never at the array level.** `url: { localized: true }`, `disclosureText: { localized: true }`, `whyIUseIt: { localized: true }`, `rel` absent entirely.
- **If a repeating structure is needed** (e.g. multiple marketplaces per product), use a **non-localized** array whose rows are keyed by an explicit `marketplace` field (`amazon-com`, `amazon-es`, `direct`), and resolve the right row at render time from the active locale. This keeps row identity shared and mirrors the pattern this project already validated with `src/lib/service-slugs.ts`: a pure, DB-free helper that maps locale → correct value at render time, imported by every consumer so there is exactly one implementation.
- **Write a locale-parity assertion.** For every affiliate link doc, assert both `es` and `en` have a non-empty `url`, and that the `es` URL is not the `en` URL by accident. Run it in GATE. This project's history says the bug will be caught by an assertion or not at all.

**Warning signs:**
- `localized: true` on an array or blocks field in the affiliate schema.
- Any affiliate `url` field without `localized: true`.
- `/es/stack` and `/stack` show a different number of tools.
- ES traffic to the stack page has a much lower outbound CTR than EN.

**Phase to address:** **LINK** (schema design — this is the phase's highest-risk decision), parity assertion in **GATE**.

---

### Pitfall 11: A migration that localizes an existing populated column — the exact shape of the Phase 19 data-loss incident

**What goes wrong:**
On 2026-07-12 this project generated `20260712_202954_phase19_calltoaction_localized.ts` to add `localized: true` to `CallToAction.richText`. Payload's generated migration `DROP COLUMN`'d the original `rich_text` and created the `_locales` rows without copying existing values across first. It ran unattended against the production Neon database and wiped the Home page's CTA copy. Recovery was Neon point-in-time restore.

**The monetization schema changes that carry the identical shape:**

| Change | Risk | Why |
|---|---|---|
| Adding `localized: true` to an affiliate `url`/`label` **after** content is entered | **HIGH — identical shape** | Payload drops the base column, creates `_locales`; existing values are lost unless explicitly back-filled |
| Adding `localized: true` to a `disclosureText` field later | HIGH | Same |
| Converting a plain `text` URL field to a `group`/array of marketplaces | HIGH | Column drop + reshape; old values orphaned |
| Renaming a collection slug (`tools` → `affiliate-links`) | HIGH | Payload renames/recreates tables; relationships break |
| Adding a new nullable column (`trackingId`, `program`) | LOW | Purely additive |
| Creating a new `AffiliateLinks` collection | LOW | Purely additive, new tables only |
| Adding a `unique` constraint to an existing column with duplicate data | MEDIUM | Migration fails or, worse, requires manual dedup |

The dominant mitigation is not a better migration process. It is **not needing the migration**: decide localization at schema-design time, before any content exists.

**How to avoid:**
- **LINK phase deliverable #1 is the finalized field-localization matrix**, reviewed before any content is created. Every field gets an explicit localized yes/no with a written reason. Assume you will not get a second chance.
- Per the project's Database Safety rule (root `CLAUDE.md`, as relaxed on 2026-07-12): additive migrations run unattended; anything with `DROP COLUMN`, `DROP TABLE`, `TRUNCATE`, `delete`, or a reshape that can lose data requires Juan reading the generated SQL and approving by name. **Every localization-conversion migration falls in the second bucket.**
- If a conversion is unavoidable, the migration must **back-fill both locales from the old column before dropping it** — the corrected pattern is already in `20260712_202954_phase19_calltoaction_localized.ts` in this repo. Copy it, do not re-derive it.
- Seed content only *after* the schema is frozen for the phase.

**Warning signs:**
- A generated migration file containing `DROP COLUMN` on a table that already has rows.
- A phase plan that says "we can localize it later if needed."
- Content seeded before the localization matrix is signed off.

**Phase to address:** **LINK** (schema frozen before content), with the Database Safety approval gate applied to every generated migration in the milestone.

---

### Pitfall 12: FTC disclosure in the footer — the placement rule people get wrong most often

**What goes wrong:**
An "Affiliate Disclosure" link goes in the footer, or a paragraph goes at the bottom of the post, or a line goes on the About page. All three are explicitly called out as inadequate.

FTC guidance is unambiguous: *placing a material connection disclosure in a footnote, behind an obscure hyperlink, or in a general ABOUT ME or INFORMATION page is not adequate.*

The regulation itself, **16 CFR § 255.0(f)** (Endorsement Guides as revised in 2023), requires a disclosure to be:
- easily noticeable and understandable by ordinary consumers,
- visually prominent — size, contrast, **location**, and display duration,
- **unavoidable** in interactive electronic media,
- uncontradicted by other elements of the communication,
- in a form matched to the medium,
- and, in the Commission's summary phrasing, "difficult to miss."

And **§ 255.5 Example 11 is literally this exact scenario** — a coffee-maker review blog carrying affiliate links, where "Because knowledge of this compensation could affect the weight or credibility site visitors give to the blogger's reviews, the reviews should **clearly and conspicuously disclose** the compensation." There is no ambiguity to litigate: an affiliate-link stack page requires disclosure.

Applicability note: the FTC's jurisdiction reaches advertising directed at U.S. consumers. An English-language page targeting U.S. readers is in scope regardless of where Juan lives.

**How to avoid:**
- **Disclosure appears above the first affiliate link and is visible without scrolling on mobile.** On a stack page that means immediately after the H1/intro, before the first tool card. Not a modal, not collapsed behind "read more."
- **Plain-language wording, not legalese.** Effective and compliant: *"Algunos enlaces de esta página son de afiliado: si compras a través de ellos, recibo una comisión sin costo adicional para ti. Solo recomiendo herramientas que uso en trabajo real."* / *"Some links on this page are affiliate links: if you buy through them I earn a commission at no extra cost to you. I only list tools I actually use in client work."* The second sentence is not required by the FTC but it is the sentence that preserves trust, which is the whole point on an authority site.
- **Per-link labeling in addition to the page-level disclosure.** The FTC has said "Paid link" adjacent to an affiliate link is an adequate disclosure of the link's nature. A small, visible "(afiliado)" / "(affiliate)" next to each CTA satisfies proximity for readers who jump straight to a card.
- **The Amazon-specific sentence is separately mandatory.** Operating Agreement (**Updated: October 15, 2025**), Section 5, requires: *"As an Amazon Associate I earn from qualifying purchases."* This is a required string, not a paraphrase. It must appear on any page carrying Amazon links.
- **Render it from a shared component, not from CMS body copy.** A `<AffiliateDisclosure />` component that any page carrying affiliate links renders automatically, ideally triggered by the presence of affiliate links rather than by an editor remembering. That is the only design that survives future content.
- **Localize the text** (Pitfall 10) — the Spanish version is a real Spanish sentence, not a translation of legal boilerplate.
- **Blog posts count too.** If an inline affiliate link ever lands in a post, that post needs the disclosure above the link. Build the automatic-trigger mechanism now.

**Warning signs:**
- Disclosure is a `pages` collection rich-text block that an editor has to remember to add.
- Disclosure is below the fold on a 375px viewport.
- A page has affiliate links and no `AffiliateDisclosure` in the rendered HTML.

**Phase to address:** **LEGAL** (component, wording, both locales), enforced automatically in **LINK**, asserted in **GATE** (render every page with affiliate links, assert disclosure precedes the first affiliate anchor in DOM order).

---

### Pitfall 13: EU / Spain disclosure obligations are separate from the FTC's — and the influencer decree is a red herring

**What goes wrong:**
Two opposite errors:
1. Assuming an FTC-shaped disclosure covers the EU. It largely does in practice, but the legal basis is different and the enforcement is national.
2. Panicking about Spain's "ley de influencers." **Real Decreto 444/2024** (approved 2024-04-30) applies to "usuarios de especial relevancia" — defined by thresholds around **€300,000 annual income from the activity, 2,000,000+ followers, and 24+ videos/year**. Juan is nowhere near this and the decree does not apply. Do not build for it.

**What actually applies in Spain/EU:**
- **UCPD (Directive 2005/29/EC), Annex I, point 11** — using editorial content in the media to promote a product where the trader has paid for the promotion, without making that clear, is an unfair commercial practice **in all circumstances** (a per-se blacklist item, no case-by-case balancing).
- **Ley 3/1991 de Competencia Desleal, art. 26** — the Spanish transposition ("prácticas comerciales encubiertas"), plus art. 7 on misleading omissions.
- **Ley 34/2002 (LSSI), art. 20** — commercial communications must be clearly identifiable as such and identify the party on whose behalf they are made.

Practically: the same above-the-fold, plain-Spanish disclosure that satisfies the FTC satisfies these. The difference is that the Spanish text must be a genuine Spanish disclosure, not a translated US legalism, and it must be *identifiable as commercial communication*, which the word "afiliado" plus "recibo una comisión" achieves.

**How to avoid:**
- One disclosure design, two genuinely-written locale strings, both above the first affiliate link. Done.
- Do not add a cookie banner *because of* affiliate links (see Pitfall 14 for when you actually need one).
- Do not scope RD 444/2024 into the roadmap.

**Verification caveat for the roadmapper:** the UCPD/LCD/LSSI article references above are established law but were **not** re-fetched verbatim from EUR-Lex/BOE in this research pass (EUR-Lex fetch was not completed). Treat the *conclusion* (above-the-fold plain-language ES disclosure is required and sufficient) as HIGH confidence and the *article numbers* as MEDIUM — verify against BOE before quoting them in a public policy page.

**Phase to address:** **LEGAL**.

---

### Pitfall 14: Adding tracking that requires consent — and then adding a consent banner that wrecks CWV

**What goes wrong:**
Click tracking gets built, then someone realizes it might need consent, then a cookie banner gets bolted on, and the banner — a late-injected, full-width, position-fixed overlay from a third-party script — becomes the single largest CLS and INP contributor on the site. The site that had a zero-regression CWV gate now has a consent banner as its worst Web Vital. This sequence is extremely common and entirely self-inflicted.

**What actually requires consent:**
ePrivacy Directive **Art. 5(3)** governs *storing information on, or gaining access to information stored in, a user's terminal equipment*. Two exemptions: transmission of a communication, or strictly necessary for a service explicitly requested by the user. The EDPB's **Guidelines 2/2023 on the technical scope of Art. 5(3)** (final version adopted October 2024) read this expansively and explicitly bring **tracking URLs and tracking pixels** into scope, along with unique identifiers derived from things like hashed emails.

Applied to this milestone:

| Thing | Consent needed? | Why |
|---|---|---|
| A plain `<a href>` to an affiliate URL | **No** | No storage/access on the user's device by *you*. Amazon setting its own cookie after navigation is Amazon's controller obligation on Amazon's domain. |
| A `/go/` 302 redirect that logs nothing per-user (aggregate counter only, no cookie, no ID) | **No** (defensible) | Server-side aggregate counting with no storage/access on terminal equipment. Keep it genuinely aggregate — no session ID, no fingerprint. |
| A `/go/` redirect that sets a cookie or reads a client-generated ID | **Yes** | Storage/access on terminal equipment |
| A tracking pixel or client-side beacon with a persistent ID | **Yes** | EDPB Guidelines 2/2023 explicitly in scope |
| GA4 / GTM | **Yes** | Cookies + identifiers; also triggers Google Consent Mode v2 obligations for EEA traffic if Google ads/analytics products are used |
| Cookieless, aggregate, self-hosted analytics (e.g. server-side page counting, or a cookieless tool) | Generally **no** consent banner needed | No terminal-equipment storage/access. Note some DPAs still expect notice; the Member-State analytics exemptions (FR/IT/ES) are narrow and not pan-EU. |
| Resend email capture (form POST) | **No banner**, but **yes GDPR** | It is personal-data processing (Art. 6 lawful basis + Art. 13 notice), not terminal-equipment storage. Consent is the basis for marketing email, collected at the form, not via a banner. |

**How to avoid:**
- **Design the milestone so no consent banner is needed.** That is achievable and it is the right call for this site: no GA4, no pixels, no per-user click IDs. Use Amazon tracking IDs (Pitfall 7) and affiliate-network dashboards for attribution. This is the single highest-value performance *and* compliance decision in v2.1.
- If a banner ever becomes necessary, it is a **self-hosted, server-rendered, CLS-zero** component: reserved space or a bottom-anchored element outside normal flow, no third-party CMP script, no layout shift. Budget it explicitly against BASELINE.
- Update the privacy policy regardless: what data the email form collects, lawful basis, Resend as processor, retention, unsubscribe. That is required even with zero cookies.

**Warning signs:**
- Any `document.cookie` write, `localStorage` write, or `navigator.sendBeacon` with an identifier in the affiliate path.
- A third-party CMP appearing in the dependency list.
- CLS regressing in GATE and the culprit being a banner.

**Phase to address:** **LEGAL** (the consent decision — write down "no consent-triggering tracking in v2.1" as an explicit constraint), **LINK** (enforce it in the implementation).

---

### Pitfall 15: EU VAT on digital products — a Peru-based individual has **no threshold**, from the first sale

**What goes wrong:**
The single most expensive misunderstanding in the milestone, and the reason the digital-products decision must not be made casually.

Everyone knows the **€10,000 threshold** for EU cross-border digital sales. Almost everyone misapplies it. Per the European Commission's VAT One Stop Shop material, the **non-Union scheme** is for *"Any taxable person, not established in the EU, who supplies services to non-taxable persons taking place in the EU."* The €10,000 simplification threshold is available **only to suppliers established (or resident) in a single EU Member State**. It does **not** apply to suppliers established outside the EU.

**Concretely: Juan, established in Peru, selling a €29 checklist to one consumer in Madrid, owes Spanish VAT (21%) on that sale. From sale number one. There is no de-minimis.** Compliance means registering for the non-Union OSS in a chosen Member State of identification, charging destination-country VAT rates per buyer, collecting and retaining two pieces of non-contradictory evidence of customer location, and filing quarterly OSS returns (including nil returns).

**This is why merchant-of-record platforms exist.** A MoR becomes the **legal seller** to the end customer; the tax obligation is theirs, not yours. Your relationship becomes Juan → platform (a single B2B relationship), not Juan → thousands of EU consumers.

| Platform | MoR? | Note |
|---|---|---|
| **Stripe** (standard Payments) | **No** | You are the seller of record. Stripe Tax *calculates* VAT; it does not *owe* it. Choosing Stripe means Juan personally takes on non-Union OSS registration and quarterly filings. |
| **Stripe Managed Payments** | **Yes** | Stripe's own MoR product, announced February 2026; in public preview as of April 2026. ~5% + $0.50. Preview status = do not bet a v2.2 launch date on it. |
| **Lemon Squeezy** | **Yes** | Handles EU VAT, US sales tax, global compliance. Acquired by Stripe (July 2024); as of 2026 it still operates independently alongside Stripe Managed Payments. ~5% + $0.50. |
| **Paddle** | **Yes** | Established MoR, similar model |
| **Polar** | **Yes** | Newer MoR, developer-oriented |
| **Gumroad** | **Yes** | MoR, higher take rate, weakest brand control |

**How to avoid:**
- **Hard architectural rule for v2.2: merchant of record, non-negotiable.** Not "we'll use Stripe and add tax later." The moment a €29 product is live and one EU customer buys, an unregistered non-EU seller is non-compliant. The ~5% MoR fee is not a cost, it is the price of not running an international VAT compliance function as a solo consultant.
- **Do not build a Stripe Checkout integration in v2.1 "to get ahead."** Write the platform decision down (that is already the milestone's stated deliverable) and stop there.
- Note the MoR fee in the pricing model: a €29 product nets ~€27 after MoR, before Juan's own income tax.

**Peru-side reality — flagged, NOT asserted:**
This research did **not** verify Peruvian domestic tax law live, and it should not be relied on. What a roadmapper needs to know is only this: even with a MoR handling EU VAT, Juan still has a **Peruvian** obligation on the income he receives from the platform (personal income tax; potentially IGV considerations depending on how the activity is characterized; potentially RUC/comprobante requirements). A MoR removes the *foreign VAT* obligation, not the *domestic income tax* obligation. **Action item, not a claim: consult a Peruvian contador before the first sale.** Treat this as a v2.2 prerequisite with a named owner, not as something the roadmap can resolve.

**Warning signs:**
- Any phase plan containing "Stripe Checkout" without "merchant of record" in the same sentence.
- A pricing page live before the tax question has a written answer.
- "We'll deal with VAT once we have sales" — by then you have the liability.

**Phase to address:** **DECIDE** (platform decision, MoR as a hard filter). **Blocking prerequisite for v2.2-PRODUCTS.**

---

### Pitfall 16: The email popup is the fastest way to fail this site's own CWV gate

**What goes wrong:**
This project has a documented zero-regression Lighthouse/CWV gate that has already caught real problems (v1.5 Phase 25, v1.7 Phase 36 PASS 6/6). Email capture is, empirically, the most CWV-hostile thing on a typical content site, in three ways:

1. **CLS.** An exit-intent or timed modal that mounts after hydration and pushes content — or, more insidiously, an *inline* newsletter block that renders `null` on the server and a 200px card on the client. That is a guaranteed layout shift on every page it appears on.
2. **INP.** Popup libraries attach global listeners (`mousemove` for exit intent, `scroll` for scroll-triggered) and run work on the main thread. Scroll/mousemove handlers without passive listeners or throttling are a classic INP killer, and INP is the metric this site is least likely to have slack on because the Home hero already runs a WebGL shader (`GrainGradient`).
3. **Third-party weight.** A hosted popup/CMP/email-widget script is typically 40–150 KB of JS for a form. Context for calibration: an *empty* GTM container is ~28 KB and real containers run 100–500 KB+; hosted chat widgets routinely ship 500 KB+ to render a button. Any of these dwarfs the site's own interactive JS budget.

**Why it happens:**
Because "add a newsletter popup" sounds like a 20-minute task, and because conversion-optimization advice pushes hard for aggressive modals.

**How to avoid — concrete, in priority order:**
- **No third-party popup/email SDK. At all.** The form posts to a Next 15 **Server Action** that calls Resend's Audiences API server-side. Client JS cost: the form's own progressive-enhancement handler, low single-digit KB. Resend's API key never reaches the browser. This also sidesteps Pitfall 14 entirely (no third-party cookies).
- **Inline capture beats modal capture on this site.** A server-rendered inline block at the end of posts and on the stack page: zero CLS (it is in the initial HTML), zero INP cost, no interruption of a reader who is evaluating you as a consultant. The conversion-rate delta vs an aggressive modal is real but small, and the CWV/UX delta is not worth it for a site whose product *is* technical credibility.
- **If a modal is insisted on:** trigger on an explicit user action (a button click), never on timer or exit-intent; render it with the `dialog` element; reserve nothing in flow (it is `position: fixed`, outside normal flow, so it cannot cause CLS); no `mousemove` listeners; `prefers-reduced-motion` respected, consistent with the v1.3 hero precedent.
- **Reserve space for anything that can appear.** Success/error messages after submit must not push content — reserve the message row's height in the initial layout.
- **Budget it in BASELINE.** Capture the current LCP/CLS/INP per route; GATE re-measures the same 6 routes. Same discipline as Phase 32/36, and the same environmental hygiene lesson from Phase 25: **kill orphaned `next dev` processes before measuring**, or you will get a false FAIL from CPU contention and waste a day chasing it.

**Concrete budget to write into the phase plan:**
- Added client JS for email capture: **≤ 5 KB gzipped**
- Added client JS for affiliate links: **0 KB** (server-rendered anchors)
- CLS delta on any route: **0.00**
- INP delta: **≤ 10 ms**
- Lighthouse performance delta: **≤ 3 points** (the threshold already accepted in v1.3)

**Warning signs:**
- Any email/popup npm package in `package.json`.
- `'use client'` on the newsletter component for reasons other than the submit handler.
- CLS on `/blog/[slug]` moving off 0.00 in GATE.

**Phase to address:** **EMAIL** (architecture: Server Action + inline), budgets set in **BASELINE**, enforced in **GATE**.

---

### Pitfall 17: Building click logging into Postgres — write amplification against an unpooled Neon connection

**What goes wrong:**
"Tracking de clics" is in the milestone's stated feature list, and the obvious implementation is: `/go/[slug]` route handler → `payload.create({ collection: 'affiliate-clicks', data: {...} })` → redirect. On this stack that is worse than it looks:

- `src/payload.config.ts` deliberately uses the **UNPOOLED / direct** Neon connection string, because the `-pooler` string breaks `payload migrate` prepared statements. Direct Neon connections are a scarce resource and there is no PgBouncer in front of them.
- A synchronous insert on the redirect path means the user waits for a Postgres round-trip before being sent to Amazon — added latency on the exact interaction you are trying to convert.
- Bots hit `/go/` URLs. Even with `rel="sponsored nofollow"` and `Disallow: /go/`, non-compliant crawlers, link checkers, email scanners and preview-fetchers will hit them. Every one is a row.
- One row per click means an unbounded, monotonically growing table on a database whose whole job is serving a portfolio site, plus WAL and storage cost, plus keeping a Neon compute awake that would otherwise auto-suspend.
- And the data it produces is **worse** than what Amazon and the affiliate networks already give you for free.

**How to avoid — the opinionated recommendation:**
- **Do not build click logging in v2.1.** Use Amazon's per-page tracking IDs (up to 100 per account) and each network's own dashboard. You get click *and* conversion data, which a self-built click logger cannot give you at all, for zero code and zero writes. Push back on this feature explicitly in DECIDE; it is the clearest ROI-vs-effort loser in the milestone.
- **If it is built anyway**, then all of the following, not a subset:
  - **Redirect first, log after.** Next 15's `after()` runs work after the response is sent. The user never waits on the DB.
  - **Aggregate, don't append.** One row per `(linkId, locale, date)` with an `UPSERT ... ON CONFLICT DO UPDATE SET count = count + 1`. Bounded table growth, one write per click instead of one row.
  - **Bot filter before writing.** User-agent denylist + drop requests with no `Referer` from your own origin.
  - **Rate limit per IP.**
  - **Never on the direct Neon connection for writes.** Either add a separate pooled connection for this one path, or accept the aggregate design's low write volume as the mitigation.
  - **Retention policy from day one** — a `DELETE` older than N days is a destructive operation and needs Juan's named approval under the Database Safety rule, so define it before the table exists.

**Warning signs:**
- `affiliate-clicks` collection with one row per click.
- `await payload.create(...)` before `NextResponse.redirect(...)`.
- Neon compute hours climbing without traffic climbing.

**Phase to address:** **DECIDE** (kill it) or **LINK** (if kept, with all six mitigations as acceptance criteria).

---

### Pitfall 18: Local API queries without `overrideAccess: false` leak drafts

**What goes wrong:**
Payload's Local API defaults to `overrideAccess: true`, meaning it **bypasses the collection's access control rules entirely**. This project has already been bitten: Phase 24 shipped a draft-page leak via the Local API, and `src/lib/cache.ts` now carries a written security note (T-43-02) plus an explicit `overrideAccess: false` on every fetcher — a fix that had to be re-applied in a 43-REVIEW pass because one fetcher was missed.

Every new data-fetching path introduced by this milestone is a fresh instance of the same trap:
- fetching affiliate links for the stack page
- fetching affiliate links to render inside a blog post
- resolving a slug in the `/go/[slug]` route handler
- any future product/pricing fetch in v2.2

The consequence for affiliate content is specific: an unpublished affiliate link — a program you are still negotiating, a URL with a placeholder tag, a tool you decided not to endorse — renders publicly and, worse, is crawlable.

**How to avoid:**
- **Every** `payload.find` / `payload.findByID` in this milestone passes `overrideAccess: false` explicitly. Follow the established convention in `src/lib/cache.ts`, including the comment style, so the next reviewer sees the intent.
- Put affiliate-link fetchers **in `src/lib/cache.ts` alongside the existing ones**, not in ad-hoc component files. Centralization is what made the audit possible last time.
- Give `AffiliateLinks` a real `_status`/publish workflow and a `read` access rule that requires published, so `overrideAccess: false` actually has something to enforce. An access rule of `() => true` makes the flag decorative.
- Add a grep-based check to GATE: every `payload.find(` in `src/` is followed within N lines by `overrideAccess: false`, or carries an explicit exemption comment (the existing `cache.ts:74` case documents its exemption — copy that pattern).

**Warning signs:**
- A new `getPayload()` call outside `src/lib/cache.ts`.
- `payload.find({ collection: 'affiliate-links' })` with no options beyond `where`.
- A draft affiliate link visible in the rendered page.

**Phase to address:** **LINK** and **STACK-PAGE**; grep assertion in **GATE**.

---

### Pitfall 19: Payment webhooks on a self-hosted Node process — no Vercel to lean on (v2.2)

**What goes wrong:**
Deferred to v2.2, but the roadmap must record it because the deployment target changes the answer. On Vercel, a webhook handler gets automatic scaling, request isolation and a managed retry story. On a single PM2/systemd-managed Node process on Hostinger, four things break in ways that cost real money:

1. **Signature verification needs the raw body.** In a Next 15 App Router route handler, `await req.json()` consumes and re-serializes the body; the re-serialized JSON will not match the signature. You must use `await req.text()` and pass that exact string to the provider's verification function. This is the #1 webhook bug and it fails *silently* in the sense that it fails 100% of the time and looks like a config problem.
2. **No idempotency = duplicate fulfillment.** Stripe/Lemon Squeezy/Paddle all retry on any non-2xx and can deliver the same event more than once even on success. Without dedup, one purchase sends two license emails, or grants two entitlements.
3. **Process restarts mid-processing.** PM2 restarts on deploy or crash. If the handler acknowledged (200) before persisting, the event is lost forever — the provider will not retry a 200.
4. **The middleware matcher catches it.** Same class of bug as Pitfall 6: `/api` is already excluded, but if the webhook lands anywhere else it goes through `next-intl` and the redirects-lookup fetch.

**How to avoid (write into the v2.2 plan now):**
- `const raw = await req.text()` → verify signature against `raw` → only then `JSON.parse(raw)`.
- **Idempotency table with a unique constraint on the provider's event ID.** `INSERT ... ON CONFLICT DO NOTHING`; if zero rows affected, return 200 immediately without re-processing. This is the whole mechanism; it is ~10 lines and it is not optional.
- **Persist before acknowledging.** Write the event row (and the fulfillment record) inside one transaction, then return 200. Never `return 200` and process asynchronously on a process that can be restarted.
- **Return 200 on unrecognized event types** — otherwise the provider retries them forever and eventually disables the endpoint.
- **Confirm the route is outside the middleware matcher** and, if it is not, add it to the negative lookahead.
- **Reconciliation job.** Because a self-hosted process *will* be down at some point, a scheduled job that pulls recent orders from the provider API and fills gaps is the actual safety net. Retries alone are not.
- Webhook secret in env, never in the repo; reject unverified requests with 400 before any parsing.

**Warning signs:** `await req.json()` in a webhook handler; no unique constraint on event ID; no reconciliation path.

**Phase to address:** **v2.2-PRODUCTS**. Recorded here so the roadmapper sizes that phase honestly — it is not "add Stripe," it is a durability problem.

---

### Pitfall 20: Building the store before having a single product, subscriber, or piece of commercial content

**What goes wrong:**
The most common way this exact milestone fails: three weeks go into a products collection, a checkout flow, a license-key generator and an entitlements table, and at the end there is a beautifully engineered store with **zero products, zero subscribers, and zero traffic with commercial intent**. The engineering was the fun part, so it happened first. Nothing sells.

The related failure, specific to a technical site: shipping the affiliate infrastructure before there is any content that a buyer would ever read. Affiliate links convert against **purchase intent**, and purchase intent comes from content that answers a buying question. A stack page linked from nowhere, on a site whose traffic arrives via "auditoría SEO técnica," converts approximately zero — not because the implementation is wrong but because the audience is in the wrong mode.

**Why it happens:**
Because "build the platform" is a well-defined engineering task with a clear done state, while "build an audience" is not. Engineers reliably substitute the former for the latter.

**How to avoid — correct sequencing:**
1. **Email capture first.** It is the cheapest thing to build (a Server Action + Resend Audiences), it compounds from day one, and every subsequent monetization option is 10× more effective with a list than without. A list of 200 engaged readers is worth more than a store with a perfect checkout.
2. **Then the stack page.** It is content, not infrastructure. It produces the first affiliate revenue, it is genuinely useful to readers, and it doubles as the lead magnet's natural home.
3. **Then commercial content**, if and only if keyword research says there is ES/EN volume Juan can realistically rank for.
4. **Products last, and only after demand is proven.** The proof is: subscribers asking for it, or a specific question that recurs in the inbox. Not a hunch.
5. **Pre-sell before building.** If a product is on the table, sell it as a waitlist or a pre-order to the list first. Ten pre-orders justify building it; zero saves you three weeks.

**Honest numbers on program acceptance, since the milestone asks:**
- **Amazon Associates**: instant provisional approval, but the 180-day / qualifying-sales gate is the real filter (Pitfall 8).
- **Large affiliate networks** (Impact, PartnerStack, ShareASale/Awin, CJ): approval is per-advertiser, not per-network. Network signup is usually days; individual programs range from auto-approve to rejection with no reason. Rejection of a low-traffic site is common and is not a signal about content quality.
- **SaaS/dev-tool direct programs**: the most realistic fit here. Many auto-approve, many pay 20–30% recurring or $50–200 flat. These are worth 10–50× an Amazon PC-components click.
- **Realistic first-year expectation with the site's current traffic profile: two to three figures per month, not four.** Anyone projecting otherwise is selling something. The right frame for v2.1 is: build the *mechanism* correctly and cheaply, so that when traffic and the list grow, the monetization is already in place and does not need to be retrofitted onto a ranking site — which is the expensive version of this project.

**Warning signs:**
- A phase plan for checkout appears before an email-capture phase has shipped.
- A products collection with no product.
- Anyone proposing to "write 30 comparison posts" (that is scaled content abuse territory — Pitfall 2).

**Phase to address:** **DECIDE** — this is the sequencing decision the phase exists to make. Recommended order: **EMAIL → STACK-PAGE → (measure 90 days) → products/commercial content**.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| `rel` as an editable CMS field instead of code-emitted | Editor flexibility | One blank field = a manual action risk on a site whose value is SEO credibility | **Never** |
| Affiliate links as a localized array inside `pages` instead of a collection | Ships faster, one fewer collection | Wholesale per-locale array replacement (Payload `mergeLocalizedData`), locale drift, no reuse in posts, no publish workflow | **Never** — the collection is barely more work |
| Non-localized `url`, "we'll localize later" | Simpler schema today | Reproduces the Phase 19 `DROP COLUMN` data-loss shape, plus silent zero ES revenue | **Never** |
| Hardcoded prices on product cards | More useful page | Amazon policy violation + stale data on an authority site | **Never** |
| Disclosure as editor-authored rich text instead of an auto-rendered component | No new component | One forgotten page = an FTC-inadequate disclosure | Only for a one-off `noindex` page |
| Client-side third-party newsletter widget | 20-minute integration | 40–150 KB JS, CLS, INP, consent surface, fails the site's own CWV gate | **Never** on this site |
| One row per click in Postgres | "Real" analytics | Unbounded growth on an unpooled Neon direct connection, worse data than Amazon's free reports | Only with all six mitigations from Pitfall 17 |
| Skipping the Search Console baseline | Saves an hour in BASELINE | You can never prove or disprove that monetization hurt `/services` | **Never** — it is the milestone's only real safety net |
| `overrideAccess` left at default on a new fetcher | Fewer keystrokes | Draft/unpublished affiliate links leak publicly and get crawled | **Never** (already a known, twice-fixed bug class here) |
| Stripe standard instead of a merchant of record | Lower fees, familiar API | Personal EU VAT liability from the first euro, non-Union OSS registration + quarterly filings | Only if Juan actually registers for OSS and files — i.e. effectively never |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| **Amazon Associates** | Routing Amazon links through `/go/` "for tracking" | Direct `amazon.*` URL with `tag=`, `rel="sponsored nofollow noopener"`, no `referrerPolicy` override, store named in the CTA. Per-page **tracking IDs** for attribution. |
| **Amazon Associates** | Using one tracking ID for the whole site | Distinct tracking ID per page/section (up to 100) — free, policy-clean attribution |
| **Amazon Associates** | Showing prices scraped or hardcoded | No prices in v2.1. If ever: PA-API/Creators API only, plus timestamp and the verbatim disclaimer string |
| **Amazon Associates** | Assuming the account is safe because it exists | Verify status and whether the 180-day qualifying-sales window is still open, in DECIDE |
| **Amazon Associates** | Affiliate links in a newsletter to a single-opt-in list | Special Links allowed only in *solicited* (opted-in) email → double opt-in required |
| **Resend Audiences** | API key or contact-create call in a Client Component | Server Action only; key stays server-side |
| **Resend Audiences** | Single opt-in | Double opt-in: create contact as unsubscribed → send confirm email with a signed token → confirm route flips the flag. Protects deliverability, satisfies GDPR consent evidence, and satisfies Amazon's solicited-email rule |
| **Resend** | Assuming email works in this repo today | `RESEND_API_KEY` is a placeholder/invalid per PROJECT.md and Phase 6 is blocked on it. EMAIL phase either gets a real key or is explicitly gated |
| **next-intl middleware** | Adding `/go/` without touching the matcher | Add `go` to the negative lookahead; assert `/api/redirects-lookup` is not hit on affiliate clicks |
| **robots.ts** | Leaving it at `/admin`, `/api` | Add `Disallow: /go/`. Do **not** also add `noindex` to the route — robots.txt prevents Google from ever seeing it |
| **Payload localization** | `localized: true` on the array | Field-level localization inside a non-localized array keyed by an explicit `marketplace` field |
| **Payload Local API** | Default `overrideAccess: true` | Explicit `overrideAccess: false` on every fetcher, centralized in `src/lib/cache.ts` |
| **Payload migrations** | Letting a generated migration run because "it's just a field change" | Read the SQL. Any `DROP COLUMN` on a populated table → Juan's named approval + back-fill first (the corrected pattern is in `20260712_202954_phase19_calltoaction_localized.ts`) |
| **Neon Postgres** | Adding write traffic on the direct/unpooled connection | Aggregate upserts, `after()`-deferred, bot-filtered — or don't write at all |
| **Stripe / Lemon Squeezy (v2.2)** | `await req.json()` for signature verification | `await req.text()`, verify against the raw string, then parse |
| **Stripe (v2.2)** | Standard Stripe assuming Stripe Tax = compliance | Stripe Tax calculates; it does not assume liability. Use a merchant of record |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Third-party newsletter/popup SDK | LCP + INP regression sitewide; 40–150 KB added JS (calibration: empty GTM ≈ 28 KB, real containers 100–500 KB+, hosted chat widgets 500 KB+) | Server Action + Resend; no client SDK | Immediately, on every route the widget loads |
| Inline newsletter block that renders `null` server-side | CLS on `/blog/[slug]` and `/stack` | Server-render the block; reserve height for success/error messages | First real-user measurement; often invisible in lab tests |
| Exit-intent / timed modal | INP regression from `mousemove`/`scroll` listeners; CLS if it affects flow | Button-triggered `<dialog>`, `position: fixed`, no global listeners | Immediately on mid-range mobile; this site has less INP slack than most because of the WebGL hero |
| Affiliate widgets / comparison-table scripts | LCP delayed behind an external resource; CLS from late-mounted content | Server-rendered anchors only. Zero third-party affiliate JS. | On introduction |
| Product images from merchant CDNs | LCP regression (uncontrolled sizes/formats, no `next/image`), plus a policy problem | Own photos through Cloudinary, `next/image`, explicit dimensions | As soon as the stack page has >6 images |
| Image-heavy stack page | LCP; total page weight | Cloudinary transforms, `sizes` set correctly, lazy-load below the fold, hard cap on above-the-fold images | ~10+ images without discipline |
| Analytics/GTM | INP (HTTP Archive 2024 identifies third-party scripts as the leading cause of poor INP) | No GA4/GTM in v2.1; if ever needed, a cookieless server-side option evaluated against BASELINE | On introduction |
| Cookie consent banner | CLS + INP; often becomes the site's worst vital | Design the milestone to need no banner (Pitfall 14) | On introduction |
| Synchronous DB write in the `/go/` redirect path | Slow affiliate clicks; Neon direct-connection pressure | `after()` + aggregate upsert, or no logging at all | Noticeable under bot traffic long before real traffic |
| Measuring CWV with orphaned `next dev` processes running | False FAIL in GATE (this already happened in v1.5 Phase 25) | Kill stray processes; measure against a production build; use a control route | Every time, until someone writes it in the runbook |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Open redirect at `/go/[slug]` accepting a URL from the query string | Your domain becomes a phishing redirector; reputational and possible blocklisting damage | Slug-only lookup against the DB. **Never** accept a destination from user input. Validate the resolved destination against a domain allowlist before redirecting. |
| Affiliate anchors with `target="_blank"` and no `noopener` | Reverse tabnabbing | `rel="sponsored nofollow noopener"` — the `noopener` is not optional and comes free with the structural `rel` |
| `overrideAccess` default on new fetchers | Unpublished affiliate links / draft products leak and get crawled | Explicit `overrideAccess: false` everywhere (already a twice-fixed bug class here) |
| Affiliate tags / API keys in client bundles | Credential exposure; PA-API keys are especially sensitive | Server-only. Note the existing precedent: `service-slugs.ts` was split out of `services-data.ts` precisely to stop the Payload server SDK reaching the client bundle — apply the same discipline |
| Email form with no rate limit or spam control | List poisoning; Resend reputation damage; possible domain blocklisting | Rate limit per IP, honeypot field, double opt-in (which alone defeats most poisoning) |
| Confirmation link without a signed, expiring token | Anyone can confirm arbitrary addresses | HMAC-signed token with expiry, verified server-side |
| Webhook without signature verification (v2.2) | Forged purchase events → free product delivery | Verify the raw-body signature; reject before parsing |
| Storing raw email addresses without a retention/deletion path | GDPR Art. 17 exposure | Unsubscribe + deletion path; Resend as documented processor in the privacy policy |
| Migration approval bypassed on a destructive change | Repeat of the 2026-07-12 production data loss | Database Safety rule: read the SQL, named approval for anything destructive |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Disclosure buried in the footer | Reader feels deceived on discovering the links are paid — fatal on a site selling trust; also legally inadequate | Above the first affiliate link, plain language, plus a per-link "(afiliado)" label |
| "Buy now" CTAs with no destination named | Reader can't tell where they're going; violates Amazon's clarity clause | "Ver en Amazon" / "View on Amazon" — name the store |
| Tool list with no reasoning | Reads as a monetization grab from someone selling expertise | 100–200 words per tool: what it's for, what it replaced, what broke, where it was used |
| Aggressive modal on a consulting site | Interrupts a prospect evaluating whether to hire you; costs a €2,000 engagement to gain a €0.05 subscriber | Inline capture at natural break points |
| Lead magnet that requires a form before showing any value | Bounce | Show the value first; gate the extended/downloadable version |
| ES page that is an obvious machine translation | Undermines the Spanish-market positioning built in v1.4/v1.5 (Lima + Madrid landings) | Write ES natively, with ES-market examples and ES storefront links |
| Affiliate links opening in the same tab | Reader leaves and doesn't come back | `target="_blank"` + `rel="... noopener"` |
| Stack page in the primary nav from day one | Signals "this site sells gear" to a prospect who came to hire a consultant; also drains link equity from `/services` | Link from the author page, relevant posts, and the footer. Revisit after 90 days of data |

---

## "Looks Done But Isn't" Checklist

- [ ] **Affiliate links:** often missing `sponsored` on the **rich-text** path while the dedicated component is correct — verify by rendering every post and the stack page and grepping the HTML for anchors to affiliate domains without `sponsored` in `rel`
- [ ] **Affiliate links:** often missing `noopener` alongside `target="_blank"` — verify in the same grep
- [ ] **Localization:** often missing the ES `url` (falls back to the EN one via Payload's `fallback: true`, so it *renders fine* and silently sends ES traffic to a US storefront) — verify per-doc that `es.url ≠ en.url` where a Spanish marketplace exists
- [ ] **Localization:** often missing ES/EN parity in item count — verify `/stack` and `/es/stack` list the same tools
- [ ] **Disclosure:** often missing on blog posts that happen to carry one inline link — verify the disclosure component is triggered by link presence, not by an editor's memory
- [ ] **Disclosure:** often missing the verbatim Amazon sentence — verify *"As an Amazon Associate I earn from qualifying purchases."* appears on every page with Amazon links, in both locales
- [ ] **Disclosure:** often below the fold on mobile — verify at 375px that it is visible without scrolling, above the first affiliate link
- [ ] **`/go/` route:** often still inside the middleware matcher — verify no `/api/redirects-lookup` hit on an affiliate click
- [ ] **`/go/` route:** often missing from `robots.ts` — verify `Disallow: /go/` is present and that `/es/go/...` and `/en/go/...` do not resolve
- [ ] **Sitemap:** often leaks the new collection — verify `sitemap.xml` contains no `/go/` and no affiliate-link docs
- [ ] **Canonical/hreflang:** often broken on a newly-added route shape — curl-verify every URL combination for the stack page (self-canonical, reciprocal hreflang, `x-default`), the way Phase 19 did with 10 combinations
- [ ] **Local API:** often missing `overrideAccess: false` on exactly one new fetcher — grep `payload.find(` across `src/` and check each
- [ ] **Access control:** often the collection has no publish workflow, making `overrideAccess: false` decorative — verify `read` access actually requires published status
- [ ] **Email capture:** often missing double opt-in — verify a new contact is created unsubscribed and only flipped by a signed-token confirm route
- [ ] **Email capture:** often missing the unsubscribe path and the privacy-policy update — verify both
- [ ] **Email capture:** often missing the "what happens on failure" state — verify the error message does not shift layout
- [ ] **CWV:** often measured on a dev server with orphaned processes — verify a clean production build and a control route (v1.5 Phase 25 lesson)
- [ ] **CWV:** often measured only on the new page — verify the 6 baseline routes, because dilution shows up on the *old* pages
- [ ] **Search Console:** often no baseline — verify `/services` + 4 landings + 2 geo pages impressions/position were captured **before** launch

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| "Unnatural links from your site" manual action | **HIGH** | Add `sponsored`/`nofollow` to every compensated outbound link sitewide → document the fix → reconsideration request in Search Console → wait weeks. Rankings may not fully return. Prevention is dramatically cheaper. |
| Thin-content manual action / site-level quality drag | **HIGH** | Rewrite or delete the thin pages; the site-level signal recovers only on a subsequent core update, i.e. months. |
| Amazon account termination for cloaking/shortening | **HIGH / possibly terminal** | Amazon states it cannot restore a rejected Associates ID. Reapplication is possible but the ID and history are gone. |
| Amazon 180-day window missed | **MEDIUM** | Reapply as a new applicant; new Associates ID; existing links must be re-tagged. |
| Non-localized `url` shipped and populated | **MEDIUM-HIGH** | Now requires the exact migration shape that caused the 2026-07-12 data loss. Back-fill both locales from the base column *before* dropping it (pattern already in the repo), named approval required. |
| Draft affiliate links leaked and crawled | **MEDIUM** | Add `overrideAccess: false`, unpublish, request removal in Search Console, wait for recrawl. |
| CWV regression found at GATE | **LOW** | The gate is the recovery mechanism. Revert the offending component, re-measure. This is exactly what the baseline exists for — which is why BASELINE cannot be skipped. |
| Duplicate/canonical breakage on the bilingual stack page | **LOW-MEDIUM** | Fix canonical/hreflang from a single helper; request reindex. Caught early it costs an afternoon; caught in three months it costs rankings. |
| Open redirect exploited at `/go/` | **HIGH** | Patch immediately, audit logs, possible domain-reputation cleanup with Google Safe Browsing. Prevent with slug-only lookup + destination allowlist. |
| EU VAT non-compliance discovered after sales | **HIGH** | Retrospective registration, back-VAT, penalties per Member State, no threshold relief. The MoR decision is the prevention and there is no cheap recovery. |
| Duplicate webhook fulfillment (v2.2) | **MEDIUM** | Reconcile against the provider's order list, revoke duplicates, apologize. Prevented by a unique constraint on event ID. |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1. Unqualified affiliate links → manual action | **LINK** | Render all pages; grep HTML: zero affiliate-domain anchors lacking `sponsored` |
| 2. Thin affiliation | **STACK-PAGE** | Every entry ≥100 words of first-hand reasoning in both locales; no merchant-copied text |
| 3. Site-reputation-abuse confusion | **DECIDE** | Roadmap contains no subdomain isolation and no `noindex` on revenue pages |
| 4. E-E-A-T / services-cluster dilution | **BASELINE** + **STACK-PAGE** + **GATE** | SC baseline captured pre-launch; stack page not in primary nav; each tool links to a case study or service; 30/60/90-day re-check scheduled |
| 5. Bilingual duplicate / hreflang breakage | **STACK-PAGE** | curl matrix over all locale/segment combinations: self-canonical, reciprocal hreflang, `x-default`; ES written not translated |
| 6. `/go/` × middleware × robots collision | **LINK** | `/es/go/*` and `/en/go/*` do not resolve; no `/api/redirects-lookup` hit on click; `Disallow: /go/` present; `/go/` absent from sitemap |
| 7. Amazon cloaking violation | **LINK** | Amazon links are direct with `tag=`; no `/go/` for Amazon; no `referrerPolicy`; store named in CTA |
| 8. 180-day window + commission math | **DECIDE** | Written account-status check + written revenue model in the phase output |
| 9. Price display without PA-API | **LINK** / **STACK-PAGE** | No `price` field in the schema; no price string rendered |
| 10. Non-localized affiliate fields | **LINK** | Field-localization matrix signed off pre-content; parity assertion `es.url` present and ≠ `en.url` |
| 11. Migration data loss | **LINK** | Schema frozen before seeding; every generated migration read; `DROP COLUMN` on populated tables → named approval + back-fill |
| 12. FTC disclosure placement | **LEGAL** → enforced in **LINK** | Disclosure precedes the first affiliate anchor in DOM order on every affected page; visible at 375px without scrolling; verbatim Amazon sentence present |
| 13. EU/Spain disclosure | **LEGAL** | ES disclosure natively written and above the fold; RD 444/2024 explicitly out of scope; article citations verified against BOE before publishing |
| 14. Consent-triggering tracking | **LEGAL** + **LINK** | Zero `document.cookie` / `localStorage` / identifier writes in the affiliate path; no third-party CMP; privacy policy updated |
| 15. EU VAT / merchant of record | **DECIDE** (blocking for **v2.2-PRODUCTS**) | Platform decision names a MoR; Peruvian contador consultation logged as a v2.2 prerequisite with an owner |
| 16. Email capture wrecks CWV | **EMAIL** (budgets set in **BASELINE**) | ≤5 KB added client JS; CLS delta 0.00; INP delta ≤10 ms; Lighthouse delta ≤3 pts across all 6 baseline routes |
| 17. Click-logging write amplification | **DECIDE** (prefer: don't build) or **LINK** | If built: `after()`-deferred, aggregate upsert, bot-filtered, rate-limited, retention policy defined |
| 18. `overrideAccess` draft leak | **LINK** + **STACK-PAGE** | Grep: every `payload.find(` carries `overrideAccess: false` or a documented exemption |
| 19. Webhook durability | **v2.2-PRODUCTS** | Raw-body signature verification; unique constraint on event ID; persist-then-ack; reconciliation job |
| 20. Store before audience | **DECIDE** | Phase order is EMAIL → STACK-PAGE → measure → products. No checkout phase in v2.1. |

---

## Corrections to Popular / Prior Advice

| Common advice | Status | What is actually true |
|---|---|---|
| "Use `rel="nofollow"` on affiliate links" | **Outdated but not wrong** | `rel="sponsored"` has been preferred since 2019; Google's page (updated 2025-12-10) still calls `nofollow` "an acceptable way to flag them." Emit `sponsored nofollow` and stop thinking about it. |
| "Always cloak affiliate links behind `/go/`" | **Wrong for Amazon** | Amazon Program Policies (2026-04-14) prohibit obscuring the referring site (explicitly "including by use of Redirecting Links") and link-shortening that makes the destination unclear. Direct links for Amazon; `/go/` is fine for other programs. |
| "Google penalizes affiliate sites" | **Wrong as stated** | Google penalizes *thin* affiliation. Its own policy says "Not every site that participates in an affiliate program is a thin affiliate." |
| "The site reputation abuse update killed affiliate content" | **Wrong for this site** | That policy targets **third-party** content on a host domain, is enforced by manual action only, and does not reach first-party reviews on your own site. |
| "Move affiliate content to a subdomain to protect the main site" | **Actively harmful** | Google's own remediation guidance warns that moving violating content to a subdomain/subdirectory "may appear to circumvent spam policies." And for compliant first-party content there is nothing to protect against — you would just be throwing away the domain authority that makes the page rank. |
| "Amazon FBA is a good next step" *(from the LLM transcript that inspired this milestone)* | **Out of scope and unrelated** | FBA is an inventory business with capital requirements, not a website feature. PROJECT.md already scopes it out; this research confirms that. |
| "Add banner placements" *(same transcript)* | **Wrong for this site** | Banners are the canonical thin-affiliation pattern, they are the worst-converting affiliate format for high-intent technical readers, and they add third-party JS to a site with a zero-regression CWV gate. |
| "The €10,000 EU VAT threshold means small sellers don't need to worry" | **Wrong for a Peru-based seller** | That threshold is available only to suppliers established in one EU Member State. Non-EU-established suppliers have **no threshold**. |
| "Stripe Tax handles VAT compliance" | **Misleading** | Stripe Tax *calculates* tax; standard Stripe leaves you as seller of record and therefore liable. Only a merchant of record (Lemon Squeezy, Paddle, Polar, Stripe Managed Payments) shifts the liability. |
| "Amazon closes your account after 180 days of no sales" | **Half right, commonly conflated** | The 180-day window applies to *applicants* — refer qualifying sales within 180 days of applying or the application is withdrawn. The separate dormancy clause in the Operating Agreement is *three years* of no substantial activity and concerns withholding accrued commission, not closure. |
| "You need a cookie banner if you have affiliate links" | **Wrong as stated** | A plain outbound link stores nothing on the user's device. Consent obligations attach to *your* tracking (cookies, identifiers, pixels — EDPB Guidelines 2/2023), not to the existence of a link. Design so no banner is needed. |
| "Build the store, then find customers" | **Backwards** | Email list → content with purchase intent → pre-sell → build. |

---

## Sources

**Primary sources fetched live on 2026-08-13** (official domains, quoted verbatim above — HIGH confidence):

- Google Search Central, *Qualify your outbound links to Google* — `developers.google.com/search/docs/crawling-indexing/qualify-outbound-links` — page last updated **2025-12-10 UTC**
- Google Search Central, *Spam policies for Google web search* — `developers.google.com/search/docs/essentials/spam-policies` — page last updated **2026-05-15 UTC** (site reputation abuse, link spam, scaled content abuse, thin affiliation)
- Google Search Console Help, *Manual Actions report* — `support.google.com/webmasters/answer/9044175` (full manual-action type list; "Unnatural links from your site"; "Thin content with little or no added value"; "Site reputation abuse" remediation guidance)
- Amazon Associates **Operating Agreement** — `affiliate-program.amazon.com/help/operating/agreement` — **Updated: October 15, 2025** (Section 5 required disclosure string)
- Amazon Associates **Program Policies / Participation Requirements** — `affiliate-program.amazon.com/help/operating/policies` — **Last updated: April 14, 2026** (cloaking/Redirecting Links clause; link-shortening clause; price display + Creators API/PA-API + timestamp disclaimer; solicited-email clause; 3-year dormancy clause)
- Amazon Associates Help, application/qualifying-sales window — `affiliate-program.amazon.com/help/node/topic/G7MJTPEP9NC3YKMG` (180-day rule)
- Amazon Associates Help, **Standard Commission Income Rates** — `affiliate-program.amazon.com/help/node/topic/GRXPHT8U84RAYDXZ` (PC/PC Components 2.50%; all other 4.00%; full table above). *No effective date is printed on Amazon's page — re-check before quoting rates publicly.*
- **16 CFR § 255.0** (FTC Endorsement Guides, "clear and conspicuous" definition) via Cornell LII — `law.cornell.edu/cfr/text/16/255.0`
- **16 CFR § 255.5** (Disclosure of material connections, **Example 11** = affiliate-link review blog) via Cornell LII — `law.cornell.edu/cfr/text/16/255.5`
- European Commission, **VAT One Stop Shop — register / declare and pay** — `vat-one-stop-shop.ec.europa.eu` (non-Union scheme eligibility for non-EU-established suppliers; quarterly returns)

**Secondary / synthesized (MEDIUM confidence — corroborated across multiple sources but not verbatim primary):**

- FTC business guidance on disclosure placement ("a footnote, behind an obscure hyperlink, or in a general ABOUT ME or INFORMATION page is not adequate"; "Paid link" adjacency) — FTC *Endorsement Guides: What People Are Asking* and *Disclosures 101 for Social Media Influencers* (both returned HTTP 403 to automated fetch; content corroborated via search results and the CFR text above)
- Site reputation abuse timeline: announced 2024-03-05, enforcement 2024-05-07, expanded 2024-11-19, docs updated 2025-01-21 — Google Search Central Blog + Search Engine Land / Search Engine Roundtable coverage
- EDPB **Guidelines 2/2023** on the technical scope of Art. 5(3) ePrivacy Directive (final version Oct 2024) — tracking URLs and pixels in scope
- €10,000 threshold restricted to EU-established suppliers, no threshold for non-established suppliers — corroborated across specialist VAT practices (Marosa, Taxually, 1stopVAT), consistent with the Commission's non-Union scheme definition
- Merchant-of-record landscape: Lemon Squeezy acquired by Stripe (July 2024) and still operating independently in 2026; Stripe Managed Payments announced February 2026, public preview as of April 2026, ~5% + $0.50
- Third-party script weights and CWV impact (empty GTM ≈ 28 KB, real containers 100–500 KB+, chat widgets 500 KB+; HTTP Archive 2024 identifying third-party scripts as the leading cause of poor INP) — performance-practitioner sources, MEDIUM
- Spain: **Real Decreto 444/2024** (2024-04-30) thresholds for "usuarios de especial relevancia" (€300k / 2M followers / 24 videos) — DLA Piper, Council of Europe/Merlin, Spanish practitioner analyses
- UCPD Annex I point 11 / Ley 3/1991 art. 26 / LSSI art. 20 article numbers — **MEDIUM, not re-verified verbatim from EUR-Lex/BOE in this pass.** The conclusion is HIGH; the citations should be checked against BOE before appearing on a public policy page.

**Project-internal (HIGH — read directly from this repo, 2026-08-13):**

- `.planning/PROJECT.md` — milestone scope, incident history, Key Decisions
- `src/middleware.ts` — matcher regex, loopback redirects-lookup architecture and its documented history
- `src/payload.config.ts` — UNPOOLED Neon connection string rationale, `push: false`, `localization` with `fallback: true`
- `src/app/robots.ts` — current `Disallow` list (`/admin`, `/api` only)
- `src/i18n/routing.ts` — `localePrefix: 'as-needed'`, `defaultLocale: 'es'`, `localeDetection: false`
- `src/lib/cache.ts` — `overrideAccess: false` convention and the T-43-02 / 43-REVIEW WR-01 security notes
- `src/lib/service-slugs.ts` — the pure-helper pattern for locale-varying URL segments, and the client-bundle-isolation rationale
- `src/migrations/20260712_202954_phase19_calltoaction_localized.ts` — the corrected back-fill-before-drop pattern from the production data-loss incident
- Root `CLAUDE.md` — Database Safety rule as relaxed on 2026-07-12

**Confidence-tier note for the roadmapper:** the `classify-confidence` seam returns `LOW` for the generic `webfetch`/`websearch` providers regardless of destination. The HIGH ratings above were assigned on the basis of the *source domain* (developers.google.com, support.google.com, affiliate-program.amazon.com, ec.europa.eu, law.cornell.edu) combined with verbatim quotation and a recorded last-updated date. Claims fetched from non-primary domains are marked MEDIUM. The one LOW item — Peruvian domestic tax treatment — is deliberately not asserted anywhere in this document.

---
*Pitfalls research for: monetizing an existing, already-ranking technical-SEO personal site (juan-tech.com, milestone v2.1)*
*Researched: 2026-08-13*
*Previous version archived at `.planning/research/PITFALLS.md.v1.9`*
