// Identidad canónica de la persona, sin imports de Payload para que la puedan
// usar los módulos puros que arman JSON-LD (auditoría SEO 2026-11).
//
// Todo nodo que hable de Juan lleva el mismo `@id`. Fuera de la home, del perfil
// de autor y de Sobre mí no viaja el Person completo, así que la referencia
// incluye tipo, nombre y URL: un `@id` suelto no se resuelve entre páginas.
import { SITE_URL } from '@/lib/sitemap-data'

/** Slug del autor que representa al dueño del sitio. */
export const SITE_PERSON_SLUG = 'juan-carlos-angulo'

export const SITE_PERSON_NAME = 'Juan Carlos Angulo'

/**
 * Vive en la raíz del sitio y no en /authors, porque la persona es la entidad
 * del dominio entero y no el contenido de una página.
 */
export const PERSON_ID = `${SITE_URL}/#person`

/** Referencia corta, para unir un nodo que ya declara tipo y nombre. */
export const personRef = { '@id': PERSON_ID }

/** Nodo mínimo y autosuficiente: `publisher`, `provider`, `mainEntity`. */
export const personStub = {
  '@type': 'Person',
  '@id': PERSON_ID,
  name: SITE_PERSON_NAME,
  url: SITE_URL,
}
