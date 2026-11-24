import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import { CheckCircle, XCircle } from 'lucide-react'
import { getPayload } from 'payload'

import config from '@payload-config'
import { verifyDownloadToken } from '@/lib/download-token'
import { resolveSignedDownloadUrl } from '@/lib/secure-download'

/**
 * Página de confirmación del doble opt-in del lead magnet (Phase 49-01).
 *
 * Un solo segmento compartido entre `es`/`en` (mismo patrón que
 * `[locale]/stack/page.tsx`) — sin par `/blog/confirmar`↔`/blog/confirm`,
 * cero cambio de middleware. Nunca se indexa (49-CONTEXT.md): la ruta vive
 * dentro de `[locale]` con `robots:{index:false}`.
 *
 * `force-dynamic`, no ISR: cada visita trae un `token` distinto en la URL, y
 * la URL firmada de Cloudinary que resuelve tiene que generarse fresca en
 * cada request (expiración corta, MAIL-03) — cachear esta página serviría
 * una URL de descarga ya vencida.
 */
export const dynamic = 'force-dynamic'

const COPY = {
  es: {
    title: 'Confirmación de descarga',
    successHeading: '¡Confirmado!',
    successBody: 'Tu checklist está listo. Descárgalo abajo.',
    downloadLabel: 'Descargar el checklist (PDF)',
    errorHeading: 'Este enlace ya no es válido',
    errorBody:
      'El enlace de confirmación caducó o ya se usó. Vuelve al artículo y déjanos tu correo de nuevo para recibir uno nuevo.',
  },
  en: {
    title: 'Download confirmation',
    successHeading: 'Confirmed!',
    successBody: 'Your checklist is ready. Download it below.',
    downloadLabel: 'Download the checklist (PDF)',
    errorHeading: 'This link is no longer valid',
    errorBody:
      'This confirmation link expired or was already used. Go back to the article and leave your email again to get a new one.',
  },
} as const

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const c = COPY[locale as 'es' | 'en'] ?? COPY.es

  return {
    title: c.title,
    robots: { index: false, follow: true },
  }
}

async function resolveDownloadUrl(token: string | undefined): Promise<string | null> {
  if (!token) return null

  const verified = verifyDownloadToken(token)
  if (!verified) return null

  const payload = await getPayload({ config })

  try {
    const doc = await payload.findByID({
      collection: 'lead-magnets',
      id: verified.leadMagnetId,
    })

    if (!doc) return null

    return resolveSignedDownloadUrl(doc.cloudinaryPublicId)
  } catch {
    // Doc borrado o id inexistente — mismo estado de error que un token
    // vencido, no un 500.
    return null
  }
}

export default async function BlogConfirmPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { locale } = await params
  const { token } = await searchParams
  const c = COPY[locale as 'es' | 'en'] ?? COPY.es

  const downloadUrl = await resolveDownloadUrl(token)

  // Plan 57-07 (D-06): la vista pasó de utilidades Tailwind a MUI sin cambiar la composición:
  // columna centrada de 448 px (max-w-md), 64 px de aire vertical (py-16) y el icono de 48 px.
  return (
    <Box>
      <Container maxWidth={false} sx={{ maxWidth: 448, py: 8, textAlign: 'center' }}>
        {downloadUrl ? (
          <>
            <Box aria-hidden="true" sx={{ display: 'flex', justifyContent: 'center', color: 'primary.main' }}>
              <CheckCircle size={48} />
            </Box>
            <Typography variant="h4" component="h1" sx={{ mt: 2 }}>
              {c.successHeading}
            </Typography>
            <Typography variant="body1" sx={{ mt: 1.5, color: 'text.secondary' }}>
              {c.successBody}
            </Typography>
            <Button component="a" href={downloadUrl} variant="contained" sx={{ mt: 3 }}>
              {c.downloadLabel}
            </Button>
          </>
        ) : (
          <>
            <Box aria-hidden="true" sx={{ display: 'flex', justifyContent: 'center', color: 'error.main' }}>
              <XCircle size={48} />
            </Box>
            <Typography variant="h4" component="h1" sx={{ mt: 2 }}>
              {c.errorHeading}
            </Typography>
            <Typography variant="body1" sx={{ mt: 1.5, color: 'text.secondary' }}>
              {c.errorBody}
            </Typography>
          </>
        )}
      </Container>
    </Box>
  )
}
