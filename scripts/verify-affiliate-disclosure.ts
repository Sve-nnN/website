/**
 * Phase 46 Plan 02, Task 1 — verification contract for AffiliateDisclosure.
 *
 * This file is documentation, NOT a standalone script to run with `tsx`.
 * `AffiliateDisclosure` calls `getTranslations()` from `next-intl/server`,
 * which needs next-intl's request-config resolution — that only exists
 * inside a real Next.js request (a Route Handler or a Server Component
 * render), the same class of "needs Next's runtime" limitation
 * 46-RESEARCH.md's Open Question 1 documents. A plain `tsx` process has no
 * such context, so this component cannot be unit-tested the way
 * `pickDestination()` or `AffiliateLink` are in Plan 46-01.
 *
 * The real verification for this task runs over HTTP against the running
 * dev server, hitting the throwaway route handler
 * `src/app/api/_dev-preview/affiliate-disclosure/route.ts` (removed in
 * Task 3 once the Spanish Amazon phrase is approved and written):
 *
 *   curl "http://localhost:3000/api/_dev-preview/affiliate-disclosure?locale=en&hasAmazonLinks=true"
 *     -> must contain the verbatim Amazon sentence: "As an Amazon Associate
 *        I earn from qualifying purchases."
 *
 *   curl "http://localhost:3000/api/_dev-preview/affiliate-disclosure?locale=es&hasAmazonLinks=false"
 *     -> must contain the Spanish general disclosure (checked via the word
 *        "afiliado")
 *
 * See 46-02-PLAN.md's <verify> block for the exact automated commands.
 */
export {}
