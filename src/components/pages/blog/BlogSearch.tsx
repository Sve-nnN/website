'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import InputAdornment from '@mui/material/InputAdornment'
import Link from '@mui/material/Link'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { Search } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo, useState, type ReactNode } from 'react'

import { linkFor } from '@/components/mui/links'
import { UL } from '@/components/mui/lists'
import { PostCard } from '@/components/mui/PostCard'
import { filterPosts, normalizeQuery, type BlogSearchItem } from '@/lib/blog-data'

type Props = {
  /** Lista ligera de TODOS los posts (title, excerpt, categoria, fecha y ruta), por props. */
  posts: BlogSearchItem[]
  /** Secciones del indice (destacada y categorias): lo que se ve sin consulta. */
  children: ReactNode
}

/**
 * Isla cliente de busqueda del indice (D-17). Filtra sobre `title` y `excerpt` de
 * la lista ligera, normalizados sin tildes, mientras la persona escribe.
 *
 * Sin consulta, el arbol del servidor (`children`, con todas las tarjetas y todos
 * los enlaces) es lo unico que se renderiza y la region de estado queda vacia: la
 * busqueda nunca reduce el contenido indexable. Con consulta, el cliente cambia
 * las secciones por la lista de resultados y la region `role="status"`
 * (`aria-live="polite"`) anuncia el conteo.
 *
 * El campo vive en un `form role="search"` con `action` a /search y `method="get"`:
 * con JavaScript el envio no navega (ya se filtro); sin JavaScript, Enter llega a
 * la pagina /search actual, asi el control nunca queda muerto. Escape vacia el
 * campo y restaura las secciones. La consulta es solo texto: React la escapa y
 * nunca se inyecta como HTML (T-55-35).
 */
export function BlogSearch({ posts, children }: Props) {
  const t = useTranslations('blog.search')
  const locale = useLocale()
  const [query, setQuery] = useState('')

  const searching = normalizeQuery(query) !== ''
  const results = useMemo(() => (searching ? filterPosts(posts, query) : []), [posts, query, searching])
  const action = locale === 'en' ? '/en/search' : '/search'

  return (
    <>
      <Box sx={{ pb: { xs: 6, md: 8 } }}>
        <Container maxWidth="lg" sx={{ display: 'grid', gap: 1.5 }}>
          <Box
            component="form"
            role="search"
            method="get"
            action={action}
            aria-label={t('formAria')}
            onSubmit={(event) => event.preventDefault()}
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'minmax(0,1fr)', sm: 'minmax(0,1fr) auto' },
              gap: 2,
              alignItems: 'start',
              maxWidth: 640,
            }}
          >
            <TextField
              id="blog-search-q"
              type="search"
              name="q"
              label={t('fieldLabel')}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape' && query !== '') {
                  event.preventDefault()
                  setQuery('')
                }
              }}
              autoComplete="off"
              fullWidth
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={18} aria-hidden="true" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button type="submit" variant="contained" size="large" sx={{ minHeight: 56 }}>
              {t('submit')}
            </Button>
          </Box>
          <Typography role="status" aria-live="polite" variant="body2" color="text.secondary" sx={{ minHeight: '1.25rem' }}>
            {searching ? t('resultCount', { count: results.length }) : ''}
          </Typography>
        </Container>
      </Box>

      {searching ? (
        <Box component="section" aria-labelledby="blog-results-t" sx={{ pb: { xs: 8, md: 12 } }}>
          <Container maxWidth="lg">
            <Typography id="blog-results-t" variant="h3" component="h2" sx={{ mb: 3 }}>
              {t('resultsTitle')}
            </Typography>
            {results.length > 0 ? (
              <UL
                data-search-results=""
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'repeat(2, minmax(0,1fr))', lg: 'repeat(3, minmax(0,1fr))' },
                  gap: 2,
                  '& > li': { display: 'grid', minWidth: 0 },
                }}
              >
                {results.map((post) => (
                  <li key={post.href}>
                    <PostCard
                      href={post.href}
                      title={post.title}
                      excerpt={post.excerpt}
                      categoryLabel={post.categoryLabel}
                      dateISO={post.dateISO}
                    />
                  </li>
                ))}
              </UL>
            ) : (
              <Box sx={{ display: 'grid', gap: 1.5, justifyItems: 'start' }}>
                <Typography variant="body1" color="text.secondary">
                  {t('noResults')}
                </Typography>
                <Link
                  component={linkFor('/search')}
                  href={`/search?q=${encodeURIComponent(query.trim())}`}
                  sx={{ display: 'inline-flex', alignItems: 'center', minHeight: 40, fontWeight: 600 }}
                >
                  {t('siteSearch')}
                </Link>
              </Box>
            )}
          </Container>
        </Box>
      ) : (
        <div data-blog-sections="">{children}</div>
      )}
    </>
  )
}
