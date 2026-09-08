# Phase 49: Captura de Email (Resend, env-gated) - Research

**Researched:** 2026-09-07
**Domain:** Next.js App Router zero-client-JS forms, Payload double opt-in email collections, Cloudinary private/signed asset delivery, build-time PDF generation
**Confidence:** MEDIUM — HIGH on verified code/docs, MEDIUM-LOW on the single biggest finding (a pre-existing newsletter system this phase must reconcile with, not duplicate)

## Summary

The single most important finding of this research is **not** in the tech stack — it's that `49-CONTEXT.md` and `49-UI-SPEC.md` were written as if `subscribers`/double-opt-in/an inline capture block were greenfield, when in fact **all three already exist in this codebase**, built 2026-08-20 by a `/gsd:quick` task (`260820-blg-blog-redesign-cro-y-newsletter`) that predates Phase 44 (the first phase of this milestone, completed 2026-08-30). There is a live `Subscribers` collection (migration `20260820_155934_subscribers_collection`), a `subscribeAction` Server Action with proven double-opt-in logic (pending→confirmed→unsubscribed, token-based, honeypot, rate-limited), two Route Handlers (`/api/newsletter/confirm`, `/api/newsletter/unsubscribe`), a `NewsletterBlock` Page-block, and a React-Email confirmation template. None of it does lead-magnet delivery (no PDF, no signed Cloudinary URL, no distinction between "blog newsletter" and "lead magnet" opt-in reasons), and its form component (`NewsletterForm.tsx`) is a `'use client'` component using `useActionState`/`useFormStatus` — it ships client JS, which fails MAIL-01's "sin JavaScript de cliente" constraint if reused verbatim. The planner's job is **extend, not duplicate**: add fields to `Subscribers` (additive migration), add a new PDF-delivery branch to the confirm route, and build a genuinely zero-client-JS form (following `ContactFormBlockComponent`'s proven `<form action={fn}>` shape, not `NewsletterForm`'s) as the new Lexical `EmailCaptureBlock`. Trying to build a second, parallel `subscribers` table (as ROADMAP.md's original v2.1 planning text literally describes) will collide with the existing Postgres table name and duplicate logic that already works in production.

The second major finding is a genuine, previously-undocumented architecture risk in the UI-SPEC's own "wrinkle" callout: making `richTextConverters` a per-request factory requires the blog **post-detail page** (`blog/[category]/[slug]/page.tsx`) to read `searchParams` — and that page currently relies on ISR (`revalidate = 60`, cached, not `force-dynamic`) for what Phase 45's baseline confirms is the site's highest-traffic surface. Per Next.js docs, reading `searchParams` in a Server Component page **opts the entire route into dynamic (per-request) rendering**, and this project has no Partial Prerendering/Cache Components flag enabled that would let a `<Suspense>` boundary scope that cost down to just the confirmation banner. The mitigating factor: `getCachedPost()` already wraps the actual Postgres query in `unstable_cache`, independent of the route's own dynamic classification, so the added cost is React render-per-request, not DB-round-trip-per-request — likely tolerable, but it must be verified empirically (Lighthouse on a real post, with and without `?subscribed=`) rather than assumed, given Phase 50's hard gate on Lighthouse/CWV deltas.

Third, `payload-cloudinary`/`@payloadcms/plugin-cloud-storage`'s existing adapter (`src/lib/cloudinary-adapter.ts`) only handles the `Media` collection's always-public uploads (`generateFileURL` has no `type`/`sign_url` support) — it cannot produce a private, signed, short-expiry PDF URL. MAIL-03/MAIL-05 require going around that adapter entirely and calling the raw `cloudinary` SDK (`cloudinary.uploader.upload(..., { resource_type: 'raw', type: 'authenticated' })` + `cloudinary.utils.private_download_url(publicId, 'pdf', { type: 'authenticated', resource_type: 'raw', expires_at, attachment: true })`), confirmed against Cloudinary's own Node SDK docs.

**Primary recommendation:** Extend the existing `Subscribers` collection and confirm/unsubscribe route handlers (additive migration + branch logic for the lead-magnet path) rather than building a second parallel system; build `EmailCaptureBlock` as a brand-new zero-client-JS Lexical block reusing `ContactFormBlockComponent`'s proven `<form action={fn}>` shape (not `NewsletterForm`'s client-side one); use the raw `cloudinary` SDK for the private/signed PDF delivery; and treat the `searchParams`-on-the-post-page performance question as a task requiring empirical Lighthouse verification, not an assumption.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Lead magnet:**
- Juan no tenía un archivo armado — lo genera Claude. Contenido: checklist de auditoría SEO técnica, basado en las categorías típicas que Juan mismo ya usó en la auditoría SEO de agosto de este mismo sitio (research/ de este repo): rastreo/indexación, rendimiento/CWV, datos estructurados, mobile/accesibilidad, seguridad/canonicalización.
- No inventar números específicos del auditor real (auditor.juan-tech.com) que Claude no conoce — el checklist es contenido propio de Juan sobre SEO técnico en general, no una copia de los checks internos del auditor. Evitar cualquier frase que implique "esto es exactamente lo que audita mi herramienta" con precisión que no está verificada.
- Formato: PDF simple, generado a partir de contenido en Markdown/HTML — sin diseño elaborado, prioriza contenido honesto y accionable sobre estética. Subido a Cloudinary por Claude como parte de la ejecución (recurso privado, servido solo vía URL firmada).
- Bilingüe: ES y EN, dos archivos separados (o el mismo archivo con ambos idiomas, a decidir en planning — mientras la URL firmada por locale sea inequívoca).

**Ubicación del bloque de captura:**
- Inline dentro de `posts.content`, mismo patrón de bloque reusable que `AffiliateInlineBlock` (Phase 48) — el blog es donde ya hay tráfico orgánico real medido en el baseline de Phase 45.
- No en footer, no en `/stack`, no como página dedicada — decisión explícita de Juan.

### Claude's Discretion
- Copy exacta del bloque de captura (heading, CTA, microcopy de privacidad — reusando el disclosure/`/privacy` ya construido en Phase 46).
- Redacción completa del checklist (contenido real y honesto, sin fabricar credenciales o números no verificados).
- Diseño exacto del PDF (estructura de encabezados, checkboxes de texto plano vs. HTML simple renderizado a PDF).
- Nombre exacto de las colecciones/tablas (`subscribers`, `lead-magnets`) más allá de lo ya fijado en el ROADMAP. **Research finding: `subscribers` already exists as a live Postgres table — this discretion item is moot for that name; only `lead-magnets` (or whatever it's called) is genuinely new.**
- Mecanismo exacto de generación del PDF (librería a elegir en research — priorizar algo ligero, sin JS de cliente, corrido en build/seed time, no en runtime de request).

### Deferred Ideas (OUT OF SCOPE)
- Unificar la lista de suscriptores con la del auditor (bases separadas, Prisma vs. Payload) — v2.2.
- Tienda/venta reutilizando `secure-download.ts`/`download-token.ts` — v2.2, esta fase solo deja los helpers listos.

### Specifics (from CONTEXT.md, not decisions but binding facts)
- `RESEND_API_KEY` ya está configurada (real, no placeholder) desde 2026-09-07 — el flujo puede verificarse de punta a punta, no solo en modo degradado. La constraint de "degradar limpio sin la key" sigue siendo un requirement de código (MAIL-04).
- `secure-download.ts` y `download-token.ts` deben quedar completamente separados de la lógica de suscripción — MAIL-05 lo exige explícitamente para que v2.2 (tienda) los reutilice sin reescribir nada.
- Página de confirmación del doble opt-in vive dentro de `[locale]`, con `robots: { index: false }`, sin tocar el middleware.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MAIL-01 | Bloque de captura inline (nunca popup/modal), Server Action, cero JS de cliente | `ContactFormBlockComponent`/`sendContactMessage` confirmed as the zero-JS-proven pattern to replicate (NOT `NewsletterForm`, which is `'use client'`). Lexical registration confirmed via `AffiliateInlineBlock`/`BlocksFeature` precedent. |
| MAIL-02 | Doble opt-in propio (no lo trae Resend); Resend solo recibe direcciones confirmadas | The existing `Subscribers` collection + `subscribeAction` + `/api/newsletter/confirm` already implement exactly this invariant end-to-end and in production — extend, don't rebuild. |
| MAIL-03 | Lead magnet vía URL firmada de Cloudinary, expiración corta, no archivo público | Confirmed `cloudinary.utils.private_download_url()` (Context7, official Cloudinary Node SDK docs) is the correct API; confirmed the existing `payload-cloudinary`/`plugin-cloud-storage` adapter cannot do this (Media-only, always-public `generateFileURL`). |
| MAIL-04 | Env-gated degradación limpia sin `RESEND_API_KEY` real | Existing `contact.ts`/`subscribe.tsx` only catch-after-send-fails (subscriber stays `pending` forever with no email — that alone does NOT satisfy MAIL-04's "el magnet igual se entrega"). A **proactive** `isResendConfigured()` check (same shape as `hasCloudinaryCreds` in `payload.config.ts`) is needed so the flow can skip the email step and go straight to confirmed+delivery when the key is absent/placeholder. |
| MAIL-05 | `secure-download.ts`/`download-token.ts` como helpers separados e importables | No such files exist yet (confirmed via `find`) — genuinely new, greenfield. Naming/shape recommendation given in Architecture Patterns. |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Inline capture form rendering | Frontend Server (RSC inside Lexical converter tree) | — | Zero-client-JS constraint means the form itself is pure Server Component markup, same tier as `ContactFormBlockComponent`. |
| Email validation, honeypot, rate limit | API / Backend (Server Action) | — | Same tier and same in-process module-state pattern already used by `contact.ts`/`subscribe.tsx` (persistent Node process on Hostinger/Dokploy, not serverless). |
| Subscriber state (pending/confirmed/unsubscribed) | Database / Storage (Postgres via Payload `Subscribers`) | — | Already exists at this tier; this phase extends the schema additively, does not move tiers. |
| Double opt-in confirmation resolution | API / Backend (Route Handler, `/api/newsletter/confirm`) | Frontend Server (new `[locale]` confirm page for the lead-magnet branch) | Token verification and status transition stay in the existing Route Handler tier; only the *lead-magnet-specific* HTML response (with the download button) needs a proper `[locale]` page per CONTEXT.md's constraint ("vive dentro de `[locale]`, con `robots: index:false`"). |
| Signed PDF URL generation | API / Backend (server-side, raw `cloudinary` SDK) | — | Never client-side — MAIL-03 and the UI-SPEC both require server-only resolution, consistent with how Cloudinary signing must never expose the API secret to the browser. |
| PDF artifact storage | CDN / Static (Cloudinary, `resource_type: raw`, `type: authenticated`) | — | Same provider tier as Media, but a different, non-public delivery type — this is new territory for this codebase (Media is always public). |
| Email delivery (confirmation + eventually the "if Resend down" no-op) | API / Backend (Resend via `@payloadcms/email-resend`, already wired) | — | No tier change; this phase only adds a proactive "is it configured" check at this same tier. |

## Pre-Existing Newsletter Infrastructure — Read This Before Planning

This is not optional context — it changes what "Phase 49" concretely means. Confirmed by reading the files (not just grepping):

| File | Status | What it does |
|------|--------|--------------|
| `src/collections/Subscribers/index.ts` | **EXISTS**, live in `payload.config.ts` collections array | `slug: 'subscribers'`, fields `email` (unique), `status` (pending/confirmed/unsubscribed enum), `locale`, `source`, `token`, `confirmedAt`, `unsubscribedAt`. Access closed to `authenticated` on all 4 CRUD ops — public writes go through the Server Action with `overrideAccess: true`, by design (docblock explains why). Already excluded from `mcpPlugin`/`seoPlugin`/`SITEMAP_COLLECTIONS` with the exact rationale ROADMAP.md's Phase 49 note describes. |
| `src/migrations/20260820_155934_subscribers_collection.ts` | **EXISTS**, applied | Creates the `subscribers` table, its two enums, and the `payload_locked_documents_rels` FK. **Trying to create a *second* `subscribers` collection in this phase will collide with this table name at the Postgres/Payload-config level.** |
| `src/app/actions/subscribe.tsx` (`subscribeAction`) | **EXISTS**, `'use server'` | Full double-opt-in write path: honeypot check, email regex, rate limit (module-level `Map`, same pattern as `contact.ts`), `resolveSiteUrl()` (proxy-aware host resolution — do not reuse `NEXT_PUBLIC_SERVER_URL` blindly, see Pitfalls), create-or-update-by-email, generates a `crypto.randomBytes(32)` token, sends via `payload.sendEmail` wrapped in try/catch, never reveals whether an email already existed (anti-enumeration). |
| `src/app/api/newsletter/confirm/route.ts` | **EXISTS** | GET handler, looks up by `token` (never by email — anti-enumeration), flips `status` to `confirmed`, clears `unsubscribedAt`, redirects to `/blog?newsletter=confirmed|invalid`. **Does not know about lead magnets — always redirects to `/blog`.** |
| `src/app/api/newsletter/unsubscribe/route.ts` | **EXISTS** | Same token-lookup shape, one-click unsubscribe, no confirmation screen. |
| `src/blocks/NewsletterBlock/{config,Component,NewsletterForm}.tsx` | **EXISTS**, live on blog pages | `NewsletterForm.tsx` is `'use client'`, uses `useActionState`/`useFormStatus` — **this ships client JS**. It is a Page-block (rendered via `RenderBlocks`/`blockProps`), not a Lexical inline block, and it reads its confirmation state via a `newsletterState` prop threaded from the `/blog` page's `searchParams.newsletter` (that page is already `force-dynamic` for an unrelated Dokploy-build reason, so this cost nothing extra there). |
| `src/emails/ConfirmSubscription.tsx` + `src/emails/BlogEmailLayout.tsx`/`theme.ts` | **EXISTS** | React-Email template, bilingual, single-CTA-button pattern, `@react-email/render` for both HTML and plain-text. Reusable pattern for whatever confirmation email variant the lead-magnet flow sends (can reuse `BlogEmailLayout`/`theme` directly, write a new template component analogous to `ConfirmSubscription`). |

**What none of this does (genuinely new for Phase 49):** lead-magnet identity (which PDF, which locale) is not modeled anywhere in `Subscribers`; there is no signed-URL generation; the confirm route has no branch that returns anything other than a redirect to `/blog`; nothing here is zero-client-JS.

**Recommended reconciliation (Architecture Patterns has the concrete shape):** treat this as an *extension* phase, not a *rebuild* phase:
1. Additive migration on `Subscribers`: add an `optInReason` (`newsletter` | `lead-magnet`, default `newsletter` to not break existing rows) and a `leadMagnet` relationship field (nullable).
2. New `lead-magnets` collection (genuinely new, per CONTEXT.md's discretion) holding the two locale PDFs' Cloudinary `public_id`s.
3. A **new** Server Action (`src/app/actions/subscribe-lead-magnet.ts` or similar — do not overload `subscribeAction`'s signature, its FormData shape and redirect targets are blog-specific and already proven; a second, small action that shares the collection and token logic but has its own redirect targets is lower-risk than branching the existing one) — or, if the planner prefers a single action, extend `subscribeAction` carefully with a `leadMagnet` FormData field and branch its redirect target, but this touches code with a live production dependency (the existing `/blog` newsletter block) and needs regression testing either way.
4. Branch `/api/newsletter/confirm/route.ts`: if the resolved subscriber has `leadMagnet` set, redirect to the new `[locale]` confirm page (which resolves the signed URL) instead of `/blog`.
5. Do **not** touch `NewsletterForm.tsx`/`NewsletterBlockComponent` — they're a different, already-shipped, already-client-JS-accepted surface; MAIL-01's zero-JS constraint applies to the *new* `EmailCaptureBlock` only.

This reconciliation is a judgment call with real tradeoffs (shared vs. parallel Server Action, single vs. dual confirm-route branch) — flag it explicitly to the planner as a decision point, not a foregone conclusion baked into this research.

## Standard Stack

No new runtime dependency is required for this phase — everything MAIL-01..05 needs is already installed and already proven working in this exact repo.

### Core (all already installed, verified in `package.json`)
| Library | Installed Version | Purpose | Why no new install |
|---------|---------|---------|--------------|
| `cloudinary` | `^2.10.0` | Raw SDK for private/signed PDF upload + `private_download_url()` | Already used for Media uploads (`src/lib/cloudinary-adapter.ts`); this phase calls the SDK directly instead of through `plugin-cloud-storage`, for the private/`raw`/`authenticated` path the adapter doesn't support. |
| `@payloadcms/email-resend` | `3.85.2` | Resend transport, already wired in `payload.config.ts` (`email: resendAdapter(...)`) | No config change needed — `RESEND_API_KEY`/`RESEND_FROM_EMAIL` already read from env. |
| `@react-email/render` + `@react-email/components` | `^2.1.0` / `^1.0.12` | Confirmation email template rendering (HTML + plain text) | `src/emails/ConfirmSubscription.tsx` + `BlogEmailLayout.tsx` are the exact pattern to extend or copy for the lead-magnet confirmation email. |
| `playwright` | `^1.61.1` (devDependency) | Recommended PDF-generation mechanism: `page.pdf()` from a simple local HTML template, run **once**, at execution/seed time via a `tsx` script (not part of `next build`, not a runtime dependency) | Already installed and already proven to drive headless Chromium successfully in this repo's own verification scripts (`scripts/verify-*.mjs`, `scripts/seed-phase40-websites.ts`). Matches CONTEXT.md's "corrido en build/seed time, no en runtime de request" instruction with **zero new dependencies**. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| none required | — | — | No new npm package needed for this phase. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Playwright `page.pdf()` for the lead magnet | `@react-pdf/renderer` (real npm package, ~[ASSUMED] version, React-based PDF composition, no headless browser) | Avoids spinning up Chromium for a one-off script, but is a **new** production-adjacent dependency for a document generated exactly twice (once per locale) and never regenerated at runtime. Given Playwright is already installed and battle-tested in this repo for exactly this kind of one-off script, it is the lower-risk, zero-new-dependency choice — recommend `@react-pdf/renderer` only as a fallback if Playwright/Chromium is unavailable in whatever shell actually runs the generation script. |
| Raw `cloudinary` SDK calls for the PDF | Extending `src/lib/cloudinary-adapter.ts`/`plugin-cloud-storage` to support `type: 'authenticated'` | The adapter's `generateFileURL` and `handleUpload` are hard-wired for the `Media` collection's always-public image use case (confirmed by reading the file); bending it to also support private/signed raw files is more invasive than calling the SDK directly in a dedicated `secure-download.ts` helper, which also matches MAIL-05's explicit ask for a **separate, standalone** helper. |

**Installation:** None required.

**Version verification:** All versions above read directly from `/Users/juan/Documents/Codigo/Personal/juantech/juan-payload/package.json` this session `[VERIFIED: package.json]` — not re-fetched from the npm registry since none are new installs; `cloudinary.utils.private_download_url()` and the `DeliveryType` (`upload`/`private`/`authenticated`) enum were confirmed against Cloudinary's official Node SDK docs via Context7 `[VERIFIED: Context7 /cloudinary/cloudinary_npm]`.

## Package Legitimacy Audit

**No new external packages are introduced by this phase** — MAIL-01..05 are fully satisfiable with already-installed, already-vetted dependencies (`cloudinary`, `@payloadcms/email-resend`, `@react-email/*`, `playwright`). The Package Legitimacy Gate is not applicable; if the planner or executor later decides a dedicated PDF library (e.g. `@react-pdf/renderer`) is preferable to the Playwright-based approach recommended above, run `gsd_run query package-legitimacy check --ecosystem npm @react-pdf/renderer` before adding it, and gate the install behind a `checkpoint:human-verify` per the standard protocol.

**Packages removed due to [SLOP] verdict:** none (nothing new checked).
**Packages flagged as suspicious [SUS]:** none.

## Architecture Patterns

### System Architecture Diagram

```
Visitor reading a post (ISR-cached page, blog/[category]/[slug])
        │
        ▼
EmailCaptureBlock (Lexical leaf, rendered via richTextConverters['email-capture'])
        │  <form action={subscribeToLeadMagnetAction}>  (zero client JS)
        ▼
Server Action (new, src/app/actions/subscribe-lead-magnet.ts)
        │  1. honeypot + rate-limit + email regex (same shape as contact.ts/subscribe.tsx)
        │  2. isResendConfigured() ──────────────┐
        │                                        │
        │  configured=true                       │ configured=false (MAIL-04 path)
        ▼                                        ▼
  payload.create/update on `subscribers`   payload.create/update on `subscribers`
  { status:'pending', optInReason:         { status:'confirmed', optInReason:
    'lead-magnet', leadMagnet, token }        'lead-magnet', leadMagnet, confirmedAt:now }
        │                                        │
        ▼                                        │ (skip email step entirely)
  payload.sendEmail(ConfirmLeadMagnet)           │
  redirect(post?subscribed=pending)              ▼
        │                              redirect(post?subscribed=already-confirmed-path
        │                                        → straight to the confirm page's
        │                                        success branch, so the magnet is
        │                                        delivered in THIS request)
        ▼
Visitor clicks the emailed link
        │
        ▼
GET /api/newsletter/confirm?token=...  (existing route, extended)
        │  find by token (never by email) → flip pending→confirmed
        │  if subscriber.leadMagnet is set:
        ▼
redirect → [locale]/{confirm-segment}?token=... (NEW page, robots:{index:false})
        │
        ▼
secure-download.ts: resolveSignedDownloadUrl(leadMagnetDoc, locale)
        │  cloudinary.utils.private_download_url(publicId, 'pdf',
        │    { type:'authenticated', resource_type:'raw', expires_at, attachment:true })
        ▼
Confirm page renders success state with a plain <a href={signedUrl}> download button
```

### Recommended Project Structure (additions only)
```
src/
├── blocks/
│   └── EmailCaptureBlock/
│       ├── config.ts              # zero-config Lexical Block (or 1 optional field), slug: 'email-capture'
│       └── Component.tsx          # EmailCaptureCard leaf — same TDZ-avoidance constraint as AffiliateInlineCard
├── collections/
│   ├── Subscribers/index.ts       # MODIFIED — add optInReason + leadMagnet fields (additive migration)
│   └── LeadMagnets/index.ts       # NEW — admin-only, holds the 2 locale PDFs' Cloudinary public_ids
├── app/
│   ├── actions/
│   │   └── subscribe-lead-magnet.ts   # NEW Server Action (or a careful extension of subscribe.tsx — planner's call)
│   ├── api/newsletter/confirm/route.ts  # MODIFIED — branch on subscriber.leadMagnet
│   └── (frontend)/[locale]/blog/{confirm-segment}/page.tsx  # NEW, robots:{index:false}
├── lib/
│   ├── secure-download.ts         # NEW — cloudinary.utils.private_download_url() wrapper, MAIL-05
│   ├── download-token.ts          # NEW — token generation/verification helper, separate from Subscribers' own `token` field per MAIL-05
│   └── resend-configured.ts       # NEW — isResendConfigured(), same shape as hasCloudinaryCreds
├── emails/
│   └── ConfirmLeadMagnet.tsx      # NEW — same pattern as ConfirmSubscription.tsx, reuses BlogEmailLayout/theme
└── components/
    └── richTextBlockConverters.tsx  # MODIFIED — factory wrapper, see Pattern 1 below
```

### Pattern 1: `richTextConverters` per-request factory (the UI-SPEC's documented "wrinkle" — concrete shape)
**What:** `richTextConverters` is exported today as `export const richTextConverters: JSXConvertersFunction = ({ defaultConverters }) => ({...})` — a plain function, called by Payload's `<RichText converters={...}>` internally. `[VERIFIED: src/components/richTextBlockConverters.tsx:241-263]`. It has exactly **one** call site, `src/components/RichTextRenderer.tsx:29` (`<RichText data={data} converters={richTextConverters} />`), which is itself used by 8 different call sites (`FAQ`, `Content`, `CallToAction`, `TableOfContentsBlock`, the blog post page, the case-studies page, `AffiliateInlineCard`... wait, `richTextBlockConverters.tsx` itself). Because `richTextConverters` is directly callable (`richTextConverters({ defaultConverters })` returns the converters map), a factory can wrap it without touching its internals:

```typescript
// src/components/richTextBlockConverters.tsx — add alongside the existing export
export function buildRichTextConverters(
  ctx: { subscribedState?: string } = {},
): JSXConvertersFunction {
  return (args) => {
    const base = richTextConverters(args)
    return {
      ...base,
      blocks: {
        ...base.blocks,
        'email-capture': ({ node }: { node: { fields: EmailCaptureBlockNodeFields } }) => (
          <EmailCaptureCard {...node.fields} subscribedState={ctx.subscribedState} />
        ),
      },
    }
  }
}
```

```typescript
// src/components/RichTextRenderer.tsx — backward-compatible optional prop, the OTHER 8 call sites are unaffected
interface RichTextRendererProps {
  data: SerializedEditorState | null | undefined
  className?: string
  converters?: JSXConvertersFunction   // NEW, optional
}
export function RichTextRenderer({ data, className, converters }: RichTextRendererProps) {
  if (!data) return null
  return (
    <Prose className={className}>
      <RichText data={data} converters={converters ?? richTextConverters} />
    </Prose>
  )
}
```

Then only the post-detail page constructs and passes the factory:
```typescript
const converters = buildRichTextConverters({ subscribedState: searchParamsResolved.subscribed })
<RichTextRenderer data={body.before} converters={converters} />
```

**Nuance worth flagging to the planner, not silently resolving:** the `faq` converter inside `richTextConverters` recursively calls `<RichText data={item.answer} converters={richTextConverters} />` (the base static object, not the factory's output) — a nested FAQ answer will never see `subscribedState`. This is almost certainly fine (no current content nests an `email-capture` block inside a FAQ answer), but it's a deliberate simplification, not an oversight, and should be called out as such in the plan rather than "fixed" by threading the factory recursively (which balloons scope for a case that doesn't occur in real content, mirroring the precedent Phase 48 already set for the multi-instance-per-post edge case).

### Pattern 2: `searchParams` on the post-detail page breaks ISR — verify before accepting
**What:** `blog/[category]/[slug]/page.tsx` currently has `export const revalidate = 60` and `generateStaticParams` returning `[]` (ISR, not `force-dynamic` — confirmed by reading the file and its own docblock explaining why: `[VERIFIED: src/app/(frontend)/[locale]/blog/[category]/[slug]/page.tsx:52-56]`, comment text: `"ISR resuelve las dos cosas: generateStaticParams devuelve una lista VACIA... y dynamicParams... deja que cada URL se renderice en la primera visita y quede en la cache incremental"`). Reading `searchParams` in a Server Component page "opts the page into dynamic rendering at request time" `[CITED: Next.js docs via Context7, /vercel/next.js, docs/01-app/01-getting-started/03-layouts-and-pages.mdx]`. This project has no `experimental.ppr`/Cache Components flag in `next.config.mjs` `[VERIFIED: next.config.mjs, grep for ppr/experimental/cacheComponents/dynamicIO returned no matches]`, so the `<Suspense>`-scoped mitigation Next's own docs describe for that cost does not apply here without also adopting an experimental flag — a much bigger change than this phase should introduce.

**Mitigating factor:** `getCachedPost()` already wraps the Postgres query itself in `unstable_cache` `[VERIFIED: src/lib/cache.ts:181-196]`, independent of the route's dynamic/static classification — so even a fully-dynamic render of this route still hits a cached DB read, not a fresh query, on every request. The real cost is React server-render time per request, not database load.

**When to use which approach:**
- **Default (matches the already-checker-approved UI-SPEC):** accept the dynamic-rendering cost, ship it, and add an explicit verification task — run Lighthouse against a real post that has the block, comparing TTFB/LCP with and without a `?subscribed=pending` query string, against Phase 45's baseline numbers — before closing the phase. If it passes Phase 50's ≤5-point/no-CWV-band-cross bar, ship as specified.
- **Fallback if the Lighthouse check fails:** redirect the Server Action to a small, separate, already-inherently-dynamic acknowledgment surface (e.g., a dedicated low-traffic route) instead of back to the same post URL with a query string, and skip touching `searchParams` on the shared, cached post page entirely. This is a **deviation from the UI-SPEC's approved inline-swap interaction** and would need to go back through the checker/Juan, not be silently substituted.

This is presented as a decision point with an empirical gate, not resolved here — flag it explicitly in planning.

### Pattern 3: Proactive Resend-configured check (new, for MAIL-04)
**What:** Existing code (`contact.ts`, `subscribe.tsx`) only discovers a broken Resend key by *attempting* `payload.sendEmail` and catching the exception — which is correct for their use case (if the email fails, the visitor is told to retry or contact directly) but insufficient for MAIL-04's requirement that **the magnet still gets delivered** even without a working key. Mirror the existing `hasCloudinaryCreds` boolean pattern already in `payload.config.ts:46-49` for a new `isResendConfigured()`:

```typescript
// src/lib/resend-configured.ts
// Mirrors hasCloudinaryCreds (payload.config.ts) — same shape, new concern.
export function isResendConfigured(): boolean {
  const key = process.env.RESEND_API_KEY
  return Boolean(key && key.trim().length > 0)
}
```

Then the new Server Action branches **before** attempting to send: if not configured, skip the pending/email step, mark the subscriber `confirmed` immediately, and redirect straight into the success/download path in the same request — never leaving a subscriber stuck `pending` with no possible way to confirm.

### Pattern 4: Cloudinary private/signed PDF delivery (MAIL-03, MAIL-05)
```typescript
// src/lib/secure-download.ts
import { v2 as cloudinary } from 'cloudinary'

// Same cloudinary.config() call already happens in cloudinary-adapter.ts's
// module scope; the SDK's config is a process-wide singleton, so this file
// does not need to re-call cloudinary.config() as long as it's imported
// somewhere the adapter's module has already run — verify this assumption
// during implementation rather than assuming it (note in Assumptions Log).
export function resolveSignedDownloadUrl(publicId: string, expiresInSeconds = 900): string {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds
  return cloudinary.utils.private_download_url(publicId, 'pdf', {
    resource_type: 'raw',
    type: 'authenticated',
    expires_at: expiresAt,
    attachment: true,
  })
}
```
`[VERIFIED: Context7 /cloudinary/cloudinary_npm — private_download_url() signature and options (resource_type/type/expires_at/attachment) confirmed from official SDK docs; DeliveryType enum (upload/private/authenticated) confirmed from the same source]`. The upload call's exact `resource_type: 'raw', type: 'authenticated'` combination for a non-image private file is standard, well-established Cloudinary usage consistent with the confirmed `DeliveryType` enum, but the exact upload call site should be smoke-tested against the real Cloudinary account during execution (upload a test PDF, confirm it does NOT resolve via a plain public URL, confirm the signed URL works and expires) — tag as `[CITED: Cloudinary Node SDK docs]` pending that live verification, not `[VERIFIED]` for the upload half specifically.

### Anti-Patterns to Avoid
- **A second `subscribers` Postgres table/collection:** the slug already exists live; Payload will error on collision, and even a different name would duplicate the anti-enumeration/token logic that already works — extend, don't parallel-build.
- **Reusing `NewsletterForm.tsx` as-is for `EmailCaptureBlock`:** it's a client component; MAIL-01 requires zero added client JS for this specific new surface.
- **Trusting `NEXT_PUBLIC_SERVER_URL` for the confirmation email's link:** `subscribe.tsx`'s own docblock explains why it prefers the proxy-forwarded host (`resolveSiteUrl()`) — that env var is `http://localhost:3000` in dev and, left unchanged in prod, produces confirmation emails linking nowhere. Reuse `resolveSiteUrl()`/`publicOrigin()` (already used by the confirm/unsubscribe routes), don't reinvent host resolution.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Double opt-in state machine | A new pending/confirmed/unsubscribed flow | Extend the existing `Subscribers` collection + `/api/newsletter/confirm` | Already implements the exact anti-enumeration, token-based, never-search-by-email invariants MAIL-02 requires — proven in production. |
| Signed, expiring file URLs | A custom HMAC-signing scheme | `cloudinary.utils.private_download_url()` | Cloudinary's SDK already implements this exact primitive; hand-rolling URL signing is a security-sensitive wheel that's easy to get subtly wrong (timing-safe comparison, expiry format, etc.). |
| Confirmation email templates | A new HTML-string builder | `@react-email/components` + `BlogEmailLayout.tsx`/`theme.ts` (already extended once by `ConfirmSubscription.tsx`) | Reuse gets bilingual copy, plain-text fallback (`@react-email/render`'s `plainText` mode), and the site's established visual theme for free. |
| PDF generation | A hand-rolled HTML-to-PDF string concatenation or a brand-new heavy dependency | Playwright `page.pdf()` (already installed, already proven in this repo's scripts) | Avoids adding a new dependency for a document generated exactly twice, ever. |

**Key insight:** almost everything this phase needs already exists in some form in this codebase — either as the proven zero-JS form pattern (`ContactFormBlockComponent`), the proven double-opt-in collection (`Subscribers`), or the proven headless-browser tooling (`playwright`). The actual net-new surface area is small: a lead-magnet identity model, a signed-URL helper, and one new Lexical block.

## Common Pitfalls

### Pitfall 1: Silent collision with the existing `subscribers` table
**What goes wrong:** A plan that runs `payload migrate:create` for a brand-new `Subscribers` collection (as ROADMAP.md's original phrasing literally implies) either fails outright (slug/table already registered) or, worse, if renamed to avoid collision, ships a second parallel opt-in system with none of the existing anti-enumeration protections.
**Why it happens:** ROADMAP.md's v2.1 planning text predates the 2026-08-20 quick task that built the real `Subscribers` collection; nobody reconciled the two.
**How to avoid:** Read `src/collections/Subscribers/index.ts` and its migration before writing a single line of schema for this phase (already done in this research — see the dedicated section above).
**Warning signs:** `payload migrate:create` producing a diff that tries to `CREATE TABLE "subscribers"` a second time, or two different collections both claiming to own "the mailing list."

### Pitfall 2: `searchParams` silently disables ISR on the highest-traffic route in the site
**What goes wrong:** Adding `searchParams` to `blog/[category]/[slug]/page.tsx` to support the inline confirmation-state swap converts every post view into a per-request dynamic render, undoing the ISR setup that page's own docblock explains was deliberately built to avoid hammering the DB from the Dokploy build container.
**Why it happens:** Non-obvious Next.js behavior — dynamic API usage (`searchParams`/`cookies()`/`headers()`) is an all-or-nothing route-level classification without Partial Prerendering enabled, not a per-component opt-in.
**How to avoid:** See Architecture Pattern 2 above — verify empirically with Lighthouse before accepting, have a fallback ready.
**Warning signs:** Phase 50's gate showing a Lighthouse/CWV regression specifically on blog post routes that wasn't present on routes without the block.

### Pitfall 3: Catch-after-fail doesn't satisfy MAIL-04
**What goes wrong:** Reusing `contact.ts`/`subscribe.tsx`'s try/catch-on-`sendEmail` pattern verbatim leaves a subscriber `pending` forever with no email ever sent and no possible way to click a confirmation link — the magnet is never delivered, failing MAIL-04's explicit "el suscriptor igual queda registrado y el lead magnet igual se entrega."
**Why it happens:** That pattern was designed for the contact form (where "the send failed, sorry" is an acceptable outcome), not for a flow with a hard requirement that the artifact reach the visitor regardless of email delivery.
**How to avoid:** Proactive `isResendConfigured()` check (Pattern 3) *before* attempting to send, branching to an immediate-confirm path.
**Warning signs:** A test with a deliberately-blanked `RESEND_API_KEY` where the visitor never receives the magnet.

### Pitfall 4: TDZ/circular-import hazard reappears if `EmailCaptureCard` imports the wrong thing
**What goes wrong:** `richTextBlockConverters.tsx` imports `AffiliateInlineCard`; if `EmailCaptureCard` (or anything it imports) pulls in `RichTextRenderer`, `AffiliateDisclosure`, or `FAQComponent` (which imports `RichTextRenderer`, which imports `richTextBlockConverters.tsx`), the same production TDZ `ReferenceError` documented in this file's own docblock recurs.
**Why it happens:** `FAQComponent` → `RichTextRenderer` → `richTextBlockConverters.tsx` → (new) `EmailCaptureCard` → back to `RichTextRenderer` is a real cycle if not avoided.
**How to avoid:** `EmailCaptureCard` must only import the Server Action, shadcn `Input`/`Button`, and a plain `<a>` — exactly the constraint the UI-SPEC already states, now cross-referenced against the actual import graph.
**Warning signs:** `npm run build` logging "Cannot access ... before initialization."

### Pitfall 5: `resolveSiteUrl()`/proxy-host resolution must be reused, not reinvented
**What goes wrong:** A new Server Action that builds its own confirmation link from `NEXT_PUBLIC_SERVER_URL` ships broken links in production (that var reads `http://localhost:3000` unless carefully set) — this is the exact bug `subscribe.tsx`'s docblock documents fixing once already (see its two fix commits, `3585a9b`/`bcbc2af`).
**How to avoid:** Import/reuse the existing `resolveSiteUrl()` (from `subscribe.tsx`) or `publicOrigin()` (from the confirm/unsubscribe routes) rather than writing a third host-resolution helper.

## Code Examples

### Additive migration shape for `Subscribers` (MAIL-03/05's lead-magnet fields)
```typescript
// payload migrate:create will generate the real file; the shape to expect:
await db.execute(sql`
  CREATE TYPE "public"."enum_subscribers_opt_in_reason" AS ENUM('newsletter', 'lead-magnet');
  ALTER TABLE "subscribers" ADD COLUMN "opt_in_reason" "enum_subscribers_opt_in_reason" DEFAULT 'newsletter' NOT NULL;
  ALTER TABLE "subscribers" ADD COLUMN "lead_magnet_id" integer;
  ALTER TABLE "subscribers" ADD CONSTRAINT "subscribers_lead_magnet_fk"
    FOREIGN KEY ("lead_magnet_id") REFERENCES "public"."lead_magnets"("id") ON DELETE set null;
`)
```
Source: pattern inferred from `src/migrations/20260820_155934_subscribers_collection.ts`'s existing style (own read, this session) — the exact generated SQL is `payload migrate:create`'s output, not hand-written by the planner/executor.

### `EmailCaptureBlock` config (zero-config, per UI-SPEC Component Contract Detail)
```typescript
// src/blocks/EmailCaptureBlock/config.ts
import type { Block } from 'payload'

export const EmailCaptureBlock: Block = {
  slug: 'email-capture',
  interfaceName: 'EmailCaptureBlock',
  fields: [], // zero-config per UI-SPEC — the checklist/lead-magnet identity is
              // resolved server-side (single fixed concept for this phase),
              // not chosen per-instance by the editor
}
```
Pattern source: `src/blocks/AffiliateInlineBlock/config.ts` (own read, this session) — same `Block` shape, same kebab-case `slug` convention (`fields.blockType` literal).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Newsletter opt-in as a client-side React form (`NewsletterForm.tsx`, `useActionState`) | Zero-client-JS `<form action={fn}>` (proven by `ContactFormBlockComponent`, adopted for every new form since Phase 5) | Established Phase 5 (2026-07-10), NOT retrofitted onto `NewsletterForm` (2026-08-20, built after Phase 5 but not updated to the zero-JS pattern) | This phase's `EmailCaptureBlock` must follow the newer, stricter zero-JS convention even though the most recent sibling form (`NewsletterForm`) doesn't — don't pattern-match the most recent file, pattern-match the one that satisfies MAIL-01. |

**Deprecated/outdated:** none — no library versions changing in this phase.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `cloudinary.config()` is a process-wide singleton and does not need to be re-invoked in `secure-download.ts` as long as `cloudinary-adapter.ts`'s module has already run in the same process | Code Examples / Pattern 4 | Low — if wrong, `secure-download.ts` would need its own `cloudinary.config()` call, a one-line fix caught immediately by a failed test upload. |
| A2 | The exact `cloudinary.uploader.upload(..., { resource_type: 'raw', type: 'authenticated' })` call succeeds for a PDF exactly as it does for other Cloudinary SDK users (the upload half of the pattern, as opposed to the `private_download_url()` half, which IS `[VERIFIED: Context7]`) | Standard Stack / Architecture Pattern 4 | Medium — if the exact option combination is wrong, the PDF could upload as public or fail; mitigated by the plan's own recommended live smoke-test (upload a test PDF, confirm it does not resolve via a bare public URL) before trusting the real lead magnets to it. |
| A3 | Playwright's Chromium binaries are actually downloaded/available in whatever shell will run the one-off PDF-generation script during execution (confirmed used successfully by past scripts in this repo, but not re-verified live this session) | Standard Stack | Medium — if unavailable, the generation script fails immediately and loudly (not a silent content bug); fallback is `@react-pdf/renderer` (Alternatives Considered) or a one-time `npx playwright install chromium`. |
| A4 | Reconciliation strategy (extend `Subscribers`/confirm route vs. build a fully separate lead-magnet-only mini-system) — this research recommends "extend," but did not get explicit sign-off from Juan/checker on this specific approach, since CONTEXT.md/UI-SPEC were written without awareness of the pre-existing system | Pre-Existing Newsletter Infrastructure | High if wrong — the planner should treat this as a decision point requiring at least a `checkpoint:decision`, not silently proceed on this research's recommendation alone. |
| A5 | The exact copy of `/privacy`'s Resend/retention section (to reference, not duplicate, from `EmailCaptureBlock`'s microcopy) — this research confirmed the page is 100% Payload CMS content (`pages` collection, slug `privacy`, rendered via `RenderBlocks`), not hardcoded, but could not query the live database in this session to read the actual current wording | Copywriting Contract (UI-SPEC), not owned by this research | Low — the UI-SPEC only requires a link to `/privacy`, not a copy of its text; the executor should fetch the live content via Local API/MCP before finalizing microcopy that paraphrases it, to avoid drift. |

**If this table is empty:** N/A — see above.

## Open Questions

1. **Extend the existing `Subscribers`/confirm-route system, or build a parallel lead-magnet-only system?**
   - What we know: the existing system fully satisfies MAIL-02's double-opt-in invariants and lives in production; extending it is less code and less risk of divergent anti-enumeration behavior.
   - What's unclear: whether branching a live, already-shipped Server Action (`subscribeAction`) and Route Handler (`/api/newsletter/confirm`) that the blog's `NewsletterBlock` depends on is safe to do without regressing that existing feature — vs. a new, small, parallel Server Action that shares only the `Subscribers` collection and token logic.
   - Recommendation: default to a **new, small Server Action** (`subscribe-lead-magnet.ts`) that reuses the collection/token/rate-limit *pattern* but does not modify `subscribeAction`'s own FormData contract or redirect targets — lower blast radius on a live feature — while still branching `/api/newsletter/confirm` (which is read-only with respect to which action created the row, so branching it by `subscriber.optInReason`/`leadMagnet` is lower-risk than branching the write path).

2. **Segment name for the confirm page.**
   - What we know: CONTEXT.md says "vive dentro de `[locale]`," UI-SPEC leaves the exact segment "the planner's call," following the existing translated-pathname convention (`/servicios`↔`/services`).
   - What's unclear: whether it should live under `/blog/` (since the source is always a blog post) or as a sitewide top-level route.
   - Recommendation: `/blog/confirmar` (ES) ↔ `/blog/confirm` (EN), matching the translated-pathname convention and scoping it clearly to the blog surface it originates from — but this is a naming call for the planner, not a locked decision.

3. **Single bilingual PDF vs. two separate PDF files.**
   - What we know: CONTEXT.md explicitly defers this to planning ("dos archivos separados (o el mismo archivo con ambos idiomas)").
   - What's unclear: nothing technical blocks either — Cloudinary can store either shape equally well.
   - Recommendation: two separate files (one `public_id` per locale in the new `lead-magnets` collection) — simpler `resolveSignedDownloadUrl(locale)` lookup, no risk of serving the wrong language section of a combined document, and matches the "two locale-specific files" framing the UI-SPEC's PDF Layout section already assumes throughout.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `RESEND_API_KEY` (real, non-placeholder) | Happy-path email delivery (confirmation emails) | ✓ (per task prompt — Juan set a real key 2026-09-07; not independently re-verified in this session, `.env` reads were denied by sandbox permissions) | — | MAIL-04's degraded path (this phase's own deliverable) |
| Cloudinary credentials (`CLOUDINARY_CLOUD_NAME`/`API_KEY`/`API_SECRET`) | PDF upload + signed URL generation | ✓ (already required for Media collection, confirmed wired in `payload.config.ts`) | — | none needed — Cloudinary is not env-gated in this project, only Resend is |
| Playwright + Chromium | One-off PDF generation script | ✓ (already a devDependency, already used successfully by existing scripts in this repo) | `^1.61.1` | `@react-pdf/renderer` (new dependency, requires legitimacy check) |
| Postgres (Dokploy/shared-postgres) | `payload migrate:create`/`migrate`, all reads/writes | ✓ (used by every prior phase) | — | — |

**Missing dependencies with no fallback:** none identified.
**Missing dependencies with fallback:** none currently missing — table above documents what exists, not gaps.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No user authentication involved in the public capture flow (this is anonymous opt-in, not login). |
| V3 Session Management | No | No session state — the confirmation token is a one-time bearer credential, not a session. |
| V4 Access Control | Yes | `Subscribers`/new `lead-magnets` collection access stays `authenticated`-only on all CRUD ops (already the pattern for `Subscribers`); public writes only via `overrideAccess: true` from the Server Action, same as today. |
| V5 Input Validation | Yes | Server-side email regex + `type="email"`/`required` HTML attributes (defense in depth, not a replacement for server validation) — same pattern as `contact.ts`/`subscribe.tsx`. |
| V6 Cryptography | Yes | Confirmation token: `crypto.randomBytes(32)` (existing pattern, cryptographically strong, never hand-roll a weaker generator). Cloudinary signed URLs: HMAC-based signing internal to the SDK (`private_download_url`) — never construct a signature manually. |
| V9 Communication | Yes | Resend transport is TLS by default (SaaS API over HTTPS); confirmation link tokens travel over HTTPS in production (verify no `http://` leakage via `resolveSiteUrl()`'s proxy-header handling). |
| V12 File and Resources | Yes | The PDF must be uploaded as `type: 'authenticated'` (never `upload`, which is public-by-default) — this is the entire point of MAIL-03; a code review should specifically check this literal string, since a typo here (`'upload'` instead of `'authenticated'`) silently makes the "private" resource public with no error. |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Email enumeration via differing responses ("already subscribed" vs "new signup") | Information Disclosure | Already correctly mitigated in the existing `subscribeAction` (never reveals prior existence) — the new lead-magnet action must replicate this, not regress it. |
| Confirmation token guessing/brute-force | Spoofing | 32-byte random token (2^256 space) makes brute-force infeasible; lookup is by token only, never by (email, guessed-token) pair. |
| Signed URL leaking beyond intended short window | Information Disclosure | `expires_at` set to a short window (recommend ≤15 min per the UI-SPEC's "expiración corta" framing) computed server-side at confirm-page render time, never cached/reused across requests. |
| Reactivating an unsubscribed address via an old confirm link | Tampering | Already mitigated in the existing route (`reactivable` check refuses to flip `unsubscribed`→`confirmed`) — the lead-magnet branch must inherit this same guard, not bypass it. |
| Cloudinary API secret exposure | Information Disclosure | `secure-download.ts` must remain server-only (never imported into a Client Component or exposed via a public API route that echoes the secret) — same discipline `cloudinary-adapter.ts` already follows. |

## Sources

### Primary (HIGH confidence)
- `src/collections/Subscribers/index.ts`, `src/app/actions/subscribe.tsx`, `src/app/api/newsletter/{confirm,unsubscribe}/route.ts`, `src/blocks/NewsletterBlock/{config,Component,NewsletterForm}.tsx`, `src/emails/ConfirmSubscription.tsx` — read directly, this session.
- `src/blocks/AffiliateInlineBlock/config.ts`, `src/components/AffiliateInlineCard.tsx`, `src/components/richTextBlockConverters.tsx`, `src/components/RichTextRenderer.tsx` — read directly, this session.
- `src/blocks/ContactFormBlock/Component.tsx`, `src/app/actions/contact.ts` — read directly, this session (zero-client-JS proven pattern).
- `src/lib/cloudinary-adapter.ts`, `src/payload.config.ts`, `src/lib/sitemap-data.ts` — read directly, this session (env-gate pattern, mcpPlugin/SITEMAP_COLLECTIONS exclusion, existing Cloudinary adapter scope).
- `src/app/(frontend)/[locale]/blog/[category]/[slug]/page.tsx`, `src/app/(frontend)/[locale]/blog/page.tsx`, `src/app/(frontend)/[locale]/contact/page.tsx`, `src/app/(frontend)/[locale]/search/page.tsx`, `src/app/(frontend)/[locale]/privacy/page.tsx` — read directly, this session (ISR config, `searchParams` conventions, `robots:{index:false}` precedent).
- `src/lib/cache.ts` (`getCachedPost`) — read directly, this session.
- `src/migrations/20260820_155934_subscribers_collection.ts`, `src/migrations/index.ts` — read directly, this session.
- Context7 `/cloudinary/cloudinary_npm` — `private_download_url()`, `DeliveryType` enum, uploader options — HIGH confidence, official SDK docs.
- Context7 `/vercel/next.js` — `searchParams` dynamic-rendering behavior, Suspense-scoping caveat — HIGH confidence, official docs.
- `.planning/quick/260820-blg-blog-redesign-cro-y-newsletter/260820-blg-PLAN.md` — read directly, this session (origin/intent of the pre-existing newsletter system).
- `package.json` — read directly, this session (installed versions).

### Secondary (MEDIUM confidence)
- Cloudinary upload options (`resource_type: 'raw'`, `type: 'authenticated'`) for the upload call specifically (as opposed to `private_download_url`, which is HIGH/VERIFIED) — Context7 confirmed the `DeliveryType` enum values exist but did not return a single exhaustive upload-with-authenticated-type code snippet; treat as `[CITED]` pending a live smoke-test.

### Tertiary (LOW confidence)
- None used as load-bearing claims — where confidence was uncertain, this document says so explicitly (see Assumptions Log) rather than presenting it as fact.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages, all versions read directly from `package.json`.
- Architecture: MEDIUM — the reconciliation strategy with the pre-existing newsletter system is a well-evidenced recommendation, not a locked decision; the `searchParams`/ISR finding is HIGH-confidence on the mechanism (Context7-cited) but MEDIUM on its real-world performance impact (needs empirical Lighthouse verification, not yet run).
- Pitfalls: HIGH — all five pitfalls are grounded in files read this session, not speculation.

**Research date:** 2026-09-07
**Valid until:** 14 days (this phase depends on a fast-moving pre-existing-system discovery that the planner must actively reconcile — re-verify the `Subscribers`/`NewsletterBlock` state if planning is delayed, in case another quick task touches it in the meantime).
