'use client'

import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import { useTranslations } from 'next-intl'

import { UL } from '@/components/mui/lists'
import { PostCard } from '@/components/mui/PostCard'
import type { BlogPostItem } from '@/lib/blog-data'

/**
 * Posts relacionados de la misma categoria (hasta 3, sin el actual). Banda con
 * su h2 (`post-related-t`, id reservado en lexical-toc) y una lista de
 * PostCard con encabezado h3. Sin entradas no se pinta nada.
 */
export function PostRelated({ items }: { items: BlogPostItem[] }) {
  const t = useTranslations('post.related')
  if (items.length === 0) return null

  return (
    <Box component="section" aria-labelledby="post-related-t" sx={{ py: { xs: 8, md: 10 }, bgcolor: 'raised' }}>
      <Container maxWidth="lg">
        <Typography id="post-related-t" variant="h4" component="h2" sx={{ mb: 4 }}>
          {t('title')}
        </Typography>
        <UL
          aria-label={t('listLabel')}
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'repeat(2, minmax(0,1fr))', lg: 'repeat(3, minmax(0,1fr))' },
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
      </Container>
    </Box>
  )
}
