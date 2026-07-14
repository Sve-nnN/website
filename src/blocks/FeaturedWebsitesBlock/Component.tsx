import { getPayload } from 'payload'
import { getLocale } from 'next-intl/server'

import type { FeaturedWebsitesBlock as FeaturedWebsitesBlockProps, Website } from '@/payload-types'

import config from '@/payload.config'
import { Container } from '@/components/Container'
import { WebsiteCard } from '@/components/WebsiteCard'

export async function FeaturedWebsitesBlockComponent(props: FeaturedWebsitesBlockProps) {
  const { title, limit } = props
  const payload = await getPayload({ config })
  const locale = (await getLocale()) as 'en' | 'es'

  const featuredContent = await payload.findGlobal({
    slug: 'featured-content',
    depth: 1,
    locale,
  })

  const websites = (featuredContent.featuredWebsites ?? [])
    .filter((w): w is Website => typeof w === 'object')
    .slice(0, limit ?? 3)

  if (websites.length === 0) return null

  return (
    <Container className="py-12">
      {title && <h2 className="font-heading text-heading mb-6">{title}</h2>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {websites.map((w) => (
          <WebsiteCard key={w.id} website={w} />
        ))}
      </div>
    </Container>
  )
}
