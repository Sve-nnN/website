// Lee tokens CSS de la paleta activa y los devuelve como hexadecimal para los originales de React Bits.
// Se llama al montar, nunca al cargar el modulo, para que el color siga a la paleta elegida.

function toHex(computed: string): string {
  const rgb = computed.match(/rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/);
  if (rgb) return `#${[rgb[1], rgb[2], rgb[3]].map((n) => Math.round(Number(n)).toString(16).padStart(2, '0')).join('')}`;
  // color(srgb r g b) con componentes de 0 a 1 (color-mix resuelto)
  const srgb = computed.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  if (srgb) return `#${[srgb[1], srgb[2], srgb[3]].map((n) => Math.round(Number(n) * 255).toString(16).padStart(2, '0')).join('')}`;
  return computed;
}

/** Resuelve un token (por ejemplo --accent) al color calculado en este momento. */
export function token(name: string): string {
  const probe = document.createElement('i');
  probe.style.cssText = `position:absolute;visibility:hidden;color:var(${name})`;
  document.body.appendChild(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return toHex(value);
}
