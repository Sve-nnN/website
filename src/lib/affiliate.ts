// PURE FUNCTION — a propósito, este archivo no importa el paquete de Payload
// ni su config (AFF-02): debe seguir siendo importable desde un Client
// Component en Phase 48. No agregar una llamada a DB a este archivo.

export type Destination = { marketplace: string; url: string }

export function pickDestination(
  destinations: Destination[],
  marketplace: string,
): Destination | undefined {
  return destinations.find((d) => d.marketplace === marketplace) ?? destinations[0]
}
