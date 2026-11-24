import type { MetadataRoute } from 'next'

import { isPreviewReadonly } from '@/lib/preview'

const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://juan-tech.com'

// Sin esto Next prerrenderiza el archivo en el build con el entorno de ese
// momento y la bandera del preview (que se lee en runtime) nunca se aplica.
export const dynamic = 'force-dynamic'

export default function robots(): MetadataRoute.Robots {
  // Preview del rediseño (fase 53, D-05): se bloquea todo y no se anuncia
  // sitemap, para que ningún rastreador descubra ni indexe dev.juan-tech.com.
  if (isPreviewReadonly()) {
    return { rules: { userAgent: '*', disallow: '/' } }
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/go'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
