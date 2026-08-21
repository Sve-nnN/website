import Image from 'next/image'
import { getPayload } from 'payload'

import config from '@payload-config'
import { Link } from '@/i18n/navigation'
import { Container } from '@/components/Container'
import { PageHero } from '@/components/PageHero'
import { JsonLd } from '@/components/JsonLd'
import { buildAuthorsTrail, buildBreadcrumbJsonLd } from '@/lib/breadcrumbs'
import { Badge } from '@/components/ui/badge'
import { buildOpenGraph } from '@/lib/og-image'
import { buildAlternates } from '@/lib/canonical'

// SEO-06: estas rutas servian `cache-control: no-store` y re-ejecutaban el SSR
// completo en cada request. Venia de `force-dynamic`, que estaba por una razon
// real: el build de Dokploy corre en un contenedor sin red hacia
// shared-postgres, asi que cualquier prerender en `next build` falla.
//
// ISR resuelve las dos cosas: `generateStaticParams` devuelve una lista VACIA,
// o sea que el build no renderiza ni una ruta y nunca toca la base;
// `dynamicParams` (true por defecto) deja que cada URL se renderice en la
// primera visita y quede en la cache incremental, y de ahi salen las
// siguientes. Verificado en el prerender-manifest: cero rutas prerenderizadas.
//
// La frescura no depende del TTL: los hooks de contenido llaman
// `revalidatePath` (src/lib/cache-tags.ts), asi que publicar en el admin
// actualiza la pagina sin esperar los 60 s. El TTL es la red de seguridad.
export const revalidate = 60

export function generateStaticParams(): Array<{ locale: string }> {
  return []
}

async function getAuthors(locale: string) {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'authors',
    locale: locale as 'es' | 'en',
    limit: 50,
  })
  return docs
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const title = locale === 'es' ? 'Autores' : 'Authors'
  return {
    title,
    openGraph: buildOpenGraph({
      title,
      url: locale === 'en' ? '/en/authors' : '/authors',
      locale: locale as 'es' | 'en',
      slug: 'authors',
    }),
    alternates: buildAlternates(locale as 'es' | 'en', '/authors', '/en/authors'),
  }
}

export default async function AuthorsListPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const authors = await getAuthors(locale)
  const trail = buildAuthorsTrail(locale as 'es' | 'en')

  return (
    <main>
      <PageHero
        variant="index"
        trail={trail}
        title={locale === 'es' ? 'Autores' : 'Authors'}
      />

      <Container className="py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {authors.map((author) => {
            const avatar = typeof author.avatar === 'object' ? author.avatar : null
            const firstCredential = author.credentials?.[0]

            return (
              <Link
                key={author.id}
                href={`/authors/${author.slug}`}
                className="rounded-lg border border-border bg-card p-6 text-center hover:shadow-md transition-shadow"
              >
                {avatar?.url && (
                  <Image
                    src={avatar.url}
                    alt={avatar.alt ?? author.name}
                    width={80}
                    height={80}
                    className="mx-auto rounded-full object-cover"
                  />
                )}
                <p className="mt-4 font-heading text-heading">{author.name}</p>
                {author.jobTitle && <p className="text-body text-muted-foreground">{author.jobTitle}</p>}
                {firstCredential && (
                  <Badge variant="secondary" className="mt-3">
                    {firstCredential.label}
                  </Badge>
                )}
              </Link>
            )
          })}
        </div>
      </Container>
      <JsonLd data={buildBreadcrumbJsonLd(trail)} />
    </main>
  )
}
