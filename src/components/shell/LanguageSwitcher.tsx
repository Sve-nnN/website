'use client'

// Selector de idioma del shell nuevo (D-14). Cada opcion es un enlace a la misma
// pagina en el otro idioma, con `lang` y `hreflang`.
//
// El href se construye como cadena canonica (espanol sin prefijo, ingles con
// `/en`, slugs de servicios traducidos) y se entrega a `next/link` plano. Nunca
// se usa la prop `locale` del `Link` de next-intl: con espanol emite `/es/...`,
// una URL no canonica con redireccion 308 (ver LocaleSwitcher.tsx). El idioma
// activo sale de `useLocale()`, no de parsear la ruta.
import { useState, type MouseEvent } from 'react'
import NextLink from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { Check, Globe } from 'lucide-react'

import { usePathname } from '@/i18n/navigation'
import { buildLocaleSwitchHref, type NavLocale } from '@/lib/nav-links'

const OPTIONS: { code: NavLocale; label: string }[] = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
]

type Props = {
  inDrawer?: boolean
  onNavigate?: () => void
}

export function LanguageSwitcher({ inDrawer = false, onNavigate }: Props) {
  const t = useTranslations('shell')
  const active: NavLocale = useLocale() === 'en' ? 'en' : 'es'
  // Ruta sin prefijo de idioma (next-intl). Es la base del href canonico.
  const pathname = usePathname()
  const router = useRouter()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  // D-14: conservar el hash. Un enlace plano lo perderia, asi que si hay hash
  // se navega a mano. Se lee en el clic y no con useSearchParams, que fuerza
  // render dinamico de las paginas ISR.
  const handleClick = (event: MouseEvent<HTMLElement>, href: string) => {
    const hash = typeof window === 'undefined' ? '' : window.location.hash
    if (hash !== '') {
      event.preventDefault()
      router.push(`${href}${hash}`)
    }
    setAnchor(null)
    onNavigate?.()
  }

  if (inDrawer) {
    return (
      <Box role="group" aria-label={t('langGroup')} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {OPTIONS.map((option) => {
          const href = buildLocaleSwitchHref(pathname, option.code)
          const isActive = option.code === active
          return (
            <Button
              key={option.code}
              component={NextLink}
              href={href}
              lang={option.code}
              hrefLang={option.code}
              aria-current={isActive ? 'true' : undefined}
              variant={isActive ? 'contained' : 'outlined'}
              size="small"
              onClick={(event: MouseEvent<HTMLElement>) => handleClick(event, href)}
            >
              {option.label}
            </Button>
          )
        })}
      </Box>
    )
  }

  return (
    <>
      <Button
        onClick={(event: MouseEvent<HTMLElement>) => setAnchor(event.currentTarget)}
        aria-haspopup="menu"
        aria-expanded={anchor !== null}
        aria-controls="menu-idioma"
        aria-label={t('langButtonAria')}
        startIcon={<Globe size={16} aria-hidden="true" />}
        size="small"
        variant="text"
        sx={{
          color: 'text.secondary',
          minWidth: 0,
          px: 1.25,
          fontWeight: 600,
          '&:hover': { color: 'text.primary', bgcolor: 'raised', transform: 'none' },
        }}
      >
        {active.toUpperCase()}
      </Button>
      <Menu
        id="menu-idioma"
        anchorEl={anchor}
        open={anchor !== null}
        onClose={() => setAnchor(null)}
        slotProps={{ list: { 'aria-label': t('langGroup') } }}
      >
        {OPTIONS.map((option) => {
          const href = buildLocaleSwitchHref(pathname, option.code)
          const isActive = option.code === active
          return (
            <MenuItem
              key={option.code}
              component={NextLink}
              href={href}
              lang={option.code}
              hrefLang={option.code}
              selected={isActive}
              aria-current={isActive ? 'true' : undefined}
              onClick={(event: MouseEvent<HTMLElement>) => handleClick(event, href)}
              sx={{ gap: 1.5, minWidth: 160 }}
            >
              {option.label}
              {isActive && <Check size={16} aria-hidden="true" style={{ marginLeft: 'auto' }} />}
            </MenuItem>
          )
        })}
      </Menu>
    </>
  )
}
