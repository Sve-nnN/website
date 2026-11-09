/**
 * Fecha larga en el idioma de la pagina, en UTC para que servidor y cliente
 * coincidan (sin desfase de zona horaria). null si la fecha no se puede leer.
 */
export function formatLongDateUtc(iso: string | null | undefined, locale: string): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(date)
}
