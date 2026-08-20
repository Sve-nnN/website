/**
 * Tokens del sistema, copiados a mano para el correo.
 *
 * POR QUÉ COPIADOS Y NO IMPORTADOS: los tokens de la web viven como custom
 * properties en `src/app/globals.css`, y en un correo no existe hoja de estilos
 * ni `var()` confiable — Outlook los ignora por completo. Todo estilo de email
 * tiene que viajar inline y con valores literales.
 *
 * Si cambian los tokens de DESIGN.md, este archivo hay que actualizarlo a mano.
 * Es el precio de que el correo se vea como el sitio.
 */
export const email = {
  color: {
    navy: '#12141C',
    navySurface: '#1B1E29',
    paper: '#FAFAF7',
    ember: '#F7581E',
    /** Brasa legible como texto sobre superficie clara (3.15:1 vs 4.6:1). */
    emberText: '#D03D07',
    ink: '#12141C',
    quietInk: '#6F6F6F',
    hairline: '#E5E5E5',
    /** Texto tenue sobre navy. El gris de la web no rinde acá. */
    quietPaper: '#A8ACBB',
  },

  /**
   * Array y Khand son fuentes self-hosted del sitio. En correo NO se usan:
   * `@font-face` falla en Outlook y en la app de Gmail, y una fuente que carga
   * en la mitad de las bandejas produce dos correos distintos. La familia
   * estrecha de sistema es lo más cerca que se llega al carácter condensado de
   * los titulares sin apostar a que descargue algo.
   */
  font: {
    display:
      "'Arial Narrow', 'Helvetica Neue Condensed', 'Helvetica Neue', Helvetica, Arial, sans-serif",
    body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
  },

  radius: { md: '6px', lg: '8px' },
  width: '560px',
} as const
