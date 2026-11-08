'use client'

import { useTranslations } from 'next-intl'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import { ArrowRight } from 'lucide-react'

import { Link as LocaleLink } from '@/i18n/navigation'

type Props = { locale: 'es' | 'en' }

// Vista de la 404 (PAG-11). Sin landmark main propio: el documento posee el unico.
export function NotFoundView(_props: Props) {
  const t = useTranslations('notFound')

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
      <Container
        maxWidth="md"
        sx={{ position: 'relative', zIndex: 1, display: 'grid', gap: 3, justifyItems: 'center' }}
      >
        <Typography id="nf-t" variant="h2" component="h1">
          {t('heading')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.125rem', maxWidth: 560 }}>
          {t('body')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button
            component={LocaleLink}
            href="/"
            variant="contained"
            size="large"
            endIcon={<ArrowRight size={18} aria-hidden="true" />}
          >
            {t('backHome')}
          </Button>
          <Button component={LocaleLink} href="/contact" variant="outlined" size="large">
            {t('writeToJuan')}
          </Button>
        </Box>
      </Container>
    </Box>
  )
}
