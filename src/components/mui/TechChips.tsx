'use client'

import Chip from '@mui/material/Chip'

import { UL } from './lists'

/**
 * Lista etiquetada de chips pequenos. Estaticos, no interactivos. La etiqueta
 * accesible llega por `label` (cada vista la toma de messages).
 */
export function TechChips({ items, label }: { items: string[]; label: string }) {
  return (
    <UL aria-label={label} sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {items.map((t, i) => (
        <Chip key={`${i}-${t}`} component="li" label={t} size="small" />
      ))}
    </UL>
  )
}
