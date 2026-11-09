import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { extractLegalRichTexts, LegalView } from '@/components/pages/LegalView'
import { getCachedPageBySlug } from '@/lib/cache'
import { buildOpenGraph } from '@/lib/og-image'
import { buildAlternates } from '@/lib/canonical'
import { pageTitle } from '@/lib/page-title'

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

async function getPage(locale: string) {
  return getCachedPageBySlug('privacy', locale as 'es' | 'en')
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const doc = await getPage(locale)
  const meta = doc?.meta

  const title = meta?.title ?? doc?.title ?? (locale === 'es' ? 'Política de Privacidad' : 'Privacy Policy')
  const description = meta?.description ?? ''
  const url = locale === 'en' ? '/en/privacy' : '/privacy'

  return {
    title: pageTitle(title),
    description,
    openGraph: buildOpenGraph({
      title,
      description,
      url,
      locale: locale as 'es' | 'en',
      slug: 'privacy',
      metaImage: meta?.image,
    }),
    alternates: buildAlternates(locale as 'es' | 'en', '/privacy', '/en/privacy'),
  }
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const doc = await getPage(locale)

  if (!doc) {
    notFound()
  }

  const [t, tCommon] = await Promise.all([getTranslations('legal'), getTranslations('common')])

  // Sin JSON-LD: la ruta no lo emitia antes y el contrato de SEO no cambia (SEO-01).
  return (
    <LegalView
      title={doc.title}
      crumbs={[
        { label: tCommon('breadcrumbHome'), href: '/' },
        { label: doc.title },
      ]}
      richTexts={extractLegalRichTexts(doc.content?.layout)}
      eyebrow={t('eyebrow')}
      tocLabel={t('tocLabel')}
    />
  )
}
