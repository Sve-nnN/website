// PURE FUNCTION — a propósito, este archivo no importa el paquete de Payload
// ni su config (igual que src/lib/affiliate.ts), para poder ser consumido
// desde cualquier componente (server o client) sin arrastrar la config de
// Payload. No agregar una llamada a DB a este archivo.

export type AffiliateCtaResolvableLink = {
  program?: string | null
  active?: boolean | null
  slug?: string | null
  ctaLabel?: string | null
}

export type AffiliateCta =
  | { kind: 'pending' }
  | { kind: 'none' }
  | { kind: 'active'; href: string; label: string }

/**
 * Resuelve el estado del CTA de un `affiliateLink` relationship. Contrato
 * (48-RESEARCH.md Pitfall 2): SIEMPRE comprobar que `value` es un objeto
 * poblado ANTES de leer cualquier subcampo — un `null`/`undefined`
 * (relación vacía) y un ID crudo sin poblar (relación con acceso denegado,
 * Payload los deja como el ID en vez de null) deben caer en el mismo branch
 * "pending", nunca construir `/go/undefined`.
 */
export function resolveAffiliateCta(
  value: AffiliateCtaResolvableLink | number | string | null | undefined,
  // No se lee dentro de la función — el caller ya interpola el nombre en
  // `ctaDefaultLabel` (`t('ctaDefault', { tool: name })`). Se mantiene en la
  // firma porque así lo fija el contrato del plan (48-01-PLAN.md Paso 5).
  _toolName: string,
  ctaDefaultLabel: string,
): AffiliateCta {
  if (typeof value !== 'object' || value === null) {
    return { kind: 'pending' }
  }

  // GSC no tiene programa por diseño, nunca lo tendrá — nunca un botón,
  // nunca un chip "pendiente" (ese implica un programa futuro).
  if (value.program === 'google-search-console') {
    return { kind: 'none' }
  }

  if (!value.active || !value.slug) {
    return { kind: 'pending' }
  }

  return {
    kind: 'active',
    href: '/go/' + value.slug,
    label: value.ctaLabel || ctaDefaultLabel,
  }
}
