import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'

import { NotFoundView } from '@/components/pages/NotFoundView'
import { pageTitle } from '@/lib/page-title'

// 404 de una pagina que existe pero no tiene contenido (un `notFound()` lanzado
// desde `servicios/[slug]`, `blog/...`, etc.). Vive dentro del layout de
// [locale], asi que el cliente la dibuja con el shell. OJO: en Next 15.4 el
// HTML que sale del servidor para estos casos es un documento de error vacio
// (estado 404 correcto, pero sin shell). La 404 de una URL SIN ruta, que es
// la que debe traer el shell en el HTML, la sirve `src/app/global-not-found.tsx`.
//
// T-54-03: nada de lo que el visitante escribio en la URL llega al HTML ni a la
// metadata. Solo texto de messages.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('notFound')
  return {
    title: pageTitle(t('metaTitle')),
    // T-54-04: una 404 nunca se indexa.
    robots: { index: false, follow: false },
  }
}

export default async function NotFound() {
  const locale = await getLocale()
  return <NotFoundView locale={locale === 'en' ? 'en' : 'es'} />
}
