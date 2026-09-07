// Pure module: zero Payload/DB imports, safe to import from Client Components
// as well as Server Components (same principle as src/lib/service-slugs.ts).
//
// AUDITOR_URL and AUDITOR_STATS are facts about a product Juan controls the
// accuracy of, not editorial copy — deliberately hardcoded here instead of
// Payload fields, so an editor cannot accidentally inflate a number that
// FEAT-02 requires to stay literally true. See 48.5-UI-SPEC.md "Home Block".

/** Destination of every outbound CTA pointing at Juan's own SEO auditor. */
export const AUDITOR_URL = 'https://auditor.juan-tech.com'

/**
 * The 4 verifiable facts about the auditor, surfaced on all 3 phase-48.5
 * surfaces (Home, the seo-technical-audit landing, /stack). `labelKey` maps
 * to the `auditorHighlight` i18n namespace (messages/{es,en}.json).
 */
export const AUDITOR_STATS = [
  { value: '29', labelKey: 'statsChecks' },
  { value: '5', labelKey: 'statsCategories' },
  { value: '500', labelKey: 'statsUrls' },
  { value: 'CWV', labelKey: 'statsCwv' },
] as const
