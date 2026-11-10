'use client'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Container from '@mui/material/Container'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

import type { Crumb } from '@/components/mui/Crumbs'
import { linkFor } from '@/components/mui/links'
import { UL } from '@/components/mui/lists'
import { PageHero } from '@/components/mui/PageHero'
import type { AuthorIndexItem } from '@/lib/authors-data'

type Props = {
  /** Migas de `buildAuthorsTrail`, ya con `href`. */
  crumbs: Crumb[]
  /** Titulo del h1, tal como lo entrega la ruta. */
  title: string
  items: AuthorIndexItem[]
}

/**
 * Indice de autores: PageHero y una lista de tarjetas. Cada tarjeta lleva el
 * avatar (con alt y medidas de Media), el nombre en h2 como unico enlace
 * (estirado a toda la tarjeta con `::after`), el cargo y un extracto de la bio.
 * El cierre (CtaSection) lo pone el Server Component de la ruta. No declara
 * landmark principal.
 *
 * El `outline` del enlace queda en none y el foco se dibuja en la tarjeta con
 * `:has(a:focus-visible)`; el nombre accesible del enlace es el nombre visible.
 */
export function AuthorsIndexView({ crumbs, title, items }: Props) {
  const t = useTranslations('authors.index')

  return (
    <>
      <PageHero crumbs={crumbs} title={title} />

      <Box component="section" aria-label={t('listLabel')} sx={{ pb: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          {items.length === 0 ? (
            <Box sx={{ display: 'grid', gap: 1, justifyItems: 'center', textAlign: 'center', py: 8 }}>
              <Typography variant="h3" component="h2">
                {t('emptyTitle')}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {t('emptyText')}
              </Typography>
            </Box>
          ) : (
            <UL
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'repeat(2, minmax(0,1fr))' },
                gap: 2,
              }}
            >
              {items.map((item) => {
                const href = `/authors/${item.slug}`
                return (
                  <Card
                    key={item.slug}
                    component="li"
                    sx={{
                      position: 'relative',
                      p: { xs: 3, md: 4 },
                      display: 'grid',
                      gridTemplateColumns: item.avatar ? 'auto minmax(0,1fr)' : 'minmax(0,1fr)',
                      gap: 3,
                      alignItems: 'start',
                      minWidth: 0,
                      '&:hover': { borderColor: 'text.primary' },
                      '&:has(a:focus-visible)': {
                        outline: '2px solid var(--jt-palette-accentText)',
                        outlineOffset: '2px',
                      },
                    }}
                  >
                    {item.avatar && (
                      <Box
                        component="img"
                        src={item.avatar.url}
                        alt={item.avatar.alt}
                        width={item.avatar.width}
                        height={item.avatar.height}
                        loading="lazy"
                        sx={{
                          width: 96,
                          height: 96,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    )}
                    <Box sx={{ display: 'grid', gap: 1, minWidth: 0 }}>
                      <Typography variant="h5" component="h2">
                        <Link
                          component={linkFor(href)}
                          href={href}
                          underline="none"
                          sx={{
                            color: 'text.primary',
                            outline: 'none',
                            '&::after': { content: '""', position: 'absolute', inset: 0 },
                          }}
                        >
                          {item.name}
                        </Link>
                      </Typography>
                      {item.jobTitle && (
                        <Typography variant="body2" color="text.secondary">
                          {item.jobTitle}
                        </Typography>
                      )}
                      {item.excerpt && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {item.excerpt}
                        </Typography>
                      )}
                      <Typography
                        variant="body2"
                        aria-hidden="true"
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.5,
                          color: 'accentText',
                          fontWeight: 600,
                          mt: 1,
                        }}
                      >
                        {t('viewProfile')} <ArrowRight size={14} />
                      </Typography>
                    </Box>
                  </Card>
                )
              })}
            </UL>
          )}
        </Container>
      </Box>
    </>
  )
}
