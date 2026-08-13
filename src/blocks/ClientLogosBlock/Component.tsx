import Image from 'next/image'
import { getPayload } from 'payload'

import type { ClientLogosBlock as ClientLogosBlockProps, Cliente } from '@/payload-types'

import config from '@/payload.config'
import { Container } from '@/components/Container'

export async function ClientLogosBlockComponent(props: ClientLogosBlockProps) {
  const { title, clients } = props
  const payload = await getPayload({ config })

  let logos: Cliente[]

  if (clients && clients.length > 0) {
    logos = clients.filter((c): c is Cliente => typeof c === 'object')
  } else {
    const result = await payload.find({ collection: 'clientes', limit: 50 })
    logos = result.docs
  }

  if (logos.length === 0) return null

  return (
    <Container className="py-12">
      {title && <h2 className="font-heading text-heading mb-6 text-center">{title}</h2>}
      {/* POLISH: normalizing on height alone let each logo take whatever width
          its artwork implied — measured 48px to 140px across the same row, so
          wordmarks shouted and square marks vanished. A fixed cell with
          `object-contain` gives every client the same optical footprint and
          lines the grid up on both axes, which a wrapping flex row could not
          do for its last, partly-filled row. */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-8 justify-items-center">
        {logos.map((client) => {
          const logo = typeof client.logo === 'object' ? client.logo : null
          if (!logo?.url) return null

          const image = (
            <div className="flex h-12 w-full max-w-[140px] items-center justify-center">
              <Image
                src={logo.url}
                alt={logo.alt ?? client.name}
                width={160}
                height={48}
                className="max-h-full w-auto max-w-full object-contain grayscale opacity-70 transition-all duration-base ease-standard hover:opacity-100 hover:grayscale-0"
              />
            </div>
          )

          return client.websiteUrl ? (
            <a
              key={client.id}
              href={client.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={client.name}
              // POLISH: these were the only links on the page with no focus
              // treatment and no accessible name beyond the image alt.
              className="flex w-full items-center justify-center rounded-md p-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:shadow-focus"
            >
              {image}
            </a>
          ) : (
            <div key={client.id} className="flex w-full items-center justify-center p-1">
              {image}
            </div>
          )
        })}
      </div>
    </Container>
  )
}
