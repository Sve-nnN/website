import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { LegalView } from '@/components/pages/LegalView'
import { getCachedLegalPages, getCachedPageBySlug } from '@/lib/cache'
import { legalEffective, pickLegalSource } from '@/lib/legal-source'
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
  // En paralelo: el doc pages manda en title, meta y migas (paridad de SEO, 54-16);
  // el global legal-pages aporta el texto nuevo y la fecha efectiva (fase 56, D-02 y D-09).
  const [doc, legal] = await Promise.all([
    getPage(locale),
    getCachedLegalPages(locale as 'es' | 'en'),
  ])

  if (!doc) {
    notFound()
  }

  const [t, tCommon] = await Promise.all([getTranslations('legal'), getTranslations('common')])

  // Si el cuerpo de este idioma esta vacio en el global (o la tabla aun no existe),
  // pickLegalSource devuelve el texto del doc pages del mismo idioma y sin fecha.
  const source = pickLegalSource(doc, legal, 'privacy')
  const effective = legalEffective(source.effectiveDate, locale as 'es' | 'en')

  // Sin JSON-LD: la ruta no lo emitia antes y el contrato de SEO no cambia (SEO-01).
  return (
    <LegalView
      title={doc.title}
      crumbs={[
        { label: tCommon('breadcrumbHome'), href: '/' },
        { label: doc.title },
      ]}
      richTexts={source.richTexts}
      eyebrow={t('eyebrow')}
      tocLabel={t('tocLabel')}
      effectiveLabel={effective ? t('effectiveOn', { date: effective.formatted }) : null}
      effectiveDateIso={effective?.iso ?? null}
    />
  )
}
