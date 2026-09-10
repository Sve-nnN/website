import { getTranslations } from 'next-intl/server'

import type { ToolStackBlock } from '@/payload-types'

import { Card, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button-variants'
import { AffiliateLink } from '@/components/AffiliateLink'

type GearItem = NonNullable<ToolStackBlock['gearItems']>[number]

/**
 * Card compacta para los 13 items de "Gear" (hardware personal comprado en
 * Amazon) — SIN filas de label ni pro/con, es una lista de kit personal, no
 * de herramientas revisadas. `href` ya viene resuelto y completo desde el
 * contenido (URL de producto con tag=juantech02-20 visible) — este
 * componente NUNCA construye ni transforma la URL, nunca pasa por `/go/`.
 * Sin `line-clamp` ni altura fija en el nombre — un nombre largo empuja la
 * altura de su propia card (UI-SPEC overflow backstop).
 */
export async function GearCard({ item, locale }: { item: GearItem; locale?: 'es' | 'en' }) {
  const t = locale
    ? await getTranslations({ locale, namespace: 'stackPage' })
    : await getTranslations('stackPage')

  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-label">{item.name}</p>
        <div className="mt-2">
          <AffiliateLink href={item.href} className={buttonVariants({ size: 'sm' })}>
            {t('ctaAmazon')}
          </AffiliateLink>
        </div>
      </CardContent>
    </Card>
  )
}
