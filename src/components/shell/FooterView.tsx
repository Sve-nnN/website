'use client'

// Vista cliente del footer (D-11). Recibe solo datos ya resueltos y saneados por
// el server component `SiteFooter`. Cada bloque se dibuja solo si tiene datos
// (empty, zero-one-many); la marca, el tagline y la barra inferior siempre estan.
import Image from 'next/image'
import NextLink from 'next/link'
import { useTranslations } from 'next-intl'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'

import { Link as LocaleLink, isPrefixableHref } from '@/i18n/navigation'
import { SocialIcon, socialLabels } from '@/components/SocialIcon'

export type FooterViewItem = { id: string; label: string; href: string }
export type FooterViewColumn = { id: string; title: string | null; items: FooterViewItem[] }
export type FooterViewSocial = { id: string; platform: string; url: string }
export type FooterViewLegal = { id: string; label: string; href: string }
export type FooterViewLogo = { url: string; alt: string | null } | null

type Props = {
  columns: FooterViewColumn[]
  socialLinks: FooterViewSocial[]
  legalLinks: FooterViewLegal[]
  copyrightText: string
  logo: FooterViewLogo
}

const EXTERNAL = /^https?:\/\//i

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

/**
 * Los internos sin prefijo usan el `Link` de next-intl (agrega `/en` solo en
 * ingles). Los que ya traen el prefijo (servicios en ingles), los absolutos,
 * mailto, tel y anclas van con `next/link` plano. Los absolutos http abren en
 * otra pestana con `rel` seguro (T-53-32).
 */
function linkAttrs(href: string) {
  const external = EXTERNAL.test(href)
  return {
    component: isPrefixableHref(href) ? LocaleLink : NextLink,
    external,
    extra: external ? ({ target: '_blank', rel: 'noopener noreferrer' } as const) : {},
  }
}

export function FooterView({ columns, socialLinks, legalLinks, copyrightText, logo }: Props) {
  const t = useTranslations('shell')

  return (
    <Box
      component="footer"
      aria-label={t('landmarks.footer')}
      sx={{ borderTop: 1, borderColor: 'divider', py: 8 }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'minmax(0, 1fr)',
              md: columns.length > 0 ? 'minmax(220px, 1fr) minmax(0, 3fr)' : 'minmax(0, 1fr)',
            },
            gap: 4,
          }}
        >
          <Box>
            <Link
              component={LocaleLink}
              href="/"
              underline="none"
              aria-label={t('brandAria')}
              sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, color: 'text.primary', fontWeight: 600 }}
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
              <span>Juan Carlos Angulo</span>
            </Link>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, maxWidth: 280 }}>
              {t('tagline')}
            </Typography>
          </Box>

          {columns.length > 0 && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 4,
                alignContent: 'start',
              }}
            >
              {columns.map((column) => (
                <Box
                  key={column.id}
                  component="nav"
                  aria-label={column.title ? t('groupLabel', { title: column.title }) : t('landmarks.navFooter')}
                >
                  {column.title && (
                    <Typography
                      variant="overline"
                      component="h3"
                      color="text.secondary"
                      sx={{ display: 'block', mb: 1.5, overflowWrap: 'anywhere' }}
                    >
                      {column.title}
                    </Typography>
                  )}
                  <Box component="ul" sx={{ display: 'grid', gap: 0.5, listStyle: 'none', m: 0, p: 0 }}>
                    {column.items.map((item) => {
                      const attrs = linkAttrs(item.href)
                      return (
                        <li key={item.id}>
                          <Link
                            component={attrs.component}
                            href={item.href}
                            underline="hover"
                            {...attrs.extra}
                            sx={{
                              color: 'text.primary',
                              minHeight: 32,
                              display: 'inline-flex',
                              alignItems: 'center',
                              overflowWrap: 'anywhere',
                            }}
                          >
                            {item.label}
                            {attrs.external && <Box component="span" sx={srOnly}>{` ${t('opensInNewTab')}`}</Box>}
                          </Link>
                        </li>
                      )
                    })}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        <Box
          sx={{
            mt: 6,
            pt: 3,
            borderTop: 1,
            borderColor: 'divider',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 3,
            color: 'text.secondary',
          }}
        >
          <Typography variant="caption">{copyrightText}</Typography>

          {legalLinks.length > 0 && (
            <Box component="nav" aria-label={t('legalLabel')}>
              <Box component="ul" sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, listStyle: 'none', m: 0, p: 0 }}>
                {legalLinks.map((legal) => {
                  const attrs = linkAttrs(legal.href)
                  return (
                    <li key={legal.id}>
                      <Link
                        component={attrs.component}
                        href={legal.href}
                        underline="hover"
                        {...attrs.extra}
                        sx={{
                          color: 'inherit',
                          fontSize: '0.75rem',
                          minHeight: 32,
                          display: 'inline-flex',
                          alignItems: 'center',
                        }}
                      >
                        {legal.label}
                        {attrs.external && <Box component="span" sx={srOnly}>{` ${t('opensInNewTab')}`}</Box>}
                      </Link>
                    </li>
                  )
                })}
              </Box>
            </Box>
          )}

          {socialLinks.length > 0 && (
            <Box role="group" aria-label={t('socialLabel')} sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {socialLinks.map((social) => (
                <Link
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="none"
                  aria-label={`${socialLabels[social.platform] ?? social.platform} ${t('opensInNewTab')}`}
                  sx={{
                    width: 44,
                    height: 44,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1,
                    color: 'text.secondary',
                    '& svg': { width: 20, height: 20 },
                    '&:hover': { color: 'text.primary', bgcolor: 'raised' },
                  }}
                >
                  <SocialIcon platform={social.platform} />
                </Link>
              ))}
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  )
}
