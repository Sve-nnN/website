/**
 * Deterministic per-slug hero-image fallback, replicating JuanPortfolio's
 * PostHero behavior: 0/73 real migrated posts ever had a `heroImage` by
 * original design (see STATE.md Phase 4 note) — the old site computed a
 * stable fallback from a 53-image Cloudinary pool at render time instead of
 * backfilling the DB. Same slug must always resolve to the same image,
 * across process restarts and locales — no `Math.random`, no Date-based seed.
 */

const FALLBACK_POOL_SIZE = 53
const FALLBACK_BASE_URL = 'https://res.cloudinary.com/dmufha3qv/image/upload/f_auto,q_auto/portfolio'

/**
 * FNV-1a 32-bit hash — simple, fast, deterministic string hash with good
 * distribution for short strings like slugs.
 */
function fnv1aHash(input: string): number {
  let hash = 0x811c9dc5

  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }

  return hash >>> 0
}

export function getFallbackHeroImage(slug: string): string {
  const hash = fnv1aHash(slug)
  const n = (hash % FALLBACK_POOL_SIZE) + 1

  return `${FALLBACK_BASE_URL}/fallback-image-${n}.avif`
}

// Sanity check: same slug must always map to the same fallback image.
console.assert(
  getFallbackHeroImage('some-slug') === getFallbackHeroImage('some-slug'),
  'getFallbackHeroImage must be deterministic for a given slug',
)
