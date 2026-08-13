/**
 * Offline render check for published post bodies: renders each post's Lexical
 * `content` through the SAME converter stack the frontend uses
 * (`richTextConverters`) with react-dom/server, and reports which
 * posts/locales throw or drop embedded blocks. Reads content over Neon's HTTP
 * SQL endpoint, so it works even when TCP 5432 is unreachable.
 *
 * Run: node --env-file=.env node_modules/.bin/tsx scripts/repro-richtext-render.tsx
 */
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { RichText } from '@payloadcms/richtext-lexical/react'

import { richTextConverters } from '../src/components/richTextBlockConverters'
import { sql } from './neon-sql.mjs'

async function main() {
  const rows = (await sql(`
    select p.slug, pl._locale as locale, pl.content::text as content
    from posts_locales pl
    join posts p on p.id = pl._parent_id
    where p._status = 'published' and pl.content is not null
    order by p.slug, pl._locale
  `)) as { slug: string; locale: string; content: string }[]

  let ok = 0
  let withBlocks = 0
  let blocksRendered = 0
  const failures: string[] = []

  for (const row of rows) {
    try {
      const data = JSON.parse(row.content)
      const html = renderToStaticMarkup(
        React.createElement(RichText, { data, converters: richTextConverters } as never),
      )
      ok++

      const blockCount = (data.root?.children ?? []).filter(
        (n: { type?: string }) => n.type === 'block',
      ).length

      if (blockCount > 0) {
        withBlocks++
        // code-block renders a <pre>, faq renders a <details>
        if (html.includes('<pre') || html.includes('<details')) blocksRendered++
        else failures.push(`${row.slug} [${row.locale}]: ${blockCount} block node(s) rendered empty`)
      }
    } catch (err) {
      failures.push(`${row.slug} [${row.locale}]: THREW ${(err as Error).message}`)
    }
  }

  console.log(`rendered OK: ${ok} / ${rows.length}`)
  console.log(`docs containing block nodes: ${withBlocks}, of which rendered: ${blocksRendered}`)
  if (failures.length) {
    console.log('FAILURES:')
    for (const f of failures) console.log('  ' + f)
  }
  process.exit(failures.length ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
