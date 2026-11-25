import type { MetadataRoute } from 'next'

import { isPreviewReadonly } from '@/lib/preview'

const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://juan-tech.com'

const DISALLOW = ['/admin', '/api', '/go']

// Auditoría SEO 2026-11: el sitio quiere que los asistentes de IA lo lean y lo
// citen, así que la política queda escrita en lugar de heredarse del `*`.
//
// Un robot que encuentra un grupo con su nombre ignora el grupo `*`; por eso
// estos grupos repiten las mismas exclusiones.
export const AI_SEARCH_AGENTS = [
  // Búsqueda y citación: indexan para responder con enlace a la fuente.
  'OAI-SearchBot',
  'Claude-SearchBot',
  'PerplexityBot',
  'DuckAssistBot',
  'Applebot',
  // Visitas pedidas por una persona dentro de un asistente.
  'ChatGPT-User',
  'Claude-User',
  'Perplexity-User',
  'MistralAI-User',
  'Meta-ExternalFetcher',
]

// Entrenamiento de modelos. También quedan permitidos: para un sitio personal
// cuyo objetivo es que lo mencionen, estar en el conocimiento del modelo ayuda.
// Para cerrar esta puerta basta con cambiar este grupo a `disallow: '/'`; la
// búsqueda y la citación siguen funcionando.
export const AI_TRAINING_AGENTS = [
  'GPTBot',
  'ClaudeBot',
  'Google-Extended',
  'Applebot-Extended',
  'Meta-ExternalAgent',
  'CCBot',
]

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
    rules: [
      { userAgent: '*', allow: '/', disallow: DISALLOW },
      { userAgent: AI_SEARCH_AGENTS, allow: '/', disallow: DISALLOW },
      { userAgent: AI_TRAINING_AGENTS, allow: '/', disallow: DISALLOW },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
