# Project Research Summary

**Project:** Juan Carlos Angulo — Portfolio (Payload rebuild) — milestone **v2.1 Monetización del Sitio**
**Domain:** Monetization layer (affiliate links, "Mi Stack" page, email capture, deferred digital store) on an existing, already-ranking Payload 3.85.2 + Next.js 15.4.11 bilingual site
**Researched:** 2026-08-13 · **Confidence:** MEDIUM-HIGH

## Executive Summary

The four researchers converged: **this milestone is content and schema work, not platform work, and it should add zero client-side JavaScript and zero new runtime dependencies beyond `resend`.** Affiliate links become a Payload collection (`affiliate-links`) rendered by a server component that emits `rel="sponsored nofollow noopener"` structurally (never an editable CMS field), with an internal `/go/[slug]` 302 for non-Amazon programs and click events written to an append-only Postgres table via `after()` from `next/server` — after the redirect is already sent. No Payload affiliate plugin exists (`payload-affiliate` 404s; Lasso/ThirstyAffiliates are WordPress-only). Every client tracker was rejected on measured weight: GA4's loader alone is 419,047 bytes, Stripe.js 284,912, while the server-side row costs 0.

**Two external constraints reshape the milestone.** **Stripe does not operate in Peru** — killing Stripe direct, Stripe Managed Payments, `@payloadcms/plugin-stripe` and `@payloadcms/plugin-ecommerce` in one move. **Polar** is the recommendation (MoR, Peru 🇵🇪 explicitly listed, ~5% + $0.50 + 1.5% non-US cards, built-in signed file delivery). This matters because a Peru-established seller gets **no €10,000 EU VAT threshold** — the non-Union OSS scheme owes destination VAT from sale one. MoR is non-negotiable, not an optimization. Products are deferred to v2.2 anyway, so the deliverable is the written decision plus an opened account. Second, **Amazon Program Policies (updated 2026-04-14) verbatim prohibit "Redirecting Links"** — Amazon links render direct and uncloaked with `tag=` visible; `/go/` is for every other program.

**Read the revenue math before scoping.** Amazon pays **2.50% on "PC & PC Components"** — the dominant category on a dev stack page. A $150 keyboard yields $3.75. Modeled at 1,000 stack-page views/month (2–5% link CTR × 2–5% purchase conversion in a 24-hour cookie): **0.5–2.5 purchases/month ≈ $2–$9/month**; at 10,000 views, $19–$94. Amazon here is a credibility artifact that pays for coffee, not a revenue strategy. The programs that pay — DinoRANK (10% recurring until cancellation, no traffic gate, real Lima-workshop credential), Kinsta (up to $500 + 10% lifetime), DigitalOcean (10%/12 months, "anyone can join") — are worth 10–50× per conversion. The tools Juan actually builds on (Cloudflare, Cloudinary, Resend, Payload, Neon, Cursor, Claude) pay **nothing**, and Ahrefs closed its program (404). Correct frame: build the mechanism correctly and cheaply now so monetization is in place when traffic grows, rather than retrofitted onto a ranking site later.

## Key Findings

### Recommended Stack

Almost nothing gets installed. Affiliate system, click logging and attribution are **zero new dependencies** — a collection, a Route Handler, and `after()` (stable since Next 15.1, confirmed at `node_modules/next/server.d.ts:16`). The only new v2.1 runtime dep is the raw `resend` SDK, needed for `contacts.create` (Audiences are not part of `@payloadcms/email-resend`).

- **Roll-your-own affiliate system in Payload** — smaller than the adoption cost, 0 KB client JS.
- **`resend@6.20.0`** — Automations and Topics (both new) close the old "transactional-only" gap; `{{{RESEND_UNSUBSCRIBE_URL}}}` means zero unsubscribe code. **Double opt-in is NOT built in** — budget ~1 day.
- **`@polar-sh/nextjs@0.9.6` + `@polar-sh/sdk@0.49.0`** (v2.2) — peer `next: ^15 || ^16`, hosted-checkout redirect (0 KB). **Do not** use `@polar-sh/checkout`; it peer-requires Stripe.js.
- **Postgres-native click logging** — exact first-party attribution, immune to ad blockers, which matters because this audience is the most ad-blocked demographic online.

**Rejected:** GA4/GTM, Lemon Squeezy (SDK frozen since 2024-11-05; its exit ramp is Stripe Managed Payments, which Peru cannot reach), Gumroad (~12.9% + $0.80 effective), `@payloadcms/plugin-ecommerce` (Beta, Stripe-only, no tax), any client-side affiliate tracker.

### Expected Features

**Must have:** bilingual disclosure block **above the first affiliate link** (FTC 16 CFR § 255.0(f); footer/About placement explicitly inadequate — and a **hard prerequisite of the Kinsta application**, so it blocks revenue); `rel="sponsored nofollow noopener"` emitted unconditionally from code including the Lexical path; `affiliate-links` collection as single source of truth; bilingual stack page as a `Pages` doc + `ToolStack` block; `/go/[slug]` 302 with `no-store`, **Amazon exempt**; inline email capture (Server Action + Resend), no popup; the verbatim Amazon string *"As an Amazon Associate I earn from qualifying purchases."*

**Should have:** a **"what I'd pick if I were starting today"** block (absent from all five stack pages studied — Wes Bos, Kent C. Dodds, Aleyda Solis ×2, uses.tech — and the natural home for the best-paying links without ordering the list by commission); **honest negatives** plus ≥1 prominent zero-commission recommendation (Screaming Frog pays nothing and should still win where right — that is what makes the paid picks believable); **Lighthouse/CWV scores on the page itself** (the `Websites` v1.9 collection already stores this shape); each tool cross-linked to the case study or service where it was used; the Spanish-market angle.

**Defer (v2.2+):** digital products — migration blueprint $49–99, **Next.js + Payload SEO reference implementation $79–199** (the genuinely uncopyable one), AEO/GEO template $29–59. A generic SEO checklist is commoditized to $0 (Aleyda gives an equivalent away ungated) — do not build it. Also defer checkout/webhooks/orders, and the Semrush + Hostinger-affiliate applications (both gated at ~1,000 monthly uniques).

**Never:** display ads, popups, guest/sponsored third-party posts, per-tool pricing tables, "best 25 tools" roundups, ordering by commission rate.

### Architecture Approach

Everything reuses a validated pattern. The stack page is a **view** over data → `Pages` + a block (the decision PROJECT.md marks ✓ Good for the v1.4 service landings); the tools are **data reused across surfaces** → a collection. Reads go through one `unstable_cache` fetcher with `overrideAccess: false` (Phase 43 pattern, and the fix for the twice-seen Phase 24 draft-leak class). Every new component is a Server Component; the email form is a plain `<form action={serverAction}>`, like `ContactFormBlockComponent`, which ships no client JS.

1. **`affiliate-links`** — no drafts (an `active` checkbox replaces the workflow and sidesteps the draft-leak class); internal `program`/`cookieWindowDays`/`commissionNote` gated by the existing `src/fields/targetKeyword.ts` field-access helper.
2. **`/go/[slug]`** — outside `[locale]`, Node runtime, `force-dynamic`, 302 + `no-store` + `X-Robots-Tag`; destination read **exclusively** from the admin-authored doc (never a `?to=` param — the open-redirect rule).
3. **`affiliate-clicks` append-only** — never `UPDATE ... clicks + 1` (row-lock contention makes the busiest link the slowest, and a counter cannot answer "which post drove this"). Written via `after()` with bot-UA/`Sec-Fetch-*` skipping and the existing per-IP `Map` throttle from `contact.ts`.
4. **`ToolStack` block + `AffiliateLink`/`AffiliateDisclosure` leaves** — `AffiliateLink` must be a **separate component, not a `CMSLink` wrapper**, because `CMSLink` emits `noreferrer` on `newTab`, and stripping Referer is exactly what Amazon prohibits. `richTextBlockConverters.tsx` has a documented circular-import/TDZ hazard: keep `AffiliateLink` a leaf.
5. **`subscribers` + `lead-magnets`** — Payload owns `pending → confirmed → unsubscribed` and the token; Resend only ever receives **confirmed** addresses. Delivery via Cloudinary `private_download_url` (15-min signed, `authenticated` raw) — `cloudinary@^2.10.0` already installed, and `og-image.ts` proves this account already stores raw/authenticated assets.

**Two do-not-forget instructions:** do **not** add `subscribers`/`affiliate-clicks`/`lead-magnets` to the `mcpPlugin` collections map (it exposes 10 collections; `subscribers` would leak emails over MCP), and do **not** add any of the four to `SITEMAP_COLLECTIONS`.

### Critical Pitfalls

1. **Unqualified affiliate links → "Unnatural links from your site" manual action.** Emit `rel` structurally; cover the Lexical path explicitly; assert in GATE by crawling rendered HTML. On a site whose value proposition is "I am a technical SEO expert," this is a credibility failure no recovery undoes.
2. **Thin affiliation.** Google's policy (2026-05-15) targets merchant-copied descriptions with buy buttons — and since HCU folded into core (March 2024) it is a **site-wide** signal that can drag `/services` down. ≥100 words of first-hand reasoning per entry **in both locales**, no merchant copy, no spec tables. Note the transcript that inspired this milestone recommended generic banners and product listings (thin affiliation almost verbatim) and Amazon FBA (not a website feature at all).
3. **E-E-A-T dilution of the services cluster.** **Do not put the stack page in the primary nav in v2.1** — link from the author page, relevant posts and the footer; reassess after 90 days. Capture a Search Console baseline before anything ships; it is the milestone's only real safety net.
4. **Localizing the affiliate destination.** Freeze the field-localization matrix **before any content exists** — retrofitting `localized: true` onto a populated column is the exact shape of the 2026-07-12 Phase 19 incident that `DROP COLUMN`'d the Home CTA copy in production.
5. **Amazon's 180-day qualifying-sales clock.** "Already active" does not distinguish approved-after-sales from applied-and-inside-the-window. Amazon does not reinstate rejected IDs.
6. **The consent-banner trap.** Design so no banner is ever needed: no GA4, no pixels, no per-user click IDs, no `document.cookie`/`localStorage` in the affiliate path. A plain `<a>` and an aggregate cookieless 302 sit outside ePrivacy Art. 5(3); a banner would become the worst CLS/INP contributor on a site already running a WebGL hero shader.

## Resolved Conflicts

**1. Amazon + `/go/` cloaking — direct links win.** Only PITFALLS.md quoted the primary source. Program Policies (2026-04-14): *"You will not cloak, hide, spoof, or otherwise obscure the URL of your Site containing Special Links (**including by use of Redirecting Links**) … such that we cannot reasonably determine the site … from which a customer clicks through."* ARCHITECTURE.md's "a first-party 302 preserving Referer survives this" is a vendor/community reading (Geniuslink, Lasso), not first-party. Downside is asymmetric: termination **plus forfeiture of accrued commissions**, on an account Juan already holds. **Ruling:** `program` is a collection field switching render behaviour, defaulted to *direct* for Amazon — direct `amazon.*` URL with `tag=` visible, `rel="sponsored nofollow noopener"`, `target="_blank"`, **no `referrerPolicy` override**, CTA naming the store ("Ver en Amazon"). Never a per-link judgement call. Lost click data is recovered free: **Amazon supports up to 100 tracking IDs** — one per page/section (`juantech-stack-20`, `juantech-blog-20`), read in Amazon's own reports. Zero code, zero DB writes, zero CWV cost, zero policy risk.

**2. `/go/` vs `src/middleware.ts` — CONFIRMED DEFECT.** ARCHITECTURE.md and PITFALLS.md found it **independently** from separate reads, which raises it from probable to confirmed. Current matcher:

```ts
export const config = { matcher: ['/', '/((?!api|admin|_next|_vercel|.*\\..*).*)'] }
```

`/go/notion` has no dot and is not `api`/`admin`/`_next`/`_vercel`, so it **is matched today** → a same-process loopback `fetch('/api/redirects-lookup')` (a Postgres round-trip on the deliberately **unpooled** Neon string) plus `createIntlMiddleware` rewriting to `/es/go/notion`, which does not exist. **Result: 404 on every affiliate click.** (This is also why `/sitemap.xml`, `/robots.txt`, `/llms.txt` work — they all contain a dot.) **Fix, one line:**

```ts
export const config = { matcher: ['/', '/((?!api|admin|go|_next|_vercel|.*\\..*).*)'] }
```

Plus `disallow: ['/admin', '/api', '/go']` in `src/app/robots.ts`. Do **not** rely on `noindex` as the primary control — robots.txt prevents Google ever seeing an `X-Robots-Tag`; the composing pair is `Disallow: /go` **plus** `rel="sponsored nofollow"` on every anchor. Highest-risk single change in the milestone: isolate it, curl-verify against `/`, `/en`, `/servicios`, `/en/services`, `/blog` (the Phase 19 habit), and ship it **before any UI emits a `/go/` href**.

**3. Phase ordering — one order, with a named flip condition.** PITFALLS.md argues EMAIL → STACK-PAGE on audience-compounding grounds while noting a live Amazon clock would force the opposite; ARCHITECTURE.md proposes data → route → baseline → stack → inline → email. **Ruling — recommended order:**

> BASELINE → DECIDE → LEGAL → LINK-SCHEMA → GO-ROUTE → STACK-PAGE → LEXICAL-INLINE → EMAIL → GATE

PITFALLS.md's EMAIL-first case is right about *value* and wrong about *feasibility here*: `RESEND_API_KEY` is still a placeholder (the credential already blocking Phase 6), and EMAIL's real blocker is **content Juan must write** (the lead magnet), not code. Sequencing an externally-blocked phase first stalls the milestone; the affiliate track has **zero external dependencies**. **Open question that could flip it:** if DECIDE finds the 180-day clock running, STACK-PAGE becomes deadline-driven with no slack — which the recommended order already gives it. If the account is fully approved with no clock, EMAIL can be pulled forward in parallel the moment a real key exists (ARCHITECTURE.md confirms it is independent of the affiliate phases). Either way the order holds; only urgency changes.

**4. Payments — Stripe's Peru absence is decisive.** Verified against `stripe.com/global`: Peru absent from ~50 supported countries (Brazil and Mexico are the only LATAM entries). That eliminates Stripe direct, Stripe Managed Payments (US-first, **3.5% MoR surcharge on top of standard fees** → ~6.4% + $0.30 domestic), `plugin-stripe` and `plugin-ecommerce` (Stripe-only adapter). **Polar** wins — Peru and Spain both listed (cross-verified from two Polar URLs), MoR ("we take on the liability for international sales taxes"), 5% + $0.50 + 1.5% non-US, **built-in file delivery** (10 GB/file, signed per-customer URLs, SHA-256) so no download endpoint is ever written. It reaches Peru because it pays out via Stripe Connect Express (~150 countries), not Stripe merchant accounts (~50). PITFALLS.md's VAT finding makes MoR **mandatory rather than convenient**: the €10,000 threshold applies **only to EU-established suppliers**; the non-Union OSS scheme has **no de-minimis**, so a €29 checklist sold to one consumer in Madrid owes 21% Spanish VAT from sale one, with quarterly filings and two pieces of non-contradictory location evidence per buyer. **None of this ships in v2.1** — write the decision down, open the account, write zero code.

**5. Localizing the affiliate URL — not localized; marketplace-keyed instead.** ARCHITECTURE.md: don't localize (Payload localization is keyed to *content locale*, affiliate variance is *geographic* — an ES-reading visitor in Miami would be sent to amazon.es and lose the commission — and `/go/[slug]` has no locale in scope). PITFALLS.md Pitfall 10: you must, or every ES visitor hits a US storefront with a US tag and you see **zero ES revenue with no error anywhere**. They converge on the same implementation — Pitfall 10's own prescription is a **non-localized array keyed by an explicit `marketplace` field**, resolved at render time, which is exactly ARCHITECTURE.md's `regionalUrls`. **Ruling:** `affiliateUrl` is **not** localized; per-market destinations live in a non-localized `marketplace`-keyed array resolved by one pure `pickDestination()` in `src/lib/affiliate.ts` (the `service-slugs.ts` pattern). Adding the array later is `CREATE TABLE`; localizing a populated column later is the `DROP COLUMN`-with-backfill reshape that caused Phase 19. **PITFALLS.md's parity assertion still applies in GATE:** both locales resolve to a non-empty destination, and the ES destination is not accidentally identical to EN. Localized (prose only): `tagline`, `whyIUseIt`, `disclosureOverride`, `ctaLabel`. Not localized: `name`, `slug`, `category` (enum — the human label lives in `messages/{es,en}.json`, the structural fix for the `CaseStudies.services[].service` bug), `active`, and `rel` (not a field at all).

## Implications for Roadmap

**Phase 1 — BASELINE.** Nothing rendered changes before this. Extends the REG-01/REG-02 pattern from v1.7. Delivers Lighthouse/CWV + H1/JSON-LD + canonical/hreflang snapshot **plus a Search Console snapshot** (4 service landings, 2 geo landings, Home, both locales). Avoids Pitfall 4 — without it you can never separate "the affiliate section hurt `/services`" from seasonality.

**Phase 2 — DECIDE.** Three external lookups reshape everything. (a) Amazon dashboard: is the 180-day clock running? (b) Revenue math written out (`V × 0.0005–0.0025`; $2–$9/month at V=1,000). (c) Payments recorded: **Polar, MoR, deferred to v2.2**, account opened, no code. (d) Kill the wrong mitigations explicitly: no affiliate subdomain, no `noindex` on revenue pages, no cookie banner, no Amazon FBA. Avoids Pitfalls 3, 8, 15, 20.

**Phase 3 — LEGAL.** Must precede the Kinsta application and any rendered affiliate link. `AffiliateDisclosure` with copy in `messages/{es,en}.json` (never CMS body copy — a translation in code cannot be half-filled), above the first affiliate link; the verbatim Amazon string; `/privacy` updated for the email form, Resend as processor, retention, unsubscribe; the written constraint "no consent-triggering tracking in v2.1." RD 444/2024 thresholds are €300k/2M followers — **it does not apply, do not scope it.**

**Phase 4 — LINK-SCHEMA.** Everything downstream needs a slug, and this is the only phase touching production schema, so the SQL can be read in isolation. `affiliate-links` with the **localization matrix frozen and signed off before any content exists**, `getCachedAffiliateLinks()` (`overrideAccess: false`), cache tags + revalidate hooks, pure `src/lib/affiliate.ts`, one purely-additive migration. No `price` field ever. No `rel` field ever.

**Phase 5 — GO-ROUTE.** Route handler, the one-line matcher edit, `Disallow: /go`, `affiliate-clicks` with bot skipping and the per-IP throttle. Verify: curl matrix against control routes; assert `/api/redirects-lookup` is not hit on a `/go/` request.

**Phase 6 — STACK-PAGE.** `ToolStack` block, `/stack` + `/en/stack` as a `Pages` doc, `AffiliateLink`, links from **footer and author page, not primary nav**, the "starting today" block, honest negatives, ≥1 zero-commission pick, cross-links to case studies/services, terminal CTA to existing services, optional `ItemList`/`SoftwareApplication` JSON-LD. **URL: single shared `/stack` for both locales** — ARCHITECTURE.md and PITFALLS.md agree independently; the dual segment cost four modules for Services (`buildServiceAlternates`, `normalizeServiceHref`, `SERVICE_SEGMENTS`, a `sitemap-data.ts` special case), and `normalizeServiceHref()` exists *only* to paper over the non-localized `Header.navItems.url` bug. Single segment ⇒ `/stack` is verbatim-correct in both locales and `sitemap-data.ts`/`canonical.ts`/`breadcrumbs.ts` need **zero changes**. Acceptance criteria: owned-experience evidence ≥100 words per entry per locale, plus the curl matrix (self-canonical, reciprocal hreflang, `x-default`).

**Phase 7 — LEXICAL-INLINE.** Zero migration (data lives in the existing `posts_locales.content` jsonb) so it blocks nothing and can slip. Inline block, the `Posts` `BlocksFeature({ inlineBlocks })` change, the converter, and automatic disclosure injection via the pure `hasAffiliateLinks(editorState)` scan (no extra query). Watch the circular-import/TDZ hazard and the unverified relationship-population-at-`depth: 1` question — resolve through `getCachedAffiliateLinks` and **never emit `/go/undefined`**.

**Phase 8 — EMAIL.** Independent of 4–7; last only because it is externally blocked. `subscribers` + `lead-magnets`, `subscribe.ts` (clone of `contact.ts`: honeypot `company_website`, per-IP `Map`, regex), hand-rolled double opt-in (Resend has none), `/{locale}/newsletter/confirm` as a **page inside `[locale]`** with `robots: { index: false }` (so no middleware change — only `/go` gets to leave the locale tree), `secure-download.ts` + `download-token.ts` as separate helpers so v2.2's store is an addition not a rebuild, inline `EmailCapture` block, the `resend` dep. No third-party popup or email SDK; server-rendered inline ⇒ zero CLS. Double opt-in also satisfies Amazon's solicited-email rule. **Cost note:** Resend bills **marketing contacts separately** — free to 1,000, then $40/month for 5,000, on top of $20/month transactional Pro; the free tier's **100 emails/day hard cap** is shared with contact-form mail and bites first.

**Phase 9 — GATE.** Parity vs BASELINE (no >5pt perf drop, no CWV band crossing, ≤5 KB added client JS, CLS delta 0.00, INP delta ≤10 ms) plus four milestone-specific assertions: zero affiliate-domain anchors lacking `sponsored`; disclosure precedes the first affiliate anchor in DOM order; locale-parity on every destination; grep that every `payload.find(` carries `overrideAccess: false` or a documented exemption. Follow-up: 30/60/90-day Search Console re-check.

**Program applications (admin work, alongside):** **DinoRANK** → **DigitalOcean** → **Kinsta** (blocked until the Phase 3 disclosure is live). Hold **Semrush** and **Hostinger-affiliate** until 1,000 monthly uniques is confirmed — premature rejection may be hard to reverse. Hostinger's **Referral** program (no traffic minimum) is the honest substitute meanwhile.

**Ordering rationale:** schema → routes → UI (everything needs a slug; the migration must be readable in isolation against production Neon); the middleware fix is isolated because it is one line with site-wide blast radius and shipping UI first means every affiliate link 404s; BASELINE precedes the first *rendered* change; EMAIL is last on feasibility not value; products are absent entirely, because building a store before a product, a subscriber or a piece of commercial content is the documented #1 way this milestone fails.

### Research Flags

**Needs research:** DECIDE (Amazon account status is external and unknown; Polar's Peru KYC / Stripe Connect Express onboarding unwalked) · LEXICAL-INLINE (relationship population at `depth: 1` unverified against 3.85.2 in this repo) · EMAIL (Resend's `broadcasts.create` now takes **`segment_id`, not `audience_id`** — any pre-2026 memory is wrong; confirm `audienceId` casing against the installed SDK) · v2.2-PRODUCTS (Polar webhook idempotency; Peruvian domestic tax, explicitly not researched).

**Standard patterns:** BASELINE and GATE (REG-01/REG-02 established in v1.7) · LINK-SCHEMA and STACK-PAGE (direct precedent in v1.4 service landings and the v1.9 `Websites` collection; every file needing change has been read) · GO-ROUTE (defect and fix confirmed — the work is verification, not discovery).

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | **HIGH** | Versions re-verified live against registry.npmjs.org 2026-08-13; every KB figure measured with `curl`, not quoted. MEDIUM only on vendor fee tables. |
| Features | **MEDIUM** | Every affiliate row fetched from the vendor's own page, tagged PRIMARY / PRIMARY-PARTIAL / SECONDARY / ABSENCE-VERIFIED. Absence verifications (Ahrefs 404, Screaming Frog, Cloudflare, Resend, DataForSEO) are reliable enough to exclude. Conversion benchmarks are SECONDARY, directional only. |
| Architecture | **HIGH** | Direct reads of `middleware.ts`, `payload.config.ts`, `lib/*`, `collections/*`, `blocks/*`, `actions/contact.ts`, `migrations/*`, `package.json`. MEDIUM on exactly two flagged items. |
| Pitfalls | **HIGH on policy, MEDIUM on math** | Google spam policies (2026-05-15), link qualification (2025-12-10), Amazon Program Policies (2026-04-14), Operating Agreement §5 (2025-10-15), FTC 16 CFR § 255.0(f) and § 255.5 Ex. 11, EDPB Guidelines 2/2023, EU VAT non-Union OSS — all quoted verbatim with dates. Revenue math is parametric, not measured. Peruvian tax **explicitly unverified and flagged, not asserted**. |

**Overall:** MEDIUM-HIGH — high enough to roadmap and build; the open questions are lookups and decisions, not research gaps.

### Gaps to Address

- **Amazon account status / 180-day clock** — "already active" is ambiguous; Amazon does not reinstate rejected IDs. *First action of DECIDE. If the clock is live, STACK-PAGE becomes deadline-driven.*
- **Juan's real current traffic** — Semrush and Hostinger-affiliate gate at ~1,000 monthly uniques, and the revenue model is parameterized on `V`. Nobody has stated the number. *Pull from Search Console during BASELINE.*
- **Juan's tax residency / entity status** — Peru-only is assumed and makes Polar the only viable MoR. A Spanish/EU entity reopens Stripe *technically*, but MoR still wins on tax grounds. *One direct question in DECIDE; a confirmation, not a blocker.*
- **`RESEND_API_KEY` is still a placeholder** — the credential already blocking Phase 6; EMAIL depends on it entirely. *Build behind the existing env-gate pattern (`hasCloudinaryCreds`) so local dev degrades cleanly — still confirm the subscriber and deliver the magnet when `RESEND_AUDIENCE_ID` is absent — and get a real key before EMAIL starts.*
- **ES URL segment for the stack page** — single shared `/stack` recommended on strong codebase evidence; only real ES keyword data overturns it. *If it flips, reuse the `SERVICE_SLUGS`/`buildServiceHref` pattern verbatim and re-verify all four URL combinations by curl. Do not pre-build it.*
- **Gumroad's Peru payout status** — genuinely unresolved, changes nothing (Gumroad loses on fees and integration regardless).
- **Spanish UCPD/LCD/LSSI article numbers** — not re-fetched from EUR-Lex/BOE. Conclusion HIGH, article numbers MEDIUM. *Verify against BOE before quoting on a public policy page.*

## Sources

**Primary (HIGH):** direct repo reads (`middleware.ts`, `payload.config.ts`, `lib/{cache,cache-tags,sitemap-data,canonical,breadcrumbs,service-slugs,og-image}.ts`, `collections/*`, `blocks/*`, `components/{CMSLink,richTextBlockConverters}.tsx`, `actions/contact.ts`, `robots.ts`, `migrations/*`, `package.json`, `.planning/PROJECT.md`) · live npm queries 2026-08-13 · first-hand `curl` weight measurements · Google spam policies (2026-05-15) and link-qualification guidance (2025-12-10) · Amazon Program Policies (2026-04-14) and Operating Agreement §5 (2025-10-15) + rate card · FTC 16 CFR § 255.0(f), § 255.5 Ex. 11 · EDPB Guidelines 2/2023 · EC VAT One Stop Shop (non-Union scheme) · vendor pages fetched directly (polar.sh ×3, stripe.com/global, resend.com/pricing, payloadcms.com/docs/ecommerce, plus dinorank/kinsta/digitalocean/seranking/semrush/hostinger/surferseo/vercel).

**Secondary (MEDIUM):** Context7 `/websites/resend` and `/websites/polar_sh` · Lemon Squeezy 2026 status (vendor blog 403; corroborated by search summaries plus the verified 21-month SDK freeze) · Stripe Managed Payments surcharge (third-party analyses) · Amazon cloaking community reading (treated as HIGH risk anyway) · the five stack pages read directly · Gumroad/Paddle Peru status (unconfirmed, not load-bearing).

**Tertiary (LOW):** popup-vs-inline conversion benchmarks (no published methodology; the decision does not depend on them) · digital product price bands · **Peruvian domestic tax treatment — explicitly not researched.** A MoR removes the foreign VAT obligation, not the domestic income tax one; consult a Peruvian contador before the first sale (a v2.2 prerequisite with a named owner).

---
*Research completed: 2026-08-13 · Ready for roadmap: yes*
