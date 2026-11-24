'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import { useTranslations } from 'next-intl'

import type { Crumb } from '@/components/mui/Crumbs'
import { linkFor } from '@/components/mui/links'
import { UL } from '@/components/mui/lists'
import { PageHero } from '@/components/mui/PageHero'
import { PostCard } from '@/components/mui/PostCard'
import { visuallyHidden } from '@/components/mui/ScoreRing'
import type { BlogClosingData, CategoryPageProps } from '@/lib/blog-data'
import { blogIndexPath } from '@/lib/blog-paths'

import { BlogClosingMui } from './BlogClosingMui'
import { CategoryNav } from './CategoryNav'

type Props = CategoryPageProps & {
  /** Migas de `buildBlogTrail`, ya con `href`. */
  crumbs: Crumb[]
  /** Cierre del blog resuelto para esta categoria, o null. */
  closing: BlogClosingData | null
}

/**
 * Pagina de categoria del blog: PageHero con el nombre y la descripcion de
 * Payload, navegacion de categorias y UNA lista con TODAS las entradas.
 *
 * No hay estado de revelado ni recorte en el cliente (Pitfall 5, D-18): cada
 * entrada tiene su enlace en el HTML del servidor. `general` llega sin entradas
 * y muestra el estado vacio con su mismo 200. No declara landmark principal.
 */
export function CategoryPageView({ crumbs, category, items, nav, closing }: Props) {
  const t = useTranslations('blog.category')
  const empty = items.length === 0

  return (
    <>
      <PageHero crumbs={crumbs} title={category.title} lead={category.description ?? undefined}>
        <CategoryNav items={nav} activeSlug={category.slug} />
        {!empty && (
          <Typography variant="body2" color="text.secondary">
            {t('count', { count: items.length })}
          </Typography>
        )}
      </PageHero>

      <Box component="section" aria-labelledby="blog-list-t" sx={{ pb: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          {empty ? (
            <Box sx={{ display: 'grid', gap: 2, justifyItems: 'center', textAlign: 'center', py: 8 }}>
              <Typography id="blog-list-t" variant="h3" component="h2">
                {t('emptyTitle')}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {t('emptyText')}
              </Typography>
              <Button component={linkFor(blogIndexPath())} href={blogIndexPath()} variant="outlined" sx={{ minHeight: 40 }}>
                {t('backToBlog')}
              </Button>
            </Box>
          ) : (
            <>
              <Typography id="blog-list-t" variant="h3" component="h2" sx={visuallyHidden}>
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
                }}
              >
                {items.map((item) => (
                  <li key={item.href}>
                    <PostCard
                      href={item.href}
                      title={item.title}
                      excerpt={item.excerpt}
                      dateISO={item.dateISO}
                      image={item.image}
                    />
                  </li>
                ))}
              </UL>
            </>
          )}
        </Container>
      </Box>

      {closing && <BlogClosingMui closing={closing} />}
    </>
  )
}
