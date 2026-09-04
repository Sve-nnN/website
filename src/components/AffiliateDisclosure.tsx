// CONSTRAINT (LEG-04): cero tracking que dispare consentimiento en la ruta
// de afiliado — sin GA4, sin píxeles, sin IDs de clic por usuario, sin
// cookies ni almacenamiento local del navegador aquí ni en ningún
// componente que renderice esto.

import { getTranslations } from 'next-intl/server'

export async function AffiliateDisclosure({
  hasAmazonLinks,
  locale,
}: {
  hasAmazonLinks: boolean
  locale?: 'es' | 'en'
}) {
  const t = locale
    ? await getTranslations({ locale, namespace: 'affiliateDisclosure' })
    : await getTranslations('affiliateDisclosure')

  return (
    <p>
      {t('generalDisclosure')}
      {hasAmazonLinks ? ` ${t('amazonDisclosure')}` : null}
    </p>
  )
}
