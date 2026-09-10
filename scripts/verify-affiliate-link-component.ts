/**
 * Phase 46 Plan 01, Task 3 — verifies AffiliateLink renders a direct anchor
 * with the exact hardcoded `rel`, preserves `tag=` verbatim, and never emits
 * a referrer-policy override or a /go/ redirect segment.
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/verify-affiliate-link-component.ts
 */
import { renderToStaticMarkup } from 'react-dom/server'

import { AffiliateLink } from '../src/components/AffiliateLink'

const TEST_HREF = 'https://amazon.com/dp/B0EXAMPLE?tag=juantech02-20'

function main() {
  const html = renderToStaticMarkup(
    AffiliateLink({ href: TEST_HREF, children: 'Ver en Amazon' }),
  )

  const failures: string[] = []

  if (!html.includes('rel="sponsored nofollow noopener"')) {
    failures.push(`rel exacto no encontrado en el HTML renderizado (html: ${html})`)
  }

  if (!html.includes('tag=juantech02-20')) {
    failures.push('tag= no preservado verbatim en el href renderizado')
  }

  if (/referrerpolicy/i.test(html)) {
    failures.push('el HTML renderizado contiene un override de referrer-policy')
  }

  if (/\/go\//i.test(html)) {
    failures.push('el HTML renderizado contiene una ruta de redirect propia (/go/)')
  }

  if (failures.length > 0) {
    console.log(`FAIL: ${failures.join(' | ')}`)
    process.exit(1)
  }

  console.log('PASS')
  process.exit(0)
}

main()
