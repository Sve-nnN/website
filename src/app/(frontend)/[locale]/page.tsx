import { notFound } from 'next/navigation'

import { JsonLd } from '@/components/JsonLd'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { sendContactMessage } from '@/app/actions/contact'
import { buildOpenGraph } from '@/lib/og-image'
import { buildAlternates } from '@/lib/canonical'
import { getCachedPageBySlug } from '@/lib/cache'
import { buildSitePerson } from '@/lib/person'
import { buildWebSite, buildProfessionalService } from '@/lib/site-schema'

// SEO-06: la home servia `cache-control: no-store` y re-ejecutaba el SSR
// entero en cada request -- 1,2 s de render sobre un TTFB de 2,1 s, medido el
// 2026-08-20. Eso venia de `force-dynamic`, que estaba por una razon real: el
// build de Dokploy corre en un contenedor sin red hacia shared-postgres, asi
// que cualquier prerender en `next build` falla.
//
// ISR resuelve las dos cosas a la vez: `generateStaticParams` devuelve una
// lista VACIA, o sea que el build no renderiza ni una ruta y nunca toca la
// base; `dynamicParams` (true por defecto) deja que cada locale se renderice
// en la primera visita y quede en la cache incremental, y de ahi salen las
// siguientes hasta que algo la invalide.
//
// La frescura no depende del TTL: los hooks de contenido llaman
// `revalidatePath` (src/lib/cache-tags.ts), asi que publicar en el admin
// actualiza la pagina sin esperar. El TTL es la red de seguridad.
export const revalidate = 60

export function generateStaticParams(): Array<{ locale: string }> {
  return []
}

// Phase 43 (43-01): wrapped in unstable_cache (src/lib/cache.ts) — same
// query/signature as before, so generateMetadata + HomePage (which each call
// this once per request) now share a request-scoped Data Cache entry instead
// of both hitting Postgres directly.
async function getHomePage(locale: string) {
  return getCachedPageBySlug('home', locale as 'es' | 'en')
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const doc = await getHomePage(locale)
  const meta = doc?.meta

  const title = meta?.title ?? doc?.title ?? 'Juan Carlos Angulo'
  const description = meta?.description ?? ''

  return {
    title,
    description,
    openGraph: buildOpenGraph({
      title,
      description,
      url: locale === 'en' ? '/en' : '/',
      locale: locale as 'es' | 'en',
      slug: 'home',
      metaImage: meta?.image,
    }),
    alternates: buildAlternates(locale as 'es' | 'en', '/', '/en'),
  }
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const doc = await getHomePage(locale)

  if (!doc) {
    notFound()
  }

  // SEO-03.3: la home emitia un Person de cuatro propiedades mientras
  // /authors/juan-carlos-angulo emitia el completo. Dos nodos sueltos para la
  // misma persona, en un nombre que ya colisiona con otras personas reales en
  // los resultados. Ahora las dos paginas emiten el MISMO nodo, con el @id
  // canonico de src/lib/person.ts.
  const personData = await buildSitePerson(locale as 'es' | 'en')

  // SEO-48: la home emitia SOLO el Person. Faltaban las dos entidades que
  // describen al sitio y al negocio, sin las cuales "juan-tech.com" no esta
  // declarado en ningun lado como publicacion ni como quien presta servicios.
  // Los tres nodos comparten @id y se referencian entre si (src/lib/site-schema.ts).
  const websiteData = buildWebSite(locale as 'es' | 'en')
  const businessData = buildProfessionalService(locale as 'es' | 'en')

  return (
    <main>
      <RenderBlocks
        blocks={doc.content?.layout ?? []}
        blockProps={{
          // The logo wall labels its groups (SEO / Desarrollo / Optimización)
          // and those labels are UI strings, not content, so they don't come
          // from Payload's localized fields — the block needs to know which
          // locale it is rendering in.
          clientLogosBlock: { locale },
          contactFormBlock: {
            onSubmit: sendContactMessage,
            locale,
            contactEmail: process.env.CONTACT_TO_EMAIL,
          },
        }}
      />
      <JsonLd data={personData} />
      <JsonLd data={websiteData} />
      <JsonLd data={businessData} />
    </main>
  )
}
