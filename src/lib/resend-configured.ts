/**
 * Espejo exacto de `hasCloudinaryCreds` (`src/payload.config.ts`) — mismo
 * criterio, nueva variable. Existe para decidir ANTES de intentar enviar
 * (Phase 49-01, MAIL-04): `contact.ts`/`subscribe.tsx` solo descubren una
 * key rota al fallar `payload.sendEmail`, lo que basta para un formulario de
 * contacto pero no alcanza acá — un lead magnet tiene que entregarse aunque
 * no exista una key real, y eso exige saberlo antes de intentar, no después.
 */
export function isResendConfigured(): boolean {
  const key = process.env.RESEND_API_KEY
  return Boolean(key && key.trim().length > 0)
}
