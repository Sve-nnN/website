'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import { ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

import type { Crumb } from '@/components/mui/Crumbs'
import { linkFor } from '@/components/mui/links'
import { UL } from '@/components/mui/lists'
import { PageHero } from '@/components/mui/PageHero'
import { PostCard } from '@/components/mui/PostCard'
import { visuallyHidden } from '@/components/mui/ScoreRing'
import type { BlogClosingData, BlogIndexProps, BlogPostItem, NewsletterNotice } from '@/lib/blog-data'

import { BlogClosingMui } from './BlogClosingMui'
import { BlogNewsletter } from './BlogNewsletter'
import { CategoryNav } from './CategoryNav'

type Props = BlogIndexProps & {
  /** Migas de `buildBlogTrail`, ya con `href`. */
  crumbs: Crumb[]
  /** Estado de `?newsletter=` ya validado, o null. */
  newsletterNotice: NewsletterNotice | null
  /** Cierre del blog (promo global), o null. */
  closing: BlogClosingData | null
}

const CARD_GRID = {
  display: 'grid',
  gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'repeat(2, minmax(0,1fr))', lg: 'repeat(3, minmax(0,1fr))' },
  gap: 2,
  '& > li': { display: 'grid', minWidth: 0 },
} as const

function card(item: BlogPostItem, withCategory = false, featured = false) {
  return (
    <PostCard
      href={item.href}
      title={item.title}
      excerpt={item.excerpt}
      dateISO={item.dateISO}
      image={item.image}
      categoryLabel={withCategory ? item.categoryLabel : null}
      featured={featured}
    />
  )
}

/**
 * Indice del blog: h1 y subtitulo del documento Pages blog, navegacion de
 * categorias, la entrada mas reciente destacada, una seccion por categoria con
 * las primeras 6 entradas y un enlace real "Ver mas" a /blog/<slug>, la franja
 * de newsletter y el cierre unico. No declara landmark principal.
 *
 * Todas las tarjetas y todos los enlaces estan en el HTML del servidor (D-17,
 * D-18): nada se revela en el cliente.
 */
export function BlogIndexView({
  crumbs,
  title,
  lead,
  latest,
  sections,
  nav,
  viewAllLabel,
  newsletter,
  newsletterNotice,
  closing,
}: Props) {
  const t = useTranslations('blog.index')

  return (
    <>
      <PageHero crumbs={crumbs} title={title} lead={lead ?? undefined}>
        <CategoryNav items={nav} />
      </PageHero>

      {latest && (
        <Box component="section" aria-labelledby="blog-latest-t" sx={{ pb: { xs: 6, md: 8 } }}>
          <Container maxWidth="lg">
            <Typography id="blog-latest-t" variant="overline" component="h2" sx={{ color: 'accentText', display: 'block', mb: 2 }}>
              {t('latestTitle')}
            </Typography>
            {card(latest, true, true)}
          </Container>
        </Box>
      )}

      {sections.map((section, i) => (
        <Box
          key={section.slug}
          component="section"
          aria-labelledby={`blog-cat-${section.slug}`}
          sx={{ py: { xs: 6, md: 8 }, ...(i % 2 === 1 ? { bgcolor: 'raised' } : {}) }}
        >
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 3, mb: 4 }}>
              <Box sx={{ maxWidth: 720, display: 'grid', gap: 1.5 }}>
                <Typography variant="overline" component="p" sx={{ color: 'accentText' }}>
                  {t('count', { count: section.total })}
                </Typography>
                <Typography id={`blog-cat-${section.slug}`} variant="h3" component="h2">
                  {section.title}
                </Typography>
                {section.description && (
                  <Typography variant="body1" color="text.secondary">
                    {section.description}
                  </Typography>
                )}
              </Box>
              {section.hasMore && (
                <Button
                  component={linkFor(section.href)}
                  href={section.href}
                  variant="outlined"
                  sx={{ minHeight: 40 }}
                  endIcon={<ArrowRight size={18} aria-hidden="true" />}
                >
                  {viewAllLabel ?? t('viewMore')}
                  <Box component="span" sx={visuallyHidden}>
                    {`: ${section.title}`}
                  </Box>
                </Button>
              )}
            </Box>
            <UL aria-label={t('sectionListLabel', { category: section.title })} sx={CARD_GRID}>
              {section.items.map((item) => (
                <li key={item.href}>{card(item)}</li>
              ))}
            </UL>
          </Container>
        </Box>
      ))}

      {newsletter && <BlogNewsletter data={newsletter} notice={newsletterNotice} />}
      {closing && <BlogClosingMui closing={closing} />}
    </>
  )
}
