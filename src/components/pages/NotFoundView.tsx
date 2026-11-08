'use client'

import { useTranslations } from 'next-intl'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { ArrowRight } from 'lucide-react'

import { GrainBlob } from '@/components/mui/GrainBlob'
import { linkFor } from '@/components/mui/links'
import { UL } from '@/components/mui/lists'
import { buildServicesIndexHref } from '@/lib/service-slugs'

type Props = { locale: 'es' | 'en' }

// Vista de la 404 (PAG-11). Sin landmark main propio: el documento posee el unico.
export function NotFoundView({ locale }: Props) {
  const t = useTranslations('notFound')

  const suggested = [
    { key: 'services', href: buildServicesIndexHref(locale) },
    { key: 'cases', href: '/case-studies' },
    { key: 'blog', href: '/blog' },
    { key: 'contact', href: '/contact' },
  ] as const

  return (
    <Box
      component="section"
      aria-labelledby="nf-t"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        pt: { xs: 18, md: 24 },
        pb: { xs: 10, md: 14 },
        textAlign: 'center',
      }}
    >
      <GrainBlob
        feather={30}
        sx={{
          width: { xs: 340, md: 520 },
          aspectRatio: '1',
          left: '50%',
          top: { xs: 60, md: 40 },
          transform: 'translateX(-50%)',
          opacity: 0.8,
          zIndex: 0,
        }}
      />
      <Container
        maxWidth="md"
        sx={{ position: 'relative', zIndex: 1, display: 'grid', gap: 3, justifyItems: 'center' }}
      >
        {/* Cifra decorativa: no cuenta para el contraste ni la leen los lectores
            de pantalla. */}
        <Typography
          aria-hidden="true"
          component="p"
          sx={{
            fontSize: { xs: '7rem', md: '11rem' },
            lineHeight: 1,
            fontWeight: 600,
            letterSpacing: '-0.04em',
            color: '#12141C',
          }}
        >
          404
        </Typography>
        <Typography id="nf-t" variant="h2" component="h1" sx={{ mt: { xs: 4, md: 8 } }}>
          {t('heading')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.125rem', maxWidth: 560 }}>
          {t('body')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button
            component={linkFor('/')}
            href="/"
            variant="contained"
            size="large"
            endIcon={<ArrowRight size={18} aria-hidden="true" />}
          >
            {t('backHome')}
          </Button>
          <Button component={linkFor('/contact')} href="/contact" variant="outlined" size="large">
            {t('writeToJuan')}
          </Button>
        </Box>
        <Box component="nav" aria-label={t('suggestedLabel')} sx={{ mt: 4, width: '100%' }}>
          <Typography variant="overline" component="p" color="text.secondary" sx={{ mb: 2 }}>
            {t('suggestedHeading')}
          </Typography>
          <UL
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              gap: 1.5,
              textAlign: 'left',
            }}
          >
            {suggested.map(({ key, href }) => (
              <li key={key}>
                <Link
                  component={linkFor(href)}
                  href={href}
                  underline="none"
                  sx={{
                    display: 'block',
                    p: 2.5,
                    borderRadius: 2,
                    border: 1,
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    '&:hover': { borderColor: 'text.primary' },
                  }}
                >
                  <Typography variant="subtitle1" component="span" sx={{ display: 'block' }}>
                    {t(`links.${key}.label`)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" component="span">
                    {t(`links.${key}.description`)}
                  </Typography>
                </Link>
              </li>
            ))}
          </UL>
        </Box>
      </Container>
    </Box>
  )
}
