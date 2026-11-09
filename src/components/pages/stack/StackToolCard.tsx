'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import { ExternalLink, Minus, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { AFFILIATE_REL } from '@/components/AffiliateLink'
import { linkFor } from '@/components/mui/links'
import type { StackTool } from '@/lib/stack-data'

/** Texto solo para lectores de pantalla (el sufijo de otra pestana y de afiliado). */
export const VISUALLY_HIDDEN = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
} as const

/**
 * Tarjeta de una herramienta del stack. Es un `li`: la lista la pone StackView.
 *
 * Una sola maquina de estados visual para los tres casos de afiliado (activo,
 * sin programa todavia y sin programa por diseno, como Search Console): solo
 * cambian el chip y el boton, el resto de la tarjeta pesa igual siempre. Nunca
 * `opacity` ni `disabled` aqui.
 *
 * El logo es opcional: sin `logoUrl` no hay tile, ni letra ni icono inventados.
 * La imagen lleva `alt=""` porque el nombre (h3) ya esta al lado.
 */
export function StackToolCard({ tool }: { tool: StackTool }) {
  const t = useTranslations('stackPage')
  const tStack = useTranslations('stack')
  const tCommon = useTranslations('common')

  const { name, logoUrl, narrative, pro, con, reference, cta } = tool
  const ReferenceLink = reference ? linkFor(reference.href) : null

  return (
    <Card
      component="li"
      sx={{ p: { xs: 3, md: 4 }, display: 'grid', gap: 2.5, alignContent: 'start', minWidth: 0 }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
          {logoUrl && (
            <Box
              sx={{
                width: 56,
                height: 56,
                flex: 'none',
                borderRadius: 2,
                bgcolor: '#FAFAF7',
                display: 'grid',
                placeItems: 'center',
                border: 1,
                borderColor: 'divider',
              }}
            >
              <Box
                component="img"
                src={logoUrl}
                alt=""
                width={36}
                height={36}
                loading="lazy"
                decoding="async"
                sx={{ width: 36, height: 36, objectFit: 'contain' }}
              />
            </Box>
          )}
          <Typography variant="h5" component="h3" sx={{ overflowWrap: 'anywhere' }}>
            {name}
          </Typography>
        </Box>
        {cta.kind === 'active' && <Chip size="small" label={tStack('chip.active')} sx={{ bgcolor: 'raised' }} />}
        {cta.kind === 'pending' && <Chip size="small" variant="outlined" label={t('badgePending')} />}
        {cta.kind === 'none' && <Chip size="small" variant="outlined" label={tStack('chip.none')} />}
      </Box>

      {narrative && (
        <Box>
          <Typography variant="overline" color="text.secondary" component="p">
            {t('rowUsage')}
          </Typography>
          <Typography variant="body1" sx={{ fontSize: '1rem', lineHeight: '1.75rem' }}>
            {narrative}
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', sm: 'repeat(2, minmax(0,1fr))' }, gap: 2 }}>
        {pro && (
          <Box sx={{ p: 2, borderRadius: 1.5, bgcolor: 'raised', display: 'grid', gap: 0.75, alignContent: 'start', minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              component="h4"
              sx={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}
            >
              <Plus size={16} aria-hidden="true" />
              {t('rowPro')}
            </Typography>
            <Typography variant="body2">{pro}</Typography>
          </Box>
        )}
        <Box sx={{ p: 2, borderRadius: 1.5, bgcolor: 'raised', display: 'grid', gap: 0.75, alignContent: 'start', minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            component="h4"
            sx={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 1, color: 'warning.main' }}
          >
            <Minus size={16} aria-hidden="true" />
            {t('rowCon')}
          </Typography>
          <Typography variant="body2">{con ?? t('rowConEmpty')}</Typography>
        </Box>
      </Box>

      {reference && ReferenceLink && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary">
            {t('rowReference')}
          </Typography>
          <Chip
            component={ReferenceLink}
            href={reference.href}
            clickable
            label={reference.label}
            sx={{ height: 'auto', minHeight: 40, '& .MuiChip-label': { whiteSpace: 'normal', py: 0.5 } }}
          />
        </Box>
      )}

      {cta.kind === 'active' && (
        <Button
          href={cta.href}
          target="_blank"
          rel={AFFILIATE_REL}
          variant="contained"
          endIcon={<ExternalLink size={16} aria-hidden="true" />}
          sx={{ justifySelf: 'start' }}
        >
          {cta.label ?? t('ctaDefault', { tool: name })}
          <Box component="span" sx={VISUALLY_HIDDEN}>
            {' '}
            ({tCommon('opensInNewTabAffiliate')})
          </Box>
        </Button>
      )}
    </Card>
  )
}
