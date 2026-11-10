'use client'

import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import { useTranslations } from 'next-intl'

import type { Crumb } from '@/components/mui/Crumbs'
import { UL } from '@/components/mui/lists'
import { PageHero } from '@/components/mui/PageHero'
import type { CaseIndexItem } from '@/lib/case-study-data'

import { CaseCard } from './CaseCard'

type Props = {
  /** Migas de `buildCaseStudiesTrail`, ya con `href`. */
  crumbs: Crumb[]
  /** Titulo del h1, tal como lo entrega la ruta. */
  title: string
  /** Texto bajo el h1 (el subtitulo que ya tenia la ruta). */
  lead?: string
  items: CaseIndexItem[]
}

/**
 * Indice de casos de exito: PageHero y una sola lista con todos los casos
 * publicados. El mas reciente va primero y ocupa el ancho completo. El cierre
 * (CtaSection) lo pone el Server Component de la ruta. No declara landmark
 * principal.
 *
 * Todas las tarjetas y todos los enlaces estan en el HTML del servidor: la
 * lista nunca se corta ni se revela en el cliente (D-12, SEO-03).
 */
export function CaseStudiesIndexView({ crumbs, title, lead, items }: Props) {
  const t = useTranslations('cases.index')
  const [first, ...rest] = items

  return (
    <>
      <PageHero crumbs={crumbs} title={title} lead={lead} />

      <Box component="section" aria-labelledby="casos-t" sx={{ pb: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          {items.length === 0 ? (
            <Box sx={{ display: 'grid', gap: 1, justifyItems: 'center', textAlign: 'center', py: 8 }}>
              <Typography id="casos-t" variant="h3" component="h2">
                {t('emptyTitle')}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {t('emptyText')}
              </Typography>
            </Box>
          ) : (
            <>
              <Typography id="casos-t" variant="h3" component="h2" sx={{ mb: 4 }}>
                {t('listTitle')}
              </Typography>
              <UL
                aria-label={t('listLabel')}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'minmax(0,1fr)',
                    md: 'repeat(2, minmax(0,1fr))',
                    lg: 'repeat(3, minmax(0,1fr))',
                  },
                  gap: 2,
                  '& > li': { display: 'grid', minWidth: 0 },
                  '& > li:first-of-type': { gridColumn: { md: '1 / -1' } },
                }}
              >
                {first && (
                  <li key={first.slug}>
                    <CaseCard item={first} featured />
                  </li>
                )}
                {rest.map((item) => (
                  <li key={item.slug}>
                    <CaseCard item={item} />
                  </li>
                ))}
              </UL>
            </>
          )}
        </Container>
      </Box>
    </>
  )
}
