'use client'

import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import { Languages } from 'lucide-react'
import NextLink from 'next/link'
import { useTranslations } from 'next-intl'

/**
 * Aviso bajo el header en una pagina EN cuyo contenido sigue en espanol.
 * `role="note"`; el texto va en `lang="en"` y el enlace a la version en
 * espanol en `lang="es"` y `hrefLang="es"`. No reasigna el idioma del
 * documento ni lee la ruta: el layout fija `<html lang>` y quien lo pinta
 * decide si mostrarlo y pasa `esHref`.
 *
 * `esHref` es la URL canonica en espanol (sin prefijo) y va a `next/link`
 * plano: con el `Link` de next-intl, en una pagina EN, recibiria el prefijo
 * `/en` y el enlace apuntaria a la misma pagina. Mismo criterio que
 * `LanguageSwitcher` del shell.
 */
export function TranslationNotice({ esHref }: { esHref: string }) {
  const t = useTranslations('common')
  return (
    <Box
      role="note"
      sx={{
        position: 'relative',
        zIndex: 5,
        pt: 12,
        pb: 1.5,
        mb: -10,
        px: 2,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <Box
        sx={{
          pointerEvents: 'auto',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1.5,
          flexWrap: 'wrap',
          justifyContent: 'center',
          px: 2,
          py: 1,
          borderRadius: 2,
          bgcolor: 'raised',
          border: 1,
          borderColor: 'divider',
          fontSize: '0.875rem',
          lineHeight: '1.25rem',
        }}
      >
        <Languages size={16} aria-hidden="true" />
        <span lang="en">{t('translationNotice.text')}</span>
        <Link component={NextLink} href={esHref} lang="es" hrefLang="es" sx={{ fontWeight: 600 }}>
          {t('translationNotice.link')}
        </Link>
      </Box>
    </Box>
  )
}
