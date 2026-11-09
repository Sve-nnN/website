'use client'

import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'

import type { Crumb } from '@/components/mui/Crumbs'
import { linkFor } from '@/components/mui/links'
import { UL } from '@/components/mui/lists'
import { PageHero } from '@/components/mui/PageHero'
import type { WebsiteIndexItem } from '@/lib/websites-data'

type Props = {
  crumbs: Crumb[]
  title: string
  items: WebsiteIndexItem[]
}

/**
 * Indice de Websites. Version del tracer: migas, h1 y una lista de tarjetas
 * minimas (titulo enlazado, tagline y tipo). El diseno completo llega en la
 * tarea 2 del plan 55-01. No declara landmark principal.
 */
export function WebsitesIndexView({ crumbs, title, items }: Props) {
  return (
    <>
      <PageHero crumbs={crumbs} title={title} />
      {items.length > 0 && (
        <Box component="section" aria-labelledby="page-title" sx={{ pb: { xs: 8, md: 12 } }}>
          <Container maxWidth="lg">
            <UL sx={{ display: 'grid', gap: 2 }}>
              {items.map((item) => {
                const href = `/websites/${item.slug}`
                return (
                  <Box key={item.slug} component="li">
                    <Typography variant="h6" component="h2">
                      <Link component={linkFor(href)} href={href}>
                        {item.title}
                      </Link>
                    </Typography>
                    {item.tagline && <Typography variant="body2">{item.tagline}</Typography>}
                    <Typography variant="caption">{item.kind}</Typography>
                  </Box>
                )
              })}
            </UL>
          </Container>
        </Box>
      )}
    </>
  )
}
