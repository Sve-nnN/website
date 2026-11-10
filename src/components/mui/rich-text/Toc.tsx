'use client'

import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { Plus } from 'lucide-react'
import { useEffect, useId, useState } from 'react'

import { motion } from '@/theme/tokens'

import { OL } from '../lists'

export type TocItem = { id: string; text: string; level: number }

type Props = {
  items: TocItem[]
  /** Nombre del indice. Lo da el llamador desde messages: sirve de aria-label, rotulo y resumen. */
  label: string
  /**
   * El llamador pone el sticky y el desplazamiento de la columna (el post lo
   * comparte con la tarjeta de oferta): la lista de escritorio no se fija ni
   * limita su alto por su cuenta. Sin esta prop (Privacy y Terms) se fija sola.
   */
  embedded?: boolean
}

function TocList({
  items,
  active,
  onPick,
}: {
  items: TocItem[]
  active: string
  onPick: (id: string) => void
}) {
  return (
    <OL sx={{ display: 'grid', gap: 0.5 }}>
      {items.map((it) => {
        const on = active === it.id
        return (
          <li key={it.id}>
            <Link
              href={`#${it.id}`}
              onClick={() => onPick(it.id)}
              underline="none"
              aria-current={on ? 'true' : undefined}
              sx={{
                display: 'block',
                py: 0.75,
                pl: it.level >= 3 ? 3.5 : 1.5,
                borderLeft: '2px solid',
                borderColor: on ? 'primary.main' : 'divider',
                color: on ? 'text.primary' : 'text.secondary',
                fontSize: '0.875rem',
                lineHeight: '1.25rem',
                fontWeight: on ? 600 : 400,
                '&:hover': { color: 'text.primary', borderColor: 'text.primary' },
              }}
            >
              {it.text}
            </Link>
          </li>
        )
      })}
    </OL>
  )
}

/**
 * Indice de un documento largo: columna fija desde lg y acordeon colapsado
 * debajo. El enlace activo lleva `aria-current="true"`; el IntersectionObserver
 * solo lo refuerza al hacer scroll, nunca es la unica via (el clic tambien lo
 * fija y el ancla funciona sin JavaScript). Con menos de 2 encabezados no se
 * renderiza. El acordeon movil no declara landmark propio para no duplicar nav.
 */
export function Toc({ items, label, embedded = false }: Props) {
  const [active, setActive] = useState(items[0]?.id ?? '')
  const [open, setOpen] = useState(false)
  const uid = useId()
  const summaryId = `${uid}-h`
  // MUI pone el id del panel (region) desde `aria-controls` del resumen: repetirlo
  // en AccordionDetails duplicaria el id.
  const panelId = `${uid}-c`
  const key = items.map((i) => i.id).join('|')

  useEffect(() => {
    const els = key
      .split('|')
      .map((id) => document.getElementById(id))
      .filter((e): e is HTMLElement => Boolean(e))
    if (els.length === 0 || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-15% 0px -70% 0px' },
    )
    els.forEach((e) => io.observe(e))
    return () => io.disconnect()
  }, [key])

  if (items.length < 2) return null

  return (
    <>
      <Box sx={{ display: { xs: 'block', lg: 'none' }, mb: 4 }}>
        <Accordion
          expanded={open}
          onChange={(_, v) => setOpen(v)}
          slotProps={{ heading: { component: 'h2' } }}
        >
          <AccordionSummary
            id={summaryId}
            aria-controls={panelId}
            expandIcon={<Plus size={20} aria-hidden="true" />}
            sx={{
              '& .MuiAccordionSummary-expandIconWrapper': {
                transition: `transform var(--jt-motion-base, ${motion.base}ms) ${motion.ease}`,
              },
              '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': { transform: 'rotate(45deg)' },
            }}
          >
            <Typography variant="h6" component="span">
              {label}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TocList
              items={items}
              active={active}
              onPick={(id) => {
                setActive(id)
                setOpen(false)
              }}
            />
          </AccordionDetails>
        </Accordion>
      </Box>
      <Box
        component="nav"
        aria-label={label}
        sx={{
          display: { xs: 'none', lg: 'block' },
          ...(embedded
            ? {}
            : {
                position: 'sticky',
                top: 112,
                alignSelf: 'start',
                maxHeight: 'calc(100vh - 144px)',
                overflowY: 'auto',
              }),
        }}
      >
        <Typography variant="overline" component="p" sx={{ color: 'text.secondary', mb: 1.5 }}>
          {label}
        </Typography>
        <TocList items={items} active={active} onPick={setActive} />
      </Box>
    </>
  )
}
