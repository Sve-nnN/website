import { getLocale } from 'next-intl/server'

import type { ContentBlock as ContentBlockProps } from '@/payload-types'

import { Container } from '@/components/Container'
import { RichTextRenderer } from '@/components/RichTextRenderer'
import { CMSLink } from '@/components/CMSLink'
import { normalizeServiceHref } from '@/lib/service-slugs'

const sizeToColSpan: Record<string, string> = {
  oneThird: 'md:col-span-4',
  half: 'md:col-span-6',
  twoThirds: 'md:col-span-8',
  full: 'md:col-span-12',
}

export async function ContentComponent(props: ContentBlockProps) {
  const { columns } = props
  const locale = (await getLocale()) as 'en' | 'es'

  return (
    <Container className="py-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {columns?.map((col, i) => {
          // FIX (live bug reported by Juan, 2026-07-13): `link.url` is a
          // non-localized field — Payload's per-locale writes share a single
          // stored value, so whichever locale was seeded last "wins" for
          // every locale. Correct known Services dual-segment mismatches at
          // render time instead (no-op for any other link).
          const link =
            col.enableLink && col.link?.url
              ? { ...col.link, url: normalizeServiceHref(col.link.url, locale) }
              : col.link

          return (
            <div key={i} className={sizeToColSpan[col.size ?? 'oneThird']}>
              <RichTextRenderer data={col.richText} />
              {col.enableLink && link && <CMSLink {...link} className="mt-4 inline-block" />}
            </div>
          )
        })}
      </div>
    </Container>
  )
}
