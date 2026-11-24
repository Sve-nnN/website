'use client'

import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTranslations } from 'next-intl'

import { CopyEmailButton } from '@/components/pages/contact/CopyEmailButton'

import { ContactForm } from './ContactForm'
import { GrainBlob } from './GrainBlob'

export type CtaPanelProps = {
  title: string
  lead?: string | null
  email: string
  /** Avatar del autor. Va como imagen decorativa (`alt=""`) junto al nombre. */
  avatarUrl?: string | null
  /** Nombre que acompana al avatar en la pastilla. */
  name?: string | null
}

/**
 * Panel de conversion oscuro con blobs de grano. Fondo fijo `#12141C` y una
 * capa oscura propia sobre los blobs: el texto siempre cae sobre ella, asi el
 * contraste ya medido no depende del movimiento del blob.
 *
 * "Copiar correo" es el mismo `CopyEmailButton` de la pagina Contacto (IN-01):
 * repite "Correo copiado" dos segundos en una region `aria-live` oculta; si el
 * portapapeles falla no cambia nada y el correo sigue seleccionable
 * (`user-select: all`).
 */
export function CtaPanel({ title, lead, email, avatarUrl, name }: CtaPanelProps) {
  const t = useTranslations('contact')

  return (
    <Box
      component="section"
      aria-labelledby="cta-title"
      sx={{
        position: 'relative',
        isolation: 'isolate',
        overflow: 'hidden',
        bgcolor: '#12141C',
        color: '#FAFAF7',
        borderRadius: { xs: 3, md: 4 },
        p: { xs: '40px 24px', md: '80px' },
        display: 'grid',
        gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'minmax(0,1.05fr) minmax(0,0.95fr)' },
        gap: { xs: 6, md: 8 },
        alignItems: 'center',
      }}
    >
      <GrainBlob sx={{ zIndex: -2, width: 640, aspectRatio: '1', left: -220, bottom: -300, filter: 'blur(8px)' }} />
      <GrainBlob
        sx={{
          zIndex: -2,
          width: 480,
          aspectRatio: '1',
          right: -180,
          top: -320,
          opacity: 0.85,
          animationDirection: 'alternate-reverse',
          filter: 'blur(8px)',
        }}
      />
      <Box
        aria-hidden="true"
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: -1,
          background: {
            xs: 'rgba(18,20,28,0.55)',
            md: 'linear-gradient(90deg, rgba(18,20,28,0.62) 0%, rgba(18,20,28,0.25) 55%, rgba(18,20,28,0) 100%)',
          },
        }}
      />

      <Stack spacing={3} sx={{ alignItems: 'flex-start' }}>
        {(avatarUrl || name) && (
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: 'center',
              p: '4px 12px 4px 4px',
              borderRadius: 9999,
              bgcolor: 'rgba(250,250,247,0.12)',
              border: '1px solid rgba(250,250,247,0.22)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {avatarUrl && (
              <Box
                component="img"
                src={avatarUrl}
                alt=""
                width={32}
                height={32}
                loading="lazy"
                sx={{ borderRadius: '50%', objectFit: 'cover' }}
              />
            )}
            {name && <Typography variant="body2">{name}</Typography>}
          </Stack>
        )}
        <Typography id="cta-title" variant="h2" component="h2">
          {title}
        </Typography>
        {lead && (
          <Typography variant="body1" sx={{ maxWidth: 460, color: 'rgba(250,250,247,0.86)' }}>
            {lead}
          </Typography>
        )}
        <Stack direction="row" useFlexGap spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography
            variant="mono"
            component="p"
            sx={{
              px: 2,
              py: 1,
              borderRadius: 9999,
              border: '1px dashed rgba(250,250,247,0.5)',
              userSelect: 'all',
              fontSize: '1rem',
              lineHeight: '1.5rem',
            }}
          >
            {email}
          </Typography>
          <CopyEmailButton
            email={email}
            variant="text"
            icon={false}
            sx={{ bgcolor: '#FAFAF7', color: '#12141C', '&:hover': { bgcolor: '#FFFFFF' } }}
          />
        </Stack>
        <Typography variant="caption" sx={{ color: 'rgba(250,250,247,0.75)' }}>
          {t('cta.responseNote')}
        </Typography>
      </Stack>

      <ContactForm variant="panel" email={email} />
    </Box>
  )
}
