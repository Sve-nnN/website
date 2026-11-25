/**
 * La cifra de asistentes de un evento es un mínimo cuando su propia descripción dice
 * "más de N" (o "more than N"). Así la etiqueta no contradice al texto sin añadir un campo.
 */
export function isMinimumAttendance(count: number, description: string | null | undefined): boolean {
  return new RegExp(`(?:m[aá]s de|more than)\\s+${count}\\b`, 'i').test(description ?? '')
}
