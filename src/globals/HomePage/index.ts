import type { GlobalConfig } from 'payload'

import { revalidateHomePageCache } from '@/lib/cache-tags'

/**
 * Copy nuevo de la home y de Contacto (fase 54, contenido sombra aditivo).
 *
 * Producción (rama master) y el preview comparten la misma base. Todo el copy
 * nuevo vive aquí, en una estructura que master ignora, y nada existente se
 * sobrescribe.
 *
 * Sin `access` y sin `versions` a propósito (T-54-05): el acceso por defecto de
 * un global niega la lectura anónima, así que GET /api/globals/home-page
 * responde 403 y el copy sin aprobar no sale por la API pública. Sin drafts no
 * hay borradores que filtrar.
 */
export const HomePage: GlobalConfig = {
  slug: 'home-page',
  label: 'Home (contenido nuevo)',
  admin: {
    group: 'Site',
    description: 'Copy del rediseño de la home y de Contacto. Privado hasta el corte.',
  },
  hooks: {
    afterChange: [revalidateHomePageCache],
  },
  fields: [
    {
      name: 'tagline',
      type: 'textarea',
      localized: true,
    },
  ],
}
