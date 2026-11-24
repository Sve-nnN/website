'use client'

import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { Plus } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { motion } from '@/theme/tokens'

export type FaqItem = {
  question: string
  answer: ReactNode
  /** Nodo a la izquierda del titulo dentro del resumen (IconTile en Servicios de la home). */
  adornment?: ReactNode
}

type Props = {
  /** Prefijo de ids: `${idPrefix}-${i}-h` para el resumen y `${idPrefix}-${i}-c` para el panel. */
  idPrefix: string
  items: FaqItem[]
  /** Indice abierto al inicio. `false` deja todos cerrados. */
  defaultOpen?: number | false
  /** Nivel del encabezado que envuelve cada resumen. */
  headingLevel?: 2 | 3
}

/**
 * Acordeon compartido de FAQ y servicios. Un panel abierto a la vez.
 *
 * NUNCA desmonta los paneles cerrados al salir de la transicion: el texto de las
 * respuestas tiene que estar en el HTML servido (SEO-03, Pitfall 7). El icono
 * Plus rota 45 grados al abrir (en lugar de los 180 del icono por defecto).
 */
export function FaqAccordion({ idPrefix, items, defaultOpen = 0, headingLevel = 3 }: Props) {
  const [open, setOpen] = useState<number | false>(defaultOpen)
  const heading = headingLevel === 2 ? 'h2' : 'h3'
  return (
    <Box sx={{ display: 'grid', gap: 2, maxWidth: 820 }}>
      {items.map((item, i) => (
        <Accordion
          key={`${i}-${item.question}`}
          expanded={open === i}
          onChange={(_, isOpen) => setOpen(isOpen ? i : false)}
          slotProps={{ heading: { component: heading } }}
        >
          <AccordionSummary
            id={`${idPrefix}-${i}-h`}
            aria-controls={`${idPrefix}-${i}-c`}
            expandIcon={<Plus size={20} aria-hidden="true" />}
            sx={{
              '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 2 },
              '& .MuiAccordionSummary-expandIconWrapper': {
                transition: `transform var(--jt-motion-base, ${motion.base}ms) ${motion.ease}`,
              },
              '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': { transform: 'rotate(45deg)' },
            }}
          >
            {item.adornment}
            <Typography variant="h6" component="span">
              {item.question}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {typeof item.answer === 'string' ? (
              <Typography variant="body1">{item.answer}</Typography>
            ) : (
              item.answer
            )}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  )
}
