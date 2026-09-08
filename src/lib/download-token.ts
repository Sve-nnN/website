import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Token autocontenido y firmado que autoriza UNA descarga de UN lead magnet
 * por un rato corto — la credencial que la página `/blog/confirm` verifica
 * antes de resolver la URL firmada de Cloudinary (MAIL-03, MAIL-05).
 *
 * HELPER PURO: cero consulta a la base, sin dependencia del CMS ni de la
 * colección de correos. Todo lo que hace falta para verificar viaja adentro
 * del propio token — nada que este archivo necesite saber sobre quién dejó
 * su correo, para que la tienda de v2.2 lo reuse sin reescribir nada.
 *
 * Formato: base64url(`${leadMagnetId}.${expiresAt}.${signatureHex}`), firma
 * HMAC-SHA256 sobre `PAYLOAD_SECRET` (el mismo secreto que ya protege las
 * sesiones de admin — no un secreto nuevo que gestionar). La comparación de
 * firma usa `crypto.timingSafeEqual`, nunca `===`: una comparación plana
 * termina apenas encuentra el primer byte distinto, y ese tiempo de respuesta
 * ligeramente distinto es, en teoría, información que un atacante paciente
 * puede usar para adivinar la firma byte a byte (ataque de temporización).
 * `timingSafeEqual` siempre tarda lo mismo sin importar en qué byte difieren.
 */

function getSecret(): string {
  const secret = process.env.PAYLOAD_SECRET

  if (!secret) {
    throw new Error('PAYLOAD_SECRET no está configurado — no se puede firmar/verificar un token.')
  }

  return secret
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex')
}

export function mintDownloadToken(leadMagnetId: number, expiresInSeconds = 900): string {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds
  const payload = `${leadMagnetId}.${expiresAt}`
  const signature = sign(payload, getSecret())

  return Buffer.from(`${payload}.${signature}`, 'utf8').toString('base64url')
}

export function verifyDownloadToken(token: string): { leadMagnetId: number } | null {
  let decoded: string

  try {
    decoded = Buffer.from(token, 'base64url').toString('utf8')
  } catch {
    return null
  }

  const parts = decoded.split('.')
  if (parts.length !== 3) return null

  const [leadMagnetIdRaw, expiresAtRaw, signature] = parts
  const payload = `${leadMagnetIdRaw}.${expiresAtRaw}`
  const expectedSignature = sign(payload, getSecret())

  const providedBuf = Buffer.from(signature, 'utf8')
  const expectedBuf = Buffer.from(expectedSignature, 'utf8')

  // Longitudes distintas ya descartan el token sin llamar a timingSafeEqual,
  // que exige buffers del mismo tamaño (si no, tira). Una firma HMAC-SHA256
  // en hex siempre mide 64 caracteres, así que esto solo dispara con un
  // token manipulado a mano.
  if (providedBuf.length !== expectedBuf.length) return null
  if (!timingSafeEqual(providedBuf, expectedBuf)) return null

  const expiresAt = Number(expiresAtRaw)
  const leadMagnetId = Number(leadMagnetIdRaw)

  if (!Number.isFinite(expiresAt) || !Number.isFinite(leadMagnetId)) return null
  if (Math.floor(Date.now() / 1000) > expiresAt) return null

  return { leadMagnetId }
}
