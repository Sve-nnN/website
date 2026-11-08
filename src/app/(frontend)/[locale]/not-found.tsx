import type { Metadata } from 'next'

import { NotFoundView } from '@/components/pages/NotFoundView'

// 404 de una pagina que existe pero no tiene contenido (un `notFound()` lanzado
// desde `servicios/[slug]`, `blog/...`, etc.). Vive dentro del layout de
// [locale], asi que el cliente la dibuja con el shell. OJO: en Next 15.4 el
// HTML que sale del servidor para estos casos es un documento de error vacio
// (estado 404 correcto, pero sin shell). La 404 de una URL SIN ruta, que es
// la que debe traer el shell en el HTML, la sirve `src/app/global-not-found.tsx`.
//
// Este archivo NO lee headers ni cookies (nada de `getLocale()` ni de
// `getTranslations()` sin locale): las paginas con ISR (`servicios/[slug]`,
// `revalidate = 60`) renderizan este not-found y Next responde 500 con "Page
// changed from static to dynamic at runtime ... reason: headers". Lo vio el
// preview en el primer despliegue. Por eso el idioma sale de `useLocale()` en
// la vista cliente y el titulo es neutro: no hay locale disponible aqui sin
// pasar por headers.
//
// T-54-03: nada de lo que el visitante escribio en la URL llega al HTML ni a la
// metadata. T-54-04: una 404 nunca se indexa.
export const metadata: Metadata = {
  title: '404',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return <NotFoundView />
}
