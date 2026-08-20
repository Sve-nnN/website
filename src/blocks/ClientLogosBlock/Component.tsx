import { getPayload } from 'payload'

import type { ClientLogosBlock as ClientLogosBlockProps, Cliente } from '@/payload-types'

import config from '@/payload.config'
import { Container } from '@/components/Container'
import { ClientLogo } from '@/components/ClientLogo'

/**
 * The logo wall, grouped by the kind of work each client bought.
 *
 * WHY GROUPED — an ungrouped wall is the most copied habit in this category:
 * every competitor analysed has one, and none of them says anything with it.
 * Juan has permission to show all 28 logos but cannot disclose what he did
 * for any single client, so per-client context is off the table. Three
 * coarse buckets are what he CAN say, and they happen to say the thing that
 * matters most against an agency: that the same person covers SEO,
 * development and optimisation.
 *
 * The groups are ordered by count, largest first, so the wall leads with
 * whatever he has actually done most of rather than with a fixed editorial
 * order that could leave a two-logo group at the top.
 */

const GROUP_LABELS: Record<string, { es: string; en: string }> = {
  seo: { es: 'SEO', en: 'SEO' },
  desarrollo: { es: 'Desarrollo', en: 'Development' },
  optimizacion: { es: 'Optimización', en: 'Optimisation' },
}

function LogoCell({ client }: { client: Cliente }) {
  const logo = typeof client.logo === 'object' ? client.logo : null
  if (!logo?.url) return null

  // Featured clients get a taller cell, which is the whole mechanism: a
  // stranger does not evaluate 28 brands, they catch on the one they already
  // know and read outward from it. Size carries the hierarchy on purpose —
  // colour would mean a second signal competing with the page's one decision.
  const cellHeight = client.featured ? 'h-16 md:h-20 max-w-[200px]' : 'h-12 max-w-[140px]'

  const image = (
    // POLISH (kept from the ungrouped version): normalizing on height alone
    // let each logo take whatever width its artwork implied — measured 48px
    // to 140px across one row, so wordmarks shouted and square marks
    // vanished. A fixed cell with `object-contain` gives every client the
    // same optical footprint.
    <div className={`flex w-full items-center justify-center ${cellHeight}`}>
      <ClientLogo
        src={logo.url}
        alt={logo.alt ?? client.name}
        name={client.name}
        featured={Boolean(client.featured)}
      />
    </div>
  )

  return client.websiteUrl ? (
    <a
      href={client.websiteUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={client.name}
      className="flex w-full items-center justify-center rounded-md p-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:shadow-focus"
    >
      {image}
    </a>
  ) : (
    <div className="flex w-full items-center justify-center p-1">{image}</div>
  )
}

export async function ClientLogosBlockComponent(
  props: ClientLogosBlockProps & { locale?: string },
) {
  const { title, clients, locale } = props
  const payload = await getPayload({ config })

  let logos: Cliente[]

  if (clients && clients.length > 0) {
    logos = clients.filter((c): c is Cliente => typeof c === 'object')
  } else {
    const result = await payload.find({ collection: 'clientes', limit: 50 })
    logos = result.docs
  }

  if (logos.length === 0) return null

  const lang = locale === 'en' ? 'en' : 'es'

  const grouped = logos.reduce<Record<string, Cliente[]>>((acc, client) => {
    const key = client.workType ?? 'seo'
    ;(acc[key] ??= []).push(client)
    return acc
  }, {})

  const groups = Object.entries(grouped)
    .filter(([, members]) => members.length > 0)
    .sort((a, b) => b[1].length - a[1].length)
    // Featured first inside each group, so the recognisable names open the row
    // instead of landing wherever the collection happened to order them.
    .map(([key, members]) => {
      const sorted = [...members].sort(
        (a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)),
      )
      return [key, sorted] as const
    })

  return (
    <Container className="py-12 md:py-16">
      {title && <h2 className="font-heading text-heading tracking-tight">{title}</h2>}

      <div className="mt-8 flex flex-col gap-10">
        {groups.map(([key, members]) => (
          <div key={key}>
            {/* The group label is a heading, not a decorative eyebrow: it is
                the only thing on this wall carrying information, so it gets
                to be read as such. The count is part of the claim. */}
            <h3 className="flex items-baseline gap-3 text-label text-muted-foreground">
              <span className="text-foreground">{GROUP_LABELS[key]?.[lang] ?? key}</span>
              <span className="tabular-nums">{members.length}</span>
              <span aria-hidden="true" className="h-px flex-1 bg-border" />
            </h3>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 items-center gap-x-6 gap-y-8 justify-items-center">
              {members.map((client) => (
                <LogoCell key={client.id} client={client} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Container>
  )
}
