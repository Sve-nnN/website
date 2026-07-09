import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  localePrefix: 'as-needed',
  // CRITICAL for SEO URL parity (RESEARCH.md Pitfall 1): without this,
  // Accept-Language sniffing could redirect the unprefixed Spanish root for
  // English-preferring browsers/bots, which the current site never does.
  localeDetection: false,
})
