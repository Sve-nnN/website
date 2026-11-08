'use client'

// Vista cliente del header (D-11). Recibe solo datos ya resueltos por el server
// component `SiteHeader`: no lee Payload ni conoce la forma del documento.
// Pill fijo en escritorio y Drawer por debajo de `md` (reflujo, SC 1.4.10).
import { useEffect, useState } from 'react'
import Image from 'next/image'
import NextLink from 'next/link'
import { useTranslations } from 'next-intl'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import { Menu, X } from 'lucide-react'

import { Link as LocaleLink, isPrefixableHref, usePathname } from '@/i18n/navigation'
import { normalizeNavPath } from '@/lib/nav-links'
import { LanguageSwitcher } from '@/components/shell/LanguageSwitcher'

export type HeaderViewItem = { id: string; href: string; label: string; newTab: boolean }
export type HeaderViewCta = { label: string | null; href: string } | null
export type HeaderViewLogo = { url: string; alt: string | null } | null

type Props = {
  locale: string
  items: HeaderViewItem[]
  cta: HeaderViewCta
  logo: HeaderViewLogo
}

// Solo para lectores de pantalla (el sufijo de "otra pestana").
const srOnly = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
} as const

const EXTERNAL = /^https?:\/\//i

/**
 * Componente y atributos de un enlace administrado. Los internos sin prefijo
 * usan el `Link` de next-intl (agrega `/en` solo en ingles); el resto va con
 * `next/link` plano. Externos o `newTab` abren en otra pestana con `rel`
 * seguro (T-53-32).
 */
function linkAttrs(href: string, newTab: boolean) {
  const external = newTab || EXTERNAL.test(href)
  return {
    component: isPrefixableHref(href) ? LocaleLink : NextLink,
    external,
    extra: external ? ({ target: '_blank', rel: 'noopener noreferrer' } as const) : {},
  }
}

export function HeaderView({ items, cta, logo }: Props) {
  const t = useTranslations('shell')
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Cierra el Drawer al cambiar de ruta.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const currentPath = normalizeNavPath(pathname)
  const ctaHref = cta?.href ?? '/contact'
  const ctaLabel = cta?.label?.trim() || t('ctaFallback')
  const ctaAttrs = linkAttrs(ctaHref, false)
  const closeMenu = () => setOpen(false)

  return (
    <Box
      component="header"
      aria-label={t('landmarks.header')}
      sx={{
        position: 'fixed',
        top: 16,
        left: 0,
        right: 0,
        zIndex: 1100,
        display: 'flex',
        justifyContent: 'center',
        px: 2,
        pointerEvents: 'none',
      }}
    >
      <Box
        component="nav"
        aria-label={t('landmarks.navMain')}
        sx={{
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 1,
          borderRadius: 9999,
          border: 1,
          borderColor: 'divider',
          bgcolor: 'color-mix(in srgb, var(--jt-palette-background-default) 72%, transparent)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          maxWidth: '100%',
        }}
      >
        <Link
          component={LocaleLink}
          href="/"
          underline="none"
          aria-label={t('brandAria')}
          sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.primary', fontWeight: 600, px: 0.5 }}
        >
          {logo && (
            <Image
              src={logo.url}
              alt=""
              width={32}
              height={32}
              style={{ borderRadius: '50%', objectFit: 'cover' }}
            />
          )}
          <span>Juan Angulo</span>
        </Link>

        {items.length > 0 && (
          <Stack component="ul" direction="row" sx={{ display: { xs: 'none', md: 'flex' }, listStyle: 'none', m: 0, p: 0, ml: 1 }}>
            {items.map((item) => {
              const attrs = linkAttrs(item.href, item.newTab)
              const isActive = !attrs.external && normalizeNavPath(item.href) === currentPath
              return (
                <li key={item.id}>
                  <Link
                    component={attrs.component}
                    href={item.href}
                    underline="none"
                    aria-current={isActive ? 'page' : undefined}
                    {...attrs.extra}
                    sx={{
                      px: 1,
                      minHeight: 40,
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: 9999,
                      color: 'text.secondary',
                      fontSize: '0.875rem',
                      fontWeight: 400,
                      '&:hover, &[aria-current]': { bgcolor: 'raised', color: 'text.primary' },
                    }}
                  >
                    {item.label}
                    {attrs.external && <Box component="span" sx={srOnly}>{` ${t('opensInNewTab')}`}</Box>}
                  </Link>
                </li>
              )
            })}
          </Stack>
        )}

        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <LanguageSwitcher />
        </Box>

        <Button
          component={ctaAttrs.component}
          href={ctaHref}
          variant="contained"
          size="small"
          {...ctaAttrs.extra}
          sx={{ display: { xs: 'none', md: 'inline-flex' }, whiteSpace: 'normal', textAlign: 'center' }}
        >
          {ctaLabel}
          {ctaAttrs.external && <Box component="span" sx={srOnly}>{` ${t('opensInNewTab')}`}</Box>}
        </Button>

        <IconButton
          aria-label={t('openMenu')}
          aria-expanded={open}
          aria-controls="menu-movil"
          onClick={() => setOpen(true)}
          sx={{ display: { md: 'none' } }}
        >
          <Menu size={20} aria-hidden="true" />
        </IconButton>
      </Box>

      <Drawer
        anchor="top"
        open={open}
        onClose={closeMenu}
        slotProps={{ paper: { id: 'menu-movil', role: 'dialog', 'aria-modal': true, 'aria-label': t('landmarks.menu') } }}
      >
        <Box sx={{ p: 2, display: 'grid', gap: 1 }}>
          <IconButton aria-label={t('closeMenu')} onClick={closeMenu} sx={{ justifySelf: 'end' }}>
            <X size={20} aria-hidden="true" />
          </IconButton>

          {items.map((item) => {
            const attrs = linkAttrs(item.href, item.newTab)
            return (
              <Link
                key={item.id}
                component={attrs.component}
                href={item.href}
                underline="none"
                onClick={closeMenu}
                {...attrs.extra}
                sx={{ color: 'text.primary', fontSize: '1.5rem', fontWeight: 600, py: 1, overflowWrap: 'anywhere' }}
              >
                {item.label}
                {attrs.external && <Box component="span" sx={srOnly}>{` ${t('opensInNewTab')}`}</Box>}
              </Link>
            )
          })}

          <LanguageSwitcher inDrawer onNavigate={closeMenu} />

          <Button
            component={ctaAttrs.component}
            href={ctaHref}
            variant="contained"
            size="large"
            onClick={closeMenu}
            {...ctaAttrs.extra}
            sx={{ mt: 1, whiteSpace: 'normal', textAlign: 'center' }}
          >
            {ctaLabel}
            {ctaAttrs.external && <Box component="span" sx={srOnly}>{` ${t('opensInNewTab')}`}</Box>}
          </Button>
        </Box>
      </Drawer>
    </Box>
  )
}
