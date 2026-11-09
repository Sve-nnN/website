'use client'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import Link from '@mui/material/Link'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useTranslations } from 'next-intl'

import { linkFor } from '@/components/mui/links'
import { UL } from '@/components/mui/lists'
import { PageHero } from '@/components/mui/PageHero'

export type SearchResult = {
  id: string | number
  /** `relationTo` del documento indexado: posts, case-studies o authors. */
  type: string
  title: string
  description?: string | null
  href: string
}

type Props = {
  /** Consulta ya recortada por la ruta (T-54-43). `null` o vacia: no se busco. */
  query: string | null
  /** `null` cuando no hay consulta o la consulta fallo. */
  results: SearchResult[] | null
  failed: boolean
}

const KNOWN_TYPES = ['posts', 'case-studies', 'authors'] as const
type KnownType = (typeof KNOWN_TYPES)[number]

function isKnownType(type: string): type is KnownType {
  return (KNOWN_TYPES as readonly string[]).includes(type)
}

/**
 * Vista de la busqueda (PAG-12). Sin landmark main propio: el documento posee
 * el unico. El estado de la busqueda llega por props desde la ruta, que conserva
 * la consulta, el robots y `force-dynamic`.
 *
 * T-54-44: la consulta entra como `defaultValue` y como variable ICU; React y
 * next-intl la escapan, nunca se inyecta HTML en crudo.
 */
export function SearchView({ query, results, failed }: Props) {
  const t = useTranslations('search')
  const tCommon = useTranslations('common')

  const searched = Boolean(query)
  const showCount = searched && !failed && results !== null
  const hasResults = showCount && results.length > 0
  const isEmpty = showCount && results.length === 0

  return (
    <>
      <PageHero
        compact
        crumbs={[{ label: tCommon('breadcrumbHome'), href: '/' }, { label: t('title') }]}
        title={t('title')}
      />

      <Box sx={{ pb: { xs: 8, md: 10 } }}>
        <Container maxWidth="lg" sx={{ display: 'grid', gap: 3 }}>
          <Box
            component="form"
            role="search"
            method="get"
            action=""
            aria-label={t('formAria')}
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'minmax(0,1fr)', sm: 'minmax(0,1fr) auto' },
              gap: 2,
              alignItems: 'start',
              maxWidth: 720,
            }}
          >
            <TextField
              id="search-q"
              type="search"
              name="q"
              label={t('fieldLabel')}
              placeholder={t('placeholder')}
              defaultValue={query ?? ''}
              autoComplete="off"
              fullWidth
            />
            <Button type="submit" variant="contained" size="large" sx={{ minHeight: 56 }}>
              {t('submit')}
            </Button>
          </Box>

          {failed && (
            <Alert severity="error" role="alert">
              {t('errorHeading')}
            </Alert>
          )}

          {showCount && (
            <Typography role="status" aria-live="polite" variant="body2" color="text.secondary">
              {t('resultCount', { count: results.length })}
            </Typography>
          )}

          {hasResults && (
            <UL role="list" sx={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 2 }}>
              {results.map((r) => (
                <Box key={r.id} component="li" sx={{ display: 'grid', minWidth: 0 }}>
                  <Card
                    sx={{
                      position: 'relative',
                      p: 3,
                      display: 'grid',
                      gap: 1.5,
                      justifyItems: 'start',
                      minWidth: 0,
                      '&:hover': { borderColor: 'text.primary' },
                      '&:has(a:focus-visible)': {
                        outline: '2px solid var(--jt-palette-accentText)',
                        outlineOffset: '2px',
                      },
                    }}
                  >
                    {isKnownType(r.type) && <Chip size="small" label={t(`typeLabels.${r.type}`)} />}
                    <Typography variant="h6" component="h2" sx={{ overflowWrap: 'anywhere' }}>
                      <Link
                        component={linkFor(r.href)}
                        href={r.href}
                        underline="none"
                        sx={{
                          color: 'text.primary',
                          '&:focus-visible': { outline: 'none' },
                          '&::after': { content: '""', position: 'absolute', inset: 0 },
                        }}
                      >
                        {r.title}
                      </Link>
                    </Typography>
                    {r.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          overflowWrap: 'anywhere',
                        }}
                      >
                        {r.description}
                      </Typography>
                    )}
                  </Card>
                </Box>
              ))}
            </UL>
          )}

          {isEmpty && query && (
            <Box sx={{ display: 'grid', gap: 2, justifyItems: 'start', pt: 2 }}>
              <Typography variant="h5" component="h2" sx={{ overflowWrap: 'anywhere' }}>
                {t('noResultsHeading', { q: query })}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640 }}>
                {t('noResultsBody')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <Button component={linkFor('/blog')} href="/blog" variant="outlined">
                  {t('blogLink')}
                </Button>
                <Button component={linkFor('/case-studies')} href="/case-studies" variant="outlined">
                  {t('casesLink')}
                </Button>
              </Box>
            </Box>
          )}
        </Container>
      </Box>
    </>
  )
}
