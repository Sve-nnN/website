'use client'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import {
  CircuitBoard,
  Cpu,
  Fan,
  HardDrive,
  Headphones,
  Laptop,
  Layers,
  MemoryStick,
  Monitor,
  Mouse,
  Package,
  Plug,
  Thermometer,
  type LucideIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'

import { AFFILIATE_REL } from '@/components/AffiliateLink'
import { UL } from '@/components/mui/lists'
import { PageHero } from '@/components/mui/PageHero'
import { slugify } from '@/components/mui/rich-text/lexical-toc'
import { Section } from '@/components/mui/Section'
import { AUDITOR_URL } from '@/lib/auditor'
import type { StackViewData } from '@/lib/stack-data'

import { StackToolCard, VISUALLY_HIDDEN } from './stack/StackToolCard'

type Props = {
  /** h1: titulo del doc `stack`. */
  title: string
  /** null cuando el doc no trae bloque toolStack: la vista muestra solo el hero. */
  data: StackViewData | null
}

/** Primer patron que coincide con el nombre del producto; sin coincidencia cae a Package. */
const GEAR_ICONS: ReadonlyArray<readonly [RegExp, LucideIcon]> = [
  [/ryzen|intel|core i/i, Cpu],
  [/ssd|nvme|990/i, HardDrive],
  [/ddr|vengeance|\bram\b/i, MemoryStick],
  [/tomahawk|b850|motherboard/i, CircuitBoard],
  [/macbook|laptop/i, Laptop],
  [/geforce|rtx|radeon/i, Layers],
  [/psu|a1000|corsair rm/i, Plug],
  [/noctua|cooler|nh-d/i, Fan],
  [/arctic|mx-/i, Thermometer],
  [/g305|mouse/i, Mouse],
  [/g435|headset|audifonos|auriculares/i, Headphones],
  [/monitor|ultrawide/i, Monitor],
]

function gearIcon(name: string): LucideIcon {
  return GEAR_ICONS.find(([pattern]) => pattern.test(name))?.[1] ?? Package
}

const PILL_SX = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 40,
  px: 2,
  borderRadius: 9999,
  border: 1,
  borderColor: 'fieldBorder',
  color: 'text.primary',
  fontWeight: 600,
  fontSize: '0.875rem',
  '&:hover': { bgcolor: 'raised' },
} as const

/**
 * Vista de /stack (PAG-08). Sin landmark main propio: el documento posee el
 * unico.
 *
 * Orden del DOM que importa: el aviso de afiliados (`role="note"`, no el
 * `alert` por defecto) vive dentro del hero, antes de cualquier enlace `/go`.
 * Los enlaces de afiliado salen con `AFFILIATE_REL`, `target="_blank"` y un
 * sufijo accesible de otra pestana. Los enlaces a recursos propios o sin
 * programa (Search Console, el auditor) llevan solo `noopener`: no son afiliado.
 */
export function StackView({ title, data }: Props) {
  const t = useTranslations('stackPage')
  const tStack = useTranslations('stack')
  const tCommon = useTranslations('common')
  const tDisclosure = useTranslations('affiliateDisclosure')

  const categories = data?.categories ?? []
  const gear = data?.gear ?? []
  const gearHeading = t('gearHeading')
  const gearAnchor = slugify(gearHeading)

  const navItems = [
    ...categories.map((c) => ({ key: c.id, label: c.heading, href: `#${c.anchor}` })),
    ...(gear.length > 0 ? [{ key: 'gear', label: gearHeading, href: `#${gearAnchor}` }] : []),
  ]

  const highlights = [
    data?.elegiriaHoy
      ? { id: 'stack-elegiria', heading: t('elegiriaHoyHeading'), body: data.elegiriaHoy, badge: null, link: null }
      : null,
    data?.noCommissionPick
      ? {
          id: 'stack-nocommission',
          heading: t('noCommissionHeading'),
          body: data.noCommissionPick.narrative,
          badge: t('noCommissionBadge'),
          link: data.noCommissionPick.href ? { href: data.noCommissionPick.href, label: t('gscLinkLabel') } : null,
        }
      : null,
    data?.auditorNarrative
      ? {
          id: 'stack-auditor',
          heading: t('auditorHeading'),
          body: data.auditorNarrative,
          badge: null,
          link: { href: AUDITOR_URL, label: t('auditorCta') },
        }
      : null,
  ].filter((h): h is NonNullable<typeof h> => h !== null)

  return (
    <>
      <PageHero
        crumbs={[{ label: tCommon('breadcrumbHome'), href: '/' }, { label: t('title') }]}
        eyebrow={tStack('eyebrow')}
        title={title}
        lead={data?.intro ?? undefined}
      >
        <Alert severity="info" role="note" sx={{ maxWidth: 760, '& .MuiAlert-message': { fontSize: '0.9375rem' } }}>
          {tDisclosure('generalDisclosure')} {tDisclosure('amazonDisclosure')}
        </Alert>
        {navItems.length > 0 && (
          <Box component="nav" aria-label={tStack('categoriesLabel')}>
            <UL role="list" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {navItems.map((item) => (
                <li key={item.key}>
                  <Link href={item.href} underline="none" sx={PILL_SX}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </UL>
          </Box>
        )}
      </PageHero>

      {categories.map((category, i) => (
        // El ancla vive en un contenedor propio con scroll-margin-top: la Section no expone sx.
        <Box key={category.id} id={category.anchor} sx={{ scrollMarginTop: '96px' }}>
          <Section id={`stack-cat-${i}`} band={i % 2 === 1} py={i % 2 === 0} title={category.heading}>
            <UL
              role="list"
              aria-label={tStack('toolsLabel', { category: category.heading })}
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'minmax(0,1fr)',
                  md: category.tools.length === 1 ? 'minmax(0,1fr)' : 'repeat(2, minmax(0,1fr))',
                },
                gap: 2,
                alignItems: 'start',
              }}
            >
              {category.tools.map((tool) => (
                <StackToolCard key={tool.name} tool={tool} />
              ))}
            </UL>
          </Section>
        </Box>
      ))}

      {highlights.length > 0 && (
        <Box sx={{ py: { xs: 6, md: 8 } }}>
          <Container maxWidth="lg">
            <UL role="list" sx={{ display: 'grid', gap: 3 }}>
              {highlights.map((h) => (
                <li key={h.id}>
                  <Card
                    component="section"
                    aria-labelledby={`${h.id}-t`}
                    sx={{ p: { xs: 3, md: 4 }, display: 'grid', gap: 2, bgcolor: 'raised', justifyItems: 'start' }}
                  >
                    <Typography id={`${h.id}-t`} variant="h5" component="h2">
                      {h.heading}
                    </Typography>
                    {h.badge && <Chip size="small" label={h.badge} />}
                    <Typography variant="body1" sx={{ maxWidth: 760 }}>
                      {h.body}
                    </Typography>
                    {h.link && (
                      <Link href={h.link.href} target="_blank" rel="noopener" sx={{ fontWeight: 600 }}>
                        {h.link.label}
                        <Box component="span" sx={VISUALLY_HIDDEN}>
                          {' '}
                          ({t('opensInNewTab')})
                        </Box>
                      </Link>
                    )}
                  </Card>
                </li>
              ))}
            </UL>
          </Container>
        </Box>
      )}

      {gear.length > 0 && (
        <Box id={gearAnchor} sx={{ scrollMarginTop: '96px' }}>
          <Section id="stack-gear" title={gearHeading}>
            {data?.gearIntro && (
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 760, mb: 4 }}>
                {data.gearIntro}
              </Typography>
            )}
            <UL
              role="list"
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'minmax(0,1fr)',
                  sm: 'repeat(2, minmax(0,1fr))',
                  lg: 'repeat(3, minmax(0,1fr))',
                },
                gap: 1.5,
              }}
            >
              {gear.map((item) => {
                const Icon = gearIcon(item.name)
                return (
                  <Card key={item.name} component="li" sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      aria-hidden="true"
                      sx={{
                        width: 44,
                        height: 44,
                        flex: 'none',
                        borderRadius: 1.5,
                        bgcolor: 'raised',
                        color: 'accentText',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <Icon size={22} />
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.35, flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
                      {item.name}
                    </Typography>
                    <Button
                      href={item.href}
                      target="_blank"
                      rel={AFFILIATE_REL}
                      variant="outlined"
                      size="small"
                      sx={{ flex: 'none' }}
                    >
                      {t('ctaAmazon')}
                      <Box component="span" sx={VISUALLY_HIDDEN}>
                        : {item.name} ({tCommon('opensInNewTabAffiliate')})
                      </Box>
                    </Button>
                  </Card>
                )
              })}
            </UL>
          </Section>
        </Box>
      )}
    </>
  )
}
