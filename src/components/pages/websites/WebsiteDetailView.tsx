'use client'

import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import { useTranslations } from 'next-intl'

import type { Crumb } from '@/components/mui/Crumbs'
import { UL } from '@/components/mui/lists'
import { PageHero } from '@/components/mui/PageHero'
import type { WebsiteDetailProps } from '@/lib/websites-data'

type Props = {
  /** Migas de `buildWebsitesTrail`, ya con `href`. */
  crumbs: Crumb[]
  site: WebsiteDetailProps
}

/**
 * Detalle de un sitio. Version minima del tracer (55-08, tarea 1): PageHero con
 * migas y h1, y la lista de aspectos destacados. No declara landmark principal.
 */
export function WebsiteDetailView({ crumbs, site }: Props) {
  const t = useTranslations('websites.detail')

  return (
    <>
      <PageHero crumbs={crumbs} title={site.title} lead={site.tagline ?? undefined} />
      {site.highlights.length > 0 && (
        <Box component="section" aria-labelledby="destacados-t" sx={{ pb: { xs: 8, md: 10 } }}>
          <Container maxWidth="lg">
            <Typography id="destacados-t" variant="h3" component="h2" sx={{ mb: 3 }}>
              {t('highlightsTitle')}
            </Typography>
            <UL sx={{ display: 'grid', gap: 1.5 }}>
              {site.highlights.map((text, i) => (
                <Typography key={`${i}-${text}`} component="li" variant="body1">
                  {text}
                </Typography>
              ))}
            </UL>
          </Container>
        </Box>
      )}
    </>
  )
}
