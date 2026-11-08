'use client'

import Box from '@mui/material/Box'
import {
  ChartLine,
  Clock,
  Code,
  Gauge,
  Globe,
  ListOrdered,
  MapPin,
  Search,
  Server,
  Sparkles,
  Wrench,
  type LucideProps,
} from 'lucide-react'
import type { ComponentType } from 'react'

import {
  CONTACT_ICON_NAMES,
  SERVICE_ICON_NAMES,
  type ContactIconName,
  type ServiceIconName,
} from '@/lib/shadow-icons'

/** Los 11 nombres de src/lib/shadow-icons.ts. La lista de nombres es la fuente; este mapa solo les da un glifo. */
export type IconName = ServiceIconName | ContactIconName

const GLYPHS: Record<IconName, ComponentType<LucideProps>> = {
  search: Search,
  code: Code,
  server: Server,
  gauge: Gauge,
  sparkles: Sparkles,
  list: ListOrdered,
  wrench: Wrench,
  chart: ChartLine,
  clock: Clock,
  'map-pin': MapPin,
  globe: Globe,
}

const KNOWN = new Set<string>([...SERVICE_ICON_NAMES, ...CONTACT_ICON_NAMES])

function isIconName(name: string): name is IconName {
  return KNOWN.has(name)
}

/**
 * Icono decorativo (`aria-hidden`, 20px, trazo 2). Un nombre desconocido, por
 * ejemplo un valor viejo guardado en un select, devuelve null sin lanzar.
 */
export function Icon({ name, ...rest }: { name: string } & LucideProps) {
  if (!isIconName(name)) return null
  const Glyph = GLYPHS[name]
  return <Glyph aria-hidden="true" size={20} strokeWidth={2} {...rest} />
}

/** Cuadro de 40 x 40 en `raised` con el glifo en `accentText`. Sin glifo conocido, no pinta nada. */
export function IconTile({ name }: { name: string }) {
  if (!isIconName(name)) return null
  return (
    <Box
      sx={{
        width: 40,
        height: 40,
        display: 'grid',
        placeItems: 'center',
        borderRadius: 1,
        bgcolor: 'raised',
        color: 'accentText',
        flex: 'none',
      }}
    >
      <Icon name={name} />
    </Box>
  )
}
