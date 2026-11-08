'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import { UL } from './lists'

export type TestimonialItem = {
  id: string | number
  quote: string
  name: string
  role?: string | null
}

/**
 * Rejilla de citas de clientes. Respeta cero, uno y muchos: cero no renderiza
 * nada, uno es una columna de 760px como maximo, dos van en dos columnas desde
 * `md` y tres o mas en tres. Nunca pinta ranuras de muestra.
 *
 * Usa los tokens `band.*` del tema: se coloca dentro de una franja band que
 * provee el llamador (por ejemplo `Section band`).
 */
export function TestimonialCards({ items }: { items: TestimonialItem[] }) {
  if (items.length === 0) return null
  const columns =
    items.length === 1
      ? 'minmax(0,1fr)'
      : { xs: 'minmax(0,1fr)', md: `repeat(${items.length === 2 ? 2 : 3}, minmax(0,1fr))` }
  return (
    <UL
      sx={{
        display: 'grid',
        gridTemplateColumns: columns,
        gap: 2,
        ...(items.length === 1 ? { maxWidth: 760 } : {}),
      }}
    >
      {items.map((s) => (
        <Box key={s.id} component="li" sx={{ display: 'grid' }}>
          <Box
            component="figure"
            sx={{
              m: 0,
              p: 4,
              borderRadius: 2,
              border: 1,
              borderColor: 'band.border',
              bgcolor: 'band.surface',
              color: 'band.text',
              display: 'grid',
              gap: 4,
              alignContent: 'space-between',
            }}
          >
            <Typography component="blockquote" variant="h5" sx={{ m: 0 }}>
              {s.quote}
            </Typography>
            <Box component="figcaption" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                aria-hidden="true"
                sx={{
                  width: 40,
                  height: 40,
                  flex: 'none',
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 600,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                }}
              >
                {s.name.trim().charAt(0).toLocaleUpperCase()}
              </Box>
              <Box>
                <Typography variant="body1" component="p" sx={{ fontWeight: 600 }}>
                  {s.name}
                </Typography>
                {s.role && (
                  <Typography variant="body2" component="p">
                    {s.role}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      ))}
    </UL>
  )
}
