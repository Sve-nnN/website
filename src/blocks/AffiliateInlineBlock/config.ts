import type { Block } from 'payload'

// Bloque Lexical (NO bloque de Pages) — registrado vía `BlocksFeature` en
// `posts.content` (jsonb ya existente, cero migración). `slug` kebab-case a
// propósito: este valor literal es el que Payload guarda como
// `fields.blockType` en el nodo Lexical serializado (48-03-PLAN.md Paso 1).
//
// Sin campos propios de `tagline`/`ctaLabel`: el componente lee esos datos
// del doc de `affiliate-links` relacionado para que la copy nunca se
// bifurque entre `/stack` y un post (misma fuente de verdad que ToolCard).
export const AffiliateInlineBlock: Block = {
  slug: 'affiliate-inline',
  interfaceName: 'AffiliateInlineBlock',
  fields: [
    {
      name: 'affiliateLink',
      type: 'relationship',
      relationTo: 'affiliate-links',
      // A diferencia de ToolStack.tools[].affiliateLink (opcional — "sin
      // afiliado todavía"), insertar este bloque sin herramienta no tiene
      // sentido editorial: siempre debe apuntar a un doc real.
      required: true,
    },
  ],
}
