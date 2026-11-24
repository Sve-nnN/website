// Módulo puro (sin imports de payload): lo importan los globals de la fase 54
// para sus selects y los componentes de UI (IconTile) para resolver el icono.
// Las listas son cerradas a propósito: un icono fuera de la lista no existe
// en el sistema de diseño.

export const SERVICE_ICON_NAMES = [
  'search',
  'code',
  'server',
  'gauge',
  'sparkles',
  'list',
  'wrench',
  'chart',
] as const

export const CONTACT_ICON_NAMES = ['clock', 'map-pin', 'globe'] as const

export const ABOUT_CHIP_ICON_NAMES = ['map-pin', 'globe'] as const

export type ServiceIconName = (typeof SERVICE_ICON_NAMES)[number]
export type ContactIconName = (typeof CONTACT_ICON_NAMES)[number]
export type AboutChipIconName = (typeof ABOUT_CHIP_ICON_NAMES)[number]

export function toSelectOptions(names: readonly string[]): { label: string; value: string }[] {
  return names.map((name) => ({ label: name, value: name }))
}
