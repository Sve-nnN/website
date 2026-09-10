import { v2 as cloudinary } from 'cloudinary'

/**
 * URL firmada y de expiración corta para servir un recurso privado de
 * Cloudinary (`resource_type:'raw', type:'authenticated'`) — el lead magnet
 * en PDF, per MAIL-03.
 *
 * HELPER PURO (MAIL-05): sin dependencia del CMS ni de la colección de
 * correos. La tienda de v2.2 tiene que poder importar este archivo sin
 * arrastrar nada de la lógica de opt-in — si algún día este archivo necesita
 * saber quién dejó su correo, ese conocimiento va en el llamador, nunca acá.
 *
 * `cloudinary.config()` no se vuelve a llamar acá: es un singleton a nivel de
 * proceso, y `src/lib/cloudinary-adapter.ts` ya lo configura en su scope de
 * módulo. Ambos archivos corren dentro del mismo proceso de Payload/Next, así
 * que para cuando este helper se invoca, la config ya corrió. Confirmado en
 * el smoke test de este mismo plan (subida real + descarga real vía la URL
 * firmada) — si algún día esto deja de sostenerse, el fallo es inmediato y
 * ruidoso (credenciales vacías), no silencioso.
 *
 * `private_download_url` firma la URL con el secreto de Cloudinary
 * internamente — nunca construir esa firma a mano acá (RESEARCH.md V6).
 */
export function resolveSignedDownloadUrl(publicId: string, expiresInSeconds = 900): string {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds

  return cloudinary.utils.private_download_url(publicId, 'pdf', {
    resource_type: 'raw',
    type: 'authenticated',
    expires_at: expiresAt,
    attachment: true,
  })
}
