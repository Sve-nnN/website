// Aviso de servidor para un bloque de `pages` que no tiene vista MUI (plan 57-07, D-06).
//
// ServiceDetailPage y LocalLandingPage ya no caen en el registro viejo de bloques
// (RenderBlocks con Tailwind): un bloque sin vista propia no se pinta y deja este
// aviso en el log del servidor con el tipo de bloque, para que Juan sepa qué falta.
// Un aviso por plantilla y tipo de bloque en la vida del proceso, así el log no se llena.
const seen = new Set<string>()

export function warnUnrenderedBlock(view: string, blockType: string | null | undefined): void {
  const key = `${view}:${blockType ?? '?'}`
  if (seen.has(key)) return
  seen.add(key)
  console.warn(`[${view}] bloque sin vista MUI, no se renderiza: blockType="${blockType ?? '?'}"`)
}
