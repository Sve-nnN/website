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
      <div className="flex flex-wrap items-center justify-center gap-8">
        {logos.map((client) => {
          const logo = typeof client.logo === 'object' ? client.logo : null
          if (!logo?.url) return null

          const image = (
            <div className="flex h-10 md:h-12 items-center">
              <Image
                src={logo.url}
                alt={logo.alt ?? client.name}
                width={160}
                height={48}
                className="h-full w-auto max-w-[140px] object-contain grayscale opacity-70 hover:opacity-100 hover:grayscale-0 transition-all duration-base ease-standard"
              />
            </div>
          )

          return client.websiteUrl ? (
            <a key={client.id} href={client.websiteUrl} target="_blank" rel="noopener noreferrer">
              {image}
            </a>
          ) : (
            <div key={client.id}>{image}</div>
          )
        })}
      </div>
    </Container>
  )
}
