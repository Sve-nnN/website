/**
 * RETIRADO el 2026-11-24. No ejecutar ni recuperar desde el historial.
 *
 * Este script cargaba cifras interanuales falsas: la retención de 16 meses de Search Console
 * recortaba el periodo anterior a unos 135 días frente a 364. Los casos 21 a 24 se corrigieron
 * con scripts/db/44-casos-gsc-corregidos.ts y scripts/db/45-home-casos-copy.ts.
 */
console.error('Script retirado: cargaba cifras falsas. Usa scripts/db/44 y 45.')
process.exit(1)

export {}
