import { CheckCircle, XCircle } from 'lucide-react'
import { getPayload } from 'payload'

import config from '@payload-config'
import { Container } from '@/components/Container'
import { Button } from '@/components/ui/button'
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

  return (
    <main>
      <Container className="py-16">
        <div className="mx-auto max-w-md text-center">
          {downloadUrl ? (
            <>
              <CheckCircle className="size-12 text-primary mx-auto" aria-hidden="true" />
              <h1 className="font-heading text-heading mt-4">{c.successHeading}</h1>
              <p className="text-body text-muted-foreground mt-3">{c.successBody}</p>
              <Button asChild className="mt-6 h-11">
                <a href={downloadUrl}>{c.downloadLabel}</a>
              </Button>
            </>
          ) : (
            <>
              <XCircle className="size-12 text-destructive mx-auto" aria-hidden="true" />
              <h1 className="font-heading text-heading mt-4">{c.errorHeading}</h1>
              <p className="text-body text-muted-foreground mt-3">{c.errorBody}</p>
            </>
          )}
        </div>
      </Container>
    </main>
  )
}
