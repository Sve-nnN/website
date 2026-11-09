import { notFound } from 'next/navigation'

import { JsonLd } from '@/components/JsonLd'
import { StackView } from '@/components/pages/StackView'
import { buildOpenGraph } from '@/lib/og-image'
import { buildAlternates } from '@/lib/canonical'
import { buildBreadcrumbJsonLd, type BreadcrumbItem } from '@/lib/breadcrumbs'
import { pageTitle } from '@/lib/page-title'
import { getCachedPageBySlug } from '@/lib/cache'
import { buildStackViewData } from '@/lib/stack-data'

// Mismo patrón ISR de Home/Websites (SEO-06): generateStaticParams vacío,
// dynamicParams (default true) sirve cada locale en la primera visita.
export const revalidate = 60

export function generateStaticParams(): Array<{ locale: string }> {
  return []
}

async function getStackPage(locale: string) {
  return getCachedPageBySlug('stack', locale as 'es' | 'en')
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const doc = await getStackPage(locale)
  const meta = doc?.meta

  const title = meta?.title ?? doc?.title ?? 'My stack'
  const description = meta?.description ?? ''

  return {
    title: pageTitle(title),
    description,
    openGraph: buildOpenGraph({
      title,
      description,
      url: locale === 'en' ? '/en/stack' : '/stack',
      locale: locale as 'es' | 'en',
      slug: 'stack',
      metaImage: meta?.image,
    }),
    alternates: buildAlternates(locale as 'es' | 'en', '/stack', '/en/stack'),
  }
}

export default async function StackPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const doc = await getStackPage(locale)

  if (!doc) notFound()

  // STACK-01: "sin tocar sitemap-data.ts/canonical.ts/breadcrumbs.ts" prohíbe
  // EDITAR esos archivos, no llamarlos. El trail de /stack es un array
  // literal (2 niveles, sin sección reusable en breadcrumbs.ts), pasado a
  // la JSON-LD (buildBreadcrumbJsonLd, ya genérica). El breadcrumb visible lo
  // arma ahora StackView con sus propias migas (PageHero MUI). El último ítem
  // SÍ lleva `url` (apunta a esta misma página) — breadcrumbs.ts documenta que
  // TODOS los entries llevan `item` absoluto en el JSON-LD, sin truncar el
  // último — solo se evita un `undefined` en el JSON-LD.
  const trail: BreadcrumbItem[] = [
    { label: locale === 'es' ? 'Inicio' : 'Home', url: locale === 'es' ? '/' : '/en' },
    {
      label: locale === 'es' ? 'Mi stack' : 'My stack',
      url: locale === 'es' ? '/stack' : '/en/stack',
    },
  ]

  // El primer bloque toolStack del layout alimenta la vista. Sin bloque, la
  // vista muestra solo el hero.
  const block = doc.content?.layout?.find((b) => b.blockType === 'toolStack')
  const data = block ? buildStackViewData(block, locale as 'es' | 'en') : null

  return (
    <div>
      <StackView title={doc.title} data={data} />
      <JsonLd data={buildBreadcrumbJsonLd(trail)} />
    </div>
  )
}
