# Stack Research — Monetización (v2.1)

**Domain:** Monetization layer (affiliate links, digital products, email capture, conversion attribution) on an existing Payload 3.85.2 + Next.js 15.4.11 self-hosted bilingual portfolio/blog
**Researched:** 2026-08-13 (every version below re-verified live against `registry.npmjs.org` and vendor docs on this date)
**Confidence:** HIGH on versions and platform eligibility, MEDIUM on fee tables (vendor pages change without notice)

---

## The One Finding That Drives Everything

**Stripe does not operate in Peru.** Stripe's own availability page lists ~50 countries; in Latin America only Brazil and Mexico appear. Peru is absent.

That single fact removes the entire Stripe branch of this decision tree in one move:

- Stripe direct — cannot open a merchant account from Peru
- Stripe Managed Payments (the new merchant-of-record product born from the Lemon Squeezy acquisition) — requires a Stripe account, and is rolling out US-first
- `@payloadcms/plugin-stripe` — Stripe-only, so unusable
- `@payloadcms/plugin-ecommerce` — ships Stripe as its only payment adapter, so unusable out of the box

Everything downstream follows from this. The payment recommendation is **Polar**, which explicitly lists Peru (🇵🇪) and Spain (🇪🇸) as supported seller/payout countries and acts as merchant of record.

> **Decision point for Juan, needed before the roadmap freezes:** does he hold a Spanish (or other EU) tax residency / entity he would actually invoice through? The site frames Madrid as remote work with no physical office, which reads as Peru-based. If a real Spanish entity exists, Stripe direct + `@payloadcms/plugin-ecommerce` reopens — but he then personally owes EU VAT MOSS registration and filing, which is exactly the tax infrastructure he does not have. Even in that case Polar remains the recommendation on tax grounds alone. Treat the Peru answer as the default and the Spain question as a confirmation, not a blocker.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Roll-your-own affiliate system in Payload** | n/a (no dependency) | `AffiliateLinks` collection + `/go/[slug]` Route Handler + `AffiliateClicks` collection | No Payload affiliate plugin exists — `payload-affiliate` is a 404 on npm, and an npm search for affiliate/link-cloaking packages returns only WordPress-adjacent or Astro-specific tools. The whole feature is roughly one collection, one route handler and one insert. Building it in Payload costs less than adopting anything else and adds **0 KB** of client JavaScript, which is the only version of this that respects the project's core value. |
| `@polar-sh/nextjs` | **0.9.6** (published 2026-05-06) | Polar checkout / webhook / customer-portal Route Handler adapters for the App Router | Merchant of record covering Peru. `peerDependencies` is `next: ^15.0.0 \|\| ^16.0.0` — a clean match for the installed `next@15.4.11`. Gives `Checkout()`, `Webhooks()` and `CustomerPortal()` as one-liner Route Handlers, all Node runtime, no Vercel primitives. |
| `@polar-sh/sdk` | **0.49.0** (published 2026-07-27) | Typed Polar API client for server-side product/order/customer reads | Actively maintained (~256k weekly downloads). Pulled transitively by `@polar-sh/nextjs` at `^0.47.0`; installing 0.49.0 explicitly is compatible and gets the current API surface. Only `zod` and `standardwebhooks` as deps — small footprint. |
| `resend` | **6.20.0** (published 2026-08-13, same day as this research) | Newsletter + lead-magnet delivery: Audiences, Contacts, Broadcasts, Automations, Topics | Already in the project as a transitive dep of `@payloadcms/email-resend@3.85.2`, and Juan has explicitly ruled out a second email vendor. Since the last time this project looked, Resend has shipped **Automations** (real drip sequences), **Topics** (granular subscription preferences) and **Segments** — it is now a credible newsletter tool, not just a transactional relay. |
| **Postgres-native click/conversion logging** | n/a (uses installed `@payloadcms/db-postgres@3.85.2`) | Attribution: which post drove which affiliate click and which signup | The `/go/` redirect is already a server round-trip, so tracking is free — write the row server-side and ship nothing to the browser. Measured cost: **0 bytes** of client JS versus 1,283 bytes for Plausible and 419,047 bytes for the GA4 loader alone. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `after` from `next/server` | built into `next@15.4.11` | Write the click row *after* the 307 has already been sent to the user | Use in the `/go/[slug]` handler so the Postgres insert never sits in the redirect's critical path. Stable public API since Next 15.1 (`import { after } from 'next/server'`) — no `unstable_` prefix, no extra dependency. This is the single most important perf detail in the affiliate feature. |
| `nanoid` | **6.0.1** (published 2026-08-07) | Opaque, unguessable tokens for double opt-in confirmation links and one-time download links | Only if you decide to host lead-magnet files yourself. `crypto.randomUUID()` from Node core covers the same need with zero dependencies — prefer that unless you specifically want short URL-safe IDs. Listed for completeness, not as a recommendation. |
| `ua-parser-js` | **2.0.10** (published 2026-05-21) | Device/browser breakdown on click rows | **Defer.** Storing the raw `user-agent` string plus the `referer` in the click row gives you 90% of the insight with zero dependencies. Only add this if the click data actually gets read often enough to justify parsing. Note: v2 changed to a dual AGPL/commercial license — check before shipping. |
| `@polar-sh/checkout` | **0.4.1** (published 2026-08-11) | Embedded (in-page) Polar checkout | **Do not use for this project.** Its `peerDependencies` require `@stripe/stripe-js` and `@stripe/react-stripe-js`, which load `js.stripe.com/v3` — **measured live at 284,912 bytes (~278 KB)**. Use the hosted-checkout redirect via `@polar-sh/nextjs` `Checkout()` instead: the user leaves the site, so the cost to your Core Web Vitals is exactly zero. (For reference, Polar's own embed shim is only 2,633 bytes — but it is the Stripe.js peer that sinks it.) |
| Umami (self-hosted) | v3 line, Docker + Postgres | Optional site-wide pageview analytics | Only if Juan wants full pageview analytics beyond conversion events. **Measured live: 2,301 bytes.** Self-hosting is free and MIT-licensed; it needs its own Postgres (v3 dropped MySQL) and ~512 MB–1 GB RAM, which the Hostinger Node box may or may not have spare. Cloud free tier is 100k events/month, 3 sites, 6-month retention. |
| Plausible | script v0.4.x line | Optional site-wide pageview analytics (hosted alternative) | **Measured live: 1,283 bytes** for `script.js`; 1,706 bytes for the `file-downloads.outbound-links` variant. The lightest hosted option that exists, and the outbound-links variant would auto-track affiliate clicks — but that variant is client-side and therefore redundant once `/go/` logs server-side. Paid from day one (no free tier). |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `payload migrate:create` → commit → `payload migrate` | Schema for `AffiliateLinks`, `AffiliateClicks`, `Products`, `Subscribers` | Every monetization table is **purely additive** (`CREATE TABLE` only, no column reshapes), so under the project's Database Safety rule these run without pausing for confirmation. Read the generated SQL anyway before applying. |
| `payload generate:types` | Regenerate `payload-types.ts` after each new collection | Required after every schema change; the click-logging code should be typed against the generated `AffiliateClick` type, not hand-written interfaces. |
| Polar **sandbox** server | End-to-end checkout + webhook testing without real money | `@polar-sh/nextjs` takes `server: 'sandbox' \| 'production'` on every adapter. Gate it on an env var so local dev never touches the live store, mirroring the existing env-gated Cloudinary/Resend pattern. |
| Resend **Audiences** in the dashboard | One audience for the newsletter, Topics for EN vs ES | Create the audience and topics by hand once; the app only ever calls `contacts.create` / `contacts.update`. Avoid provisioning audiences from code. |
| `curl -sL --compressed -w '%{size_download}'` | Verify any third-party script's real weight before it ships | This is how every KB number in this document was produced. Make it the gate for any future client-side addition. |

## Installation

```bash
# Payments — Polar as merchant of record
npm install @polar-sh/nextjs@0.9.6 @polar-sh/sdk@0.49.0

# Email — pin the SDK explicitly; today it only arrives transitively
# via @payloadcms/email-resend, which is not a contract you control
npm install resend@6.20.0

# Affiliate links, click tracking and attribution: NOTHING TO INSTALL.
# Payload collections + a Route Handler + `after` from next/server.
```

Environment variables to add (all env-gated, same pattern the project already uses for Cloudinary and Resend, so local dev works without credentials):

```
POLAR_ACCESS_TOKEN=
POLAR_WEBHOOK_SECRET=
POLAR_SERVER=sandbox        # 'production' in prod
POLAR_SUCCESS_URL=
RESEND_AUDIENCE_ID=
```

Note the pre-existing project blocker: `RESEND_API_KEY` is still a placeholder. The entire email-capture feature is gated behind Juan providing a real key — the same dependency that has Phase 6 paused.

---

## Section-by-Section Findings

### 1. Affiliate link management — build it, do not buy it

**Verdict: roll your own inside Payload. There is nothing worth adopting.**

What was checked live on npm: `payload-affiliate` (404), a search for `payload affiliate` (returns only unrelated `@payloadcms/*` core packages), and a search for `affiliate link cloaking` (returns `astro-recommends`, a browser-extension tool, and an e-com.plus WordPress-lineage app — nothing usable). Lasso and ThirstyAffiliates, the two tools the question named, are **WordPress plugins**; there is no Next.js or Payload equivalent, and their SaaS tiers are priced for WordPress affiliate sites, not a single "Mi Stack" page.

The shape of the build:

| Piece | Implementation |
|-------|----------------|
| `AffiliateLinks` collection | `slug` (unique, not localized), `merchant`, `targetUrl` (localized — Amazon has per-locale storefronts, so ES and EN visitors need different destinations), `program` (select: amazon / other), `active`, optional `notes`. Localize `targetUrl` from day one. |
| `/go/[slug]/route.ts` | Node runtime Route Handler. Look up the slug via the Payload **Local API** (no HTTP hop, no auth round-trip), then `NextResponse.redirect(target, 307)`. Add `export const dynamic = 'force-dynamic'` and `Cache-Control: no-store` so the redirect is never cached — a cached affiliate redirect silently kills your click data. |
| Click logging | Inside the handler, `after(() => payload.create({ collection: 'affiliate-clicks', data: {...} }))`. The user is already gone by the time Postgres is touched. Store: `linkId`, `referer`, `locale`, `userAgent`, `createdAt`. |
| Rendering | A Lexical/JSX link component that emits `rel="sponsored nofollow noopener"` and `target="_blank"`, plus an automatic disclosure banner on any page containing at least one affiliate link. `rel="sponsored"` is a Google requirement, not a nicety. |

**Amazon Associates is the exception, and it is a real trap.** Amazon's Operating Agreement prohibits cloaking, hiding, spoofing "or otherwise obscuring the URL of your site containing affiliate links (including by use of redirecting links) in a way that prevents Amazon from reasonably determining the site from which a customer clicks through." Community reading (Geniuslink, Lasso's own help center) is that a same-domain 302/307 to the full Amazon URL with the tracking tag intact is tolerated, and that what actually gets accounts banned is third-party masking services and stripped tags. Since Juan's Amazon Associates account is *already active* and is the one program he cannot re-apply to easily, the risk-adjusted call is:

> **Amazon links: render direct, uncloaked, with the tag visible. Non-Amazon programs: route through `/go/{slug}`.**

You lose click tracking on Amazon specifically, which Amazon's own dashboard already provides. That is a fair trade against an account termination that also forfeits accrued earnings. Model this as a `program` field on the collection that switches rendering behaviour — do not make it a per-link judgement call.

**Client-side script weight for this entire feature: 0 KB.** No listener, no beacon, no pixel. The redirect *is* the tracking event.

### 2. Digital products and payments — Polar, and it is not close

| Platform | MoR? | Who owes EU/UK VAT + US sales tax | Fees (verified 2026-08-13) | Peru seller? | Payload/Next integration | Verdict |
|----------|------|-------------------------------|---------------------------|--------------|--------------------------|---------|
| **Polar** | **Yes** — "As your Merchant of Record we take on the liability for international sales taxes" | **Polar** | Starter (free plan) **5% + $0.50**; Pro $20/mo → 3.8% + $0.40; Growth $100/mo → 3.6% + $0.35; Scale $400/mo → 3.4% + $0.30. **+1.5% on non-US cards**, **$15 per dispute**. Payouts via Stripe Connect: $2/mo active payout fee, 0.25% + $0.25 per payout, 0.25–1% cross-border FX. Orgs created before 2026-05-27 keep a legacy 4% + $0.40 rate (does not apply to a new signup) | **Yes** — Peru 🇵🇪 explicitly listed | `@polar-sh/nextjs@0.9.6`, no Payload plugin — Payload holds product *content*, Polar holds product *commerce*. **File delivery is built in**: up to 10 GB per file, per-customer signed URLs, SHA-256 checksums — you write zero secure-download code | **RECOMMENDED** |
| Stripe (direct) | No — you are the merchant | **You**, personally. EU VAT MOSS registration, UK VAT, US economic-nexus tracking, all on an individual | 2.9% + $0.30 US baseline | **No — Peru not supported** | `@payloadcms/plugin-stripe@3.85.2` exists and pins `payload: 3.85.2` exactly, so it would install cleanly. Irrelevant given eligibility | **BLOCKED** (eligibility) — and the tax burden alone would disqualify it |
| Stripe Managed Payments | Yes | Stripe | **+3.5% MoR surcharge on top of standard Stripe fees** → ~6.4% + $0.30 domestic US, past 8–10% on international cards with FX | **No** — requires a Stripe account; rolling out US-first | Same as Stripe | **BLOCKED** — and the most expensive MoR on the market |
| Lemon Squeezy | Yes | Lemon Squeezy | ~5% + $0.50 | Historically broad | `@lemonsqueezy/lemonsqueezy.js` is at **4.0.0, last published 2024-11-05** — 21 months with no release | **DO NOT ADOPT** (see below) |
| Gumroad | Yes (became MoR 2025-01-01) | Gumroad | **10% + $0.50 flat, plus 2.9% + $0.30 processing → ~12.9% + $0.80 effective.** 30% via Discover marketplace | Unclear — Gumroad has stopped PayPal payouts and moved to direct bank transfer with a country-by-country list; Peru not confirmed in their published list | Fully hosted only. You would be linking out to a Gumroad page, not integrating | **NO** — roughly 2.5× Polar's rate for a worse integration story |
| Paddle | Yes | Paddle | ~5% + $0.50 | Pays out "anywhere except sanctioned countries", accepts Individual/sole trader without incorporation | SaaS/subscription-oriented; heavy manual account review | **NO** — approval is discretionary and slow, and the product is aimed at software subscriptions, not $19 checklists |

**On Lemon Squeezy specifically (the item flagged as most likely to be stale in training data) — here is the verified 2026 status:**

Lemon Squeezy was acquired by Stripe in July 2024. As of the platform's own 2026 update, **new signups are still open and existing stores are unaffected** — the wording is "no changes or action needed." So the naive answer "it shut down" is **wrong**.

But it is still the wrong choice for a new seller in August 2026, for three converging reasons:

1. The stated long-term direction is **convergence into Stripe Managed Payments**. Stripe is preparing public (non-invite) access to SMP specifically so Lemon Squeezy merchants have "an easy way to migrate."
2. The JavaScript SDK has been **frozen since 2024-11-05**. Twenty-one months without a release on the package you would build your integration against.
3. The destination of that migration path — Stripe Managed Payments — **is not available to a Peru-based seller anyway**. You would be onboarding onto a platform whose announced exit ramp leads somewhere Juan cannot follow.

Adopting it means building an integration you already know you will have to rebuild. Skip it.

**Why the Payload ecommerce plugins do not apply.** `@payloadcms/plugin-ecommerce@3.85.2` genuinely exists (matching the project's Payload version exactly, peers on React 19 which is satisfied) and adds Products, Variants, Carts, Orders, Transactions, Addresses and Customers. It is, however, **explicitly labelled Beta with expected breaking changes**, it ships **Stripe as its only payment adapter**, and its docs state it does not handle taxes. It does expose a `PaymentAdapter` interface, so a Polar adapter is *writable* — but that is inventing and then maintaining an unreleased integration in order to get a cart the site does not need. Two or three downloadable products do not need a cart, variants, or addresses.

Also worth flagging even in the counterfactual: `@payloadcms/plugin-stripe` bundles `stripe: ^10.2.0` as a dependency while the standalone Stripe SDK is at **22.5.0**. That is twelve major versions behind.

**Recommended architecture instead:** Payload owns a lightweight `Products` collection (title, slug, localized description, cover image via the existing Cloudinary pipeline, price display, and a `polarProductId` string). Polar owns checkout, tax and file delivery. A `Webhooks()` Route Handler receives `order.paid` and does two things: write an `Orders` row for Juan's own records, and add the buyer to the Resend audience. **You never build a download endpoint, never sign a URL, never touch a tax table.**

At ~5% + $0.50 + 1.5% international on a $29 product, Polar's cut is roughly $2.40 — and it includes the thing an individual seller genuinely cannot build, which is global tax remittance.

### 3. Email capture on Resend — viable now, with two honest gaps

Verified live via Context7 against Resend's current API reference and pricing page. The SDK is **`resend@6.20.0`**, published 2026-08-13.

What Resend actually supports today:

| Capability | Status | API surface |
|------------|--------|-------------|
| Audiences | Yes | `resend.audiences.create/list/get/remove` |
| Contacts | Yes | `resend.contacts.create/update/get/list/remove` — key field is `unsubscribed: boolean` |
| Broadcasts | Yes | `resend.broadcasts.create({ segmentId, from, subject, html, send?, scheduledAt?, topicId? })`. **Note the parameter is now `segment_id`, not `audience_id`** — older tutorials and any pre-2026 memory of this API are wrong |
| **Automations (drip sequences)** | **Yes — this is new** | `resend.automations.create({ name, status, steps, connections })` with a step graph: `trigger` → `send_email`. Free and Pro tiers include **10,000 automation runs/month with no overage** |
| Topics (granular preferences) | Yes | `POST /topics` with `default_subscription: 'opt_in' \| 'opt_out'`, `visibility: 'public' \| 'private'` |
| Unsubscribe handling | **Fully automatic** | Drop `{{{RESEND_UNSUBSCRIBE_URL}}}` into broadcast/automation HTML. Resend hosts the preference page, honours the opt-out, and skips unsubscribed contacts on future sends. **You write no unsubscribe code** — this also covers the CAN-SPAM / GDPR requirement |
| Webhooks | Yes | `contact.created` fires with `email`, `audience_id`, `segment_ids`, `unsubscribed`. Note: **does not fire on CSV import** |
| Personalization | Yes | `{{{contact.first_name\|there}}}` fallback syntax in broadcast HTML |
| **Double opt-in** | **NOT built in — must be hand-rolled** | Resend publishes an official reference implementation at `github.com/resend/resend-double-opt-in-example` (Next.js App Router). The pattern: create the contact with `unsubscribed: true`, send a confirmation email carrying a signed token, and flip to `unsubscribed: false` on click |
| **Segmentation depth** | **Weak** | No behavioural triggers, no A/B subject testing, no marketer-grade filter builder. Automations covers simple drip sequences and nothing more sophisticated |

**Honest gaps the roadmap must budget for:**

1. **Double opt-in is your code.** Roughly a day: a server action that creates the contact as unsubscribed and emails a `crypto.randomUUID()` token stored in a Payload `Subscribers` collection, plus a `/confirm/[token]` route that flips the flag. Non-negotiable for a bilingual site with EU/Spain traffic under GDPR. The upside: because you are storing the token in Payload anyway, that `Subscribers` row is also where you record *which page* the signup came from — which is the attribution the roadmap wants in section 5, obtained for free.
2. **Lead-magnet file delivery is also your code** if the magnet is free (a paid one goes through Polar and is handled). Simplest correct version: after confirmation, email a Cloudinary URL for the asset. Cloudinary is already wired, so this adds no new infrastructure. It is not a hardened paywall, but a free lead magnet does not need one.
3. **Marketing contacts are billed separately from transactional email.** This is the surprise in Resend's pricing and it must be in the roadmap's cost model:

| | Free | Pro |
|---|---|---|
| Transactional emails | 3,000/mo, **hard cap 100/day** | $20/mo → 50,000/mo, no daily cap |
| **Marketing contacts** | **1,000 contacts** | **$40/mo → 5,000 contacts** (separate line item) |
| Automation runs | 10,000/mo, no overage | 10,000/mo, no overage |

So the newsletter runs at **$0 up to 1,000 subscribers**, then steps to $40/month. The 100/day transactional cap on the free tier is the one that will bite first — it is shared with contact-form emails and double opt-in confirmations.

**Verdict: keep Resend.** The 2024-era criticism (that it was transactional-only and unusable as a newsletter tool) no longer holds — Automations, Topics and automatic unsubscribe close the real gaps. What is missing is marketing-grade segmentation, which a personal newsletter does not need. Bringing in a second vendor is not justified.

### 4. Analytics and attribution — Postgres, and nothing in the browser

Measured live on 2026-08-13 with `curl -sL --compressed`, over the wire:

| Option | Client JS weight (measured) | Attribution quality for *this* question | Verdict |
|--------|---------------------------|----------------------------------------|---------|
| **Server-side rows in Postgres** | **0 bytes** | **Exact.** The `/go/` handler already knows the link, the `referer`, the locale and the timestamp. The signup handler already knows the source page. This is first-party data with no sampling, no ad-blocker loss, no consent banner | **RECOMMENDED** |
| Plausible `script.js` | **1,283 bytes** | Good for pageviews; the `file-downloads.outbound-links` variant (1,706 bytes) would auto-catch affiliate clicks — but redundantly, since `/go/` already logs them server-side | Optional, later, only for site-wide pageviews |
| Umami cloud `script.js` | **2,301 bytes** | Same as Plausible. Free tier: 100k events/mo, 3 sites, 6-month retention. Self-hosting is free but wants its own Postgres and ~1 GB RAM on the Hostinger box | Optional alternative to Plausible |
| GA4 `gtag.js` | **419,047 bytes uncompressed / ~143 KB gzipped — for the loader alone**, before GTM containers or consent tooling | Sampled, ad-blocked at 30–50% on a developer audience, and requires a GDPR consent banner that itself costs KB and conversions | **REJECT.** On a site whose stated core value is impeccable performance, this is indefensible |

**Ad-blocker rate is the argument nobody makes and should.** Juan's audience is developers and SEO professionals — the single most ad-blocked demographic on the internet. Client-side conversion tracking on this audience does not merely cost KB, it produces *wrong numbers*. The server-side `/go/` row is captured before any blocker can intervene.

**The attribution schema, concretely:**

```
affiliate-clicks: linkId (rel) · referer · locale · userAgent · createdAt
subscribers:      email · sourcePath · locale · confirmed · confirmedAt · createdAt
orders:           polarOrderId · productId · amount · sourcePath? · createdAt
```

`referer` on the click row and `sourcePath` on the subscriber row are the whole attribution system. They answer "which post drives affiliate clicks and email signups" directly, in SQL, with no vendor. Surface it as a read-only Payload admin view rather than a dashboard build — Payload's list view with filters is already sufficient for the query volume a personal site generates.

One correctness note: because these rows carry a `referer` and a `userAgent`, a strict GDPR reading may treat them as personal data. Truncate or hash IP if you ever store it (recommendation: **do not store IP at all**), and mention the click log in the privacy policy. The site already has a `/privacy` page to amend.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Polar | Stripe direct + `@payloadcms/plugin-ecommerce@3.85.2` | Only if Juan confirms a real Spanish/EU legal entity **and** is willing to register for EU VAT MOSS and file it himself. The plugin is Beta with declared breaking changes; the tax burden lands on him personally. Not recommended even then |
| Polar | Paddle | If the product line ever shifts to recurring SaaS subscriptions rather than one-off downloadables. Paddle is built for that shape and accepts individuals — but expect discretionary manual approval |
| Polar | Lemon Squeezy | Effectively never for a new seller. Only relevant if a Polar-blocking issue appears *and* Stripe Managed Payments has by then opened to Peru, making the LS→SMP migration path actually usable |
| Roll-your-own affiliate collection | A Payload plugin | There is no such plugin. Revisit only if one appears with real maintenance signals |
| `/go/{slug}` cloaked redirect | Direct uncloaked links | **Mandatory for Amazon Associates.** Use direct links for the one program where cloaking risks account termination |
| Server-side Postgres logging | Plausible (1,283 B) or self-hosted Umami (2,301 B) | If Juan later wants full site-wide pageview analytics, not just conversion events. Add it as a separate decision — it does not replace the server-side rows, and the server-side rows do not replace it |
| Resend Broadcasts + hand-rolled double opt-in | ConvertKit / Beehiiv / MailerLite | Only if the newsletter grows into needing behavioural automation, A/B subject testing, or real segmentation. Juan has explicitly ruled out a second vendor; treat this as a v3 conversation, not a v2.1 one |
| Hosted Polar checkout redirect | `@polar-sh/checkout@0.4.1` embedded checkout | Only if in-page checkout measurably lifts conversion enough to justify **278 KB of Stripe.js**. On a handful of low-priced digital products it will not |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Stripe direct** (any form) | **Peru is not a supported Stripe country.** Stripe's availability page lists Brazil and Mexico as its only LATAM entries. And as a non-MoR processor it would leave EU/UK VAT and US sales tax entirely on Juan as an individual | Polar (MoR, Peru supported) |
| **Stripe Managed Payments** | Requires a Stripe account (blocked), is rolling out US-first, and carries a **3.5% MoR surcharge on top of standard Stripe fees** — ~6.4% + $0.30 domestic, past 8–10% on international cards. The most expensive MoR available | Polar at 5% + $0.50 all-in |
| **Lemon Squeezy** | SDK frozen at 4.0.0 since **2024-11-05** (21 months). Announced trajectory is convergence into Stripe Managed Payments, which Peru cannot access. Building here means building twice | Polar |
| `@payloadcms/plugin-ecommerce` | Explicitly **Beta with expected breaking changes**; Stripe is its only shipped payment adapter; does not handle tax. Adds Carts/Variants/Addresses that two downloadable products do not need | A minimal Payload `Products` collection + Polar hosted checkout |
| `@payloadcms/plugin-stripe` | Stripe-only (blocked by eligibility), and bundles `stripe: ^10.2.0` against a current standalone SDK of **22.5.0** — twelve majors behind | n/a — the Stripe branch is closed |
| **Gumroad** | ~**12.9% + $0.80** effective per sale (10% + $0.50 platform *plus* 2.9% + $0.30 processing), rising to 30% via Discover. Fully hosted, so no real integration. Peru payout support unconfirmed since the PayPal payout channel was dropped | Polar at roughly 40% of the cost |
| **GA4 / Google Tag Manager** | **419,047 bytes measured** for the gtag loader alone (~143 KB gzipped), before GTM containers or consent tooling. Sampled data, heavily ad-blocked by a developer audience, and it forces a consent banner | Server-side Postgres rows (0 bytes), optionally Plausible/Umami for pageviews |
| **Any client-side affiliate click tracker** (Lasso JS, custom `sendBeacon` listener, third-party pixel) | Pure downside: adds KB, gets blocked by exactly the audience this site has, and duplicates data the `/go/` redirect already captures perfectly | `after()` + a Payload `create` in the redirect handler |
| **Lasso / ThirstyAffiliates / AAWP** | **WordPress plugins.** No Next.js or Payload equivalent exists. Their SaaS pricing assumes a WordPress affiliate site, not one "Mi Stack" page | Roll-your-own Payload collection |
| **Cloaking Amazon Associates links** | The Operating Agreement prohibits obscuring the source URL "including by use of redirecting links." Detection can mean account termination **and forfeiture of accrued earnings** — and Juan's Amazon account is already active | Direct uncloaked Amazon links with the tag visible; `/go/` for every other program |
| `@polar-sh/checkout` embedded checkout | Peer-requires `@stripe/stripe-js`, which loads **284,912 bytes** from `js.stripe.com` | Hosted checkout redirect via `@polar-sh/nextjs` `Checkout()` — 0 KB |
| Caching the `/go/{slug}` route | A cached redirect serves stale destinations and, worse, silently stops recording clicks — the failure is invisible | `export const dynamic = 'force-dynamic'` + `Cache-Control: no-store` |
| Edge runtime for `/go/` or webhooks | Explicitly out of scope for this project; the deploy target is a persistent Hostinger Node process. Payload's Local API needs Node regardless | Default Node runtime |

## Stack Patterns by Variant

**If Juan is Peru-based only (the assumed default):**
- Polar is the only viable merchant of record among the five platforms evaluated. Gumroad's Peru payout status is unconfirmed; Stripe and Stripe Managed Payments are hard-blocked.
- Because Polar pays out via Stripe Connect Express, whose country coverage (~150 nations, Peru included) is far wider than Stripe's ~50 merchant-account countries. This is precisely why Polar reaches Peru when Stripe itself does not.

**If Juan confirms a Spanish/EU entity:**
- Stripe direct and `@payloadcms/plugin-ecommerce` become technically installable — but **still recommend Polar**.
- Because merchant-of-record status is the actual requirement here, not payment processing. An individual filing EU VAT MOSS, UK VAT and tracking US economic nexus for a few $19 downloads is a compliance liability that dwarfs the ~2% fee difference.

**If the milestone ships affiliate links only and defers products (a likely ROI outcome):**
- Ship the `AffiliateLinks` + `/go/` + `AffiliateClicks` trio and the Resend capture flow; add nothing to `package.json` except `resend`.
- Because the affiliate feature has **zero new dependencies and zero client-side weight**, so it cannot regress performance or SEO by construction. The Polar decision is then already made and documented for v2.2, with no code debt carried.

**If subscriber count crosses 1,000:**
- Budget the **$40/month Resend marketing tier** (5,000 contacts) as a separate line from the $20/month transactional Pro tier.
- Because Resend bills marketing contacts and transactional volume independently — a detail that is easy to miss and doubles the assumed cost.

**If the lead magnet is a free download rather than a paid product:**
- Deliver it as a Cloudinary URL emailed after double-opt-in confirmation.
- Because Cloudinary is already wired and a free magnet needs no paywall. Reserve Polar's signed-URL delivery (10 GB/file, SHA-256) for paid products.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `@polar-sh/nextjs@0.9.6` | `next@15.4.11` ✓ | Declared peer is `next: ^15.0.0 \|\| ^16.0.0` — verified live. No React peer, so React 19.2.7 is a non-issue |
| `@polar-sh/nextjs@0.9.6` | `@polar-sh/sdk@0.49.0` | Adapter depends on `@polar-sh/sdk@^0.47.0`; 0.49.0 satisfies the caret. Installing 0.49.0 explicitly avoids two copies in the tree |
| `@polar-sh/sdk@0.49.0` | `zod ^3.25.65 \|\| ^4.0.0`, `standardwebhooks ^1.0.0` | Both pulled transitively; neither currently in the project, so no conflict |
| `resend@6.20.0` | `@payloadcms/email-resend@3.85.2` | The Payload adapter already depends on `resend` transitively. Installing 6.20.0 as a direct dependency is safe and makes the version explicit rather than implicit |
| `@payloadcms/plugin-ecommerce@3.85.2` | `payload@3.85.2` (exact), `react ^19.0.1 \|\| ^19.1.2 \|\| ^19.2.1` | Would install cleanly against the project's `react@19.2.7`. **Beta status and Stripe-only adapter are why it is not recommended, not compatibility** |
| `@payloadcms/plugin-stripe@3.85.2` | `payload@3.85.2` (exact peer) | Installable but blocked by Stripe eligibility. Also bundles `stripe@^10.2.0` vs current 22.5.0 |
| `after` from `next/server` | `next@15.4.11` ✓ | Stable public API since Next 15.1 — no `unstable_` prefix. Available in Route Handlers, Server Actions and Server Components |
| Whole `@payloadcms/*` suite | Currently pinned at 3.85.2; npm `latest` is **3.88.0** | The lockstep rule from the project's existing STACK.md still applies. Monetization needs **no** Payload upgrade — do not bundle a 3.85→3.88 bump into this milestone |
| `ua-parser-js@2.0.10` | n/a | v2 moved to a dual AGPL/commercial license. Verify licensing before use, or skip it entirely (recommended) |

## Sources

**Live npm registry queries, 2026-08-13** (authoritative — the registry itself, not a mirror or blog) — HIGH
- `npm view` on: `@polar-sh/nextjs` 0.9.6 (peer `next: ^15.0.0 || ^16.0.0`), `@polar-sh/sdk` 0.49.0, `@polar-sh/checkout` 0.4.1 (peers `@stripe/stripe-js`, `@stripe/react-stripe-js`), `resend` 6.20.0, `stripe` 22.5.0, `@payloadcms/plugin-stripe` 3.85.2 + 3.88.0 (dep `stripe: ^10.2.0`), `@payloadcms/plugin-ecommerce` 3.85.2 + 3.88.0, `@lemonsqueezy/lemonsqueezy.js` 4.0.0 (last publish 2024-11-05), `nanoid` 6.0.1, `ua-parser-js` 2.0.10, `payload` latest 3.88.0
- `npm search "payload affiliate"` and `"affiliate link cloaking"` — confirmed **no** Payload affiliate plugin exists; `payload-affiliate` returns 404
- `api.npmjs.org/downloads/point/last-week` — maintenance signal: `@polar-sh/sdk` 256,292/wk vs `@lemonsqueezy/lemonsqueezy.js` 106,094/wk; `@payloadcms/plugin-ecommerce` 9,544/wk (low adoption, consistent with Beta)

**Direct measurement via `curl -sL --compressed`, 2026-08-13** (first-hand, reproducible) — HIGH
- `plausible.io/js/script.js` → 1,283 B; `script.file-downloads.outbound-links.js` → 1,706 B
- `cloud.umami.is/script.js` → 2,301 B
- `googletagmanager.com/gtag/js` → 419,047 B uncompressed / 146,842 B gzipped
- `js.stripe.com/v3/` → 284,912 B
- `@polar-sh/checkout@0.4.1` `embed.global.js` → 2,633 B

**Official vendor documentation (fetched directly)** — HIGH
- `polar.sh/docs/merchant-of-record/supported-countries` and `polar.apidocumentation.com/.../supported-countries` — **cross-verified from two independent URLs**: Peru 🇵🇪 and Spain 🇪🇸 both listed; "As your Merchant of Record (MoR) we take on the liability for international sales taxes"; built on Stripe Connect
- `polar.sh/resources/pricing` — plan tiers, international-card surcharge, dispute fee, Stripe payout fees, 2026-05-27 grandfathering date
- `polar.sh/docs/features/benefits/file-downloads` — 10 GB/file, per-customer signed URLs, SHA-256 checksums
- `stripe.com/global` — supported-country list; **Peru absent**, Brazil and Mexico the only LATAM entries, Spain supported
- `payloadcms.com/docs/ecommerce/overview` — collections list, Stripe-only adapter, `PaymentAdapter` interface, explicit **"currently in Beta and may have breaking changes"**, no tax handling
- `resend.com/pricing` — Free 3,000 emails/mo + 100/day + 1,000 marketing contacts; Pro $20 transactional; Pro Marketing from $40 at 5,000 contacts; 10,000 automation runs/mo no overage

**Context7 `/websites/resend` and `/websites/polar_sh` (current official API references)** — MEDIUM-HIGH
- Resend: `broadcasts.create` now takes **`segment_id`** (not `audience_id`); `automations.create` with steps/connections graph; `POST /topics` with `default_subscription`; `{{{RESEND_UNSUBSCRIBE_URL}}}` automatic unsubscribe; `contact.created` webhook payload shape
- Polar: `Checkout()`, `Webhooks()`, `CustomerPortal()` Next.js Route Handler adapters, `server: 'sandbox' | 'production'`
- Context7 `/vercel/next.js/v15.1.8` — `after()` documented as a stable `next/server` export for Route Handlers

**Web search / secondary reporting** — MEDIUM (corroborated where load-bearing, flagged where not)
- Lemon Squeezy 2026 status: acquisition July 2024; platform's own 2026 update states no changes/action needed for existing stores and signups remain open; stated direction is migration to Stripe Managed Payments. *The vendor blog itself returned HTTP 403 to direct fetch — this is corroborated across search summaries plus the independently verified 21-month SDK freeze, which is the stronger signal.* — MEDIUM
- Stripe Managed Payments 3.5% MoR surcharge (~6.4% + $0.30 all-in US) and US-first rollout — MEDIUM (multiple third-party analyses; not fetched from Stripe's own pricing page)
- Gumroad: MoR since 2025-01-01, 10% + $0.50 platform plus processing → ~12.9% + $0.80 effective, PayPal payouts discontinued, Peru payout status **unconfirmed** — MEDIUM, and explicitly flagged as unresolved
- Paddle: accepts Individual/sole trader without incorporation, pays out outside sanctioned countries; Peru not explicitly confirmed — MEDIUM
- Amazon Associates Operating Agreement anti-cloaking clause, and community consensus that same-domain 302 with tag intact is tolerated — **MEDIUM, and deliberately treated as HIGH risk anyway**. The recommendation (direct Amazon links) is the conservative reading precisely because the source is not definitive and the downside is account termination plus forfeited earnings
- Umami cloud free tier 100k events/3 sites/6-month retention; v3 dropped MySQL; ~512 MB–1 GB RAM self-hosted — MEDIUM

**Project context** — HIGH
- `.planning/PROJECT.md` and `package.json` read directly: `payload@3.85.2`, `next@15.4.11`, `react@19.2.7`, `@payloadcms/email-resend@3.85.2`, Cloudinary wired, `next-intl@4.13.1`, Hostinger standalone Node target, `RESEND_API_KEY` still a placeholder

---

## Open Questions for the Roadmapper

1. **Juan's tax residency and entity status.** Peru-only is the assumed default and it makes Polar the only viable option. A confirmed Spanish/EU entity would reopen Stripe technically — but the merchant-of-record argument keeps Polar as the recommendation regardless. Worth one direct question before requirements freeze.
2. **`RESEND_API_KEY` is still a placeholder.** The entire email-capture feature is blocked on the same credential that has Phase 6 paused. Sequence the affiliate work first — it has no external dependencies at all.
3. **Gumroad's Peru payout status is genuinely unresolved.** It does not change the recommendation (Gumroad loses on fees and integration regardless), so it was not worth further digging. Noted for completeness.
4. **Whether pageview analytics is in scope at all.** The server-side conversion rows answer the stated question ("which content drives clicks and signups") completely. Plausible or Umami would answer a *different* question (traffic shape) and should be a separate decision, not bundled in.

---
*Stack research for: site monetization on Payload 3.85 + Next.js 15, self-hosted Node, individual seller in Peru*
*Researched: 2026-08-13 — all versions verified live against registry.npmjs.org and vendor documentation on this date; all KB figures measured first-hand with curl, not quoted from marketing pages*
