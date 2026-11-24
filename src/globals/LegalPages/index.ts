import type { Field, GlobalConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

import { revalidateLegalPagesCache } from '@/lib/cache-tags'

/**
 * Texto legal nuevo de Privacidad y Términos (fase 56, contenido sombra aditivo).
 *
 * Master ya sirve /privacy y /terms desde docs de la colección pages. Sobrescribirlos
 * cambiaría producción al instante (D-02), así que el texto nuevo vive aquí, en un
 * global que master no conoce. La ruta lee este global primero y cae al doc pages del
 * mismo idioma mientras el cuerpo de ese idioma esté vacío.
 *
 * Sin `access` y sin `versions` a propósito (T-54-05, T-56-09): el acceso por defecto
 * niega la lectura anónima, así que GET /api/globals/legal-pages responde 403 y el
 * texto sin aprobar no sale por la API pública. Por eso se lee por Local API en el
 * servidor. Sin `versions` no hay borradores que filtrar.
 */

const body = (): Field => ({
  name: 'body',
  type: 'richText',
  editor: lexicalEditor(),
  localized: true,
})

export const LegalPages: GlobalConfig = {
  slug: 'legal-pages',
  label: 'Legal (contenido nuevo)',
  admin: {
    group: 'Site',
    description:
      'Texto nuevo de Privacidad y Términos. Privado hasta el corte: la fecha efectiva se fija el día del corte.',
  },
  hooks: {
    afterChange: [revalidateLegalPagesCache],
  },
  fields: [
    {
      name: 'effectiveDate',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayOnly' },
        description:
          'Fecha del día del corte. Sin valor no se muestra ninguna fecha efectiva en las páginas legales.',
      },
    },
    { name: 'privacy', type: 'group', fields: [body()] },
    { name: 'terms', type: 'group', fields: [body()] },
  ],
}
