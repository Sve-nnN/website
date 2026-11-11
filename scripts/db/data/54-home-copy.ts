/**
 * El copy del global `home-page` vive ahora en 56-home-copy.ts (plan 56-09): se arma desde las
 * decisiones de Juan (D-22) y el lote 1 de CTAs. Este archivo lo reexporta para que los
 * verificadores y scripts de la 54 y la 55 sigan importando `HOME_COPY_ES` desde aqui.
 *
 * Solo ES aqui. El EN es HOME_COPY_EN en 56-home-copy.ts.
 *
 * Lo que NO se siembra a proposito (sin cambios desde la 54):
 *   - `sites.note`: la vista arma esa nota desde messages con la fecha real de captura.
 *   - Ninguna ranura de testimonio del sandbox. Solo se siembra el titulo de la seccion.
 */
export { HOME_COPY_ES } from './56-home-copy'

/**
 * Logos del sandbox (designs/design-system-mui/src/data/logos.ts): archivo,
 * texto alternativo y si es un logo claro que necesita chip oscuro. El sandbox
 * no está bajo git, así que la lista se copia aquí.
 */
export const SANDBOX_LOGOS: readonly { file: string; alt: string; onDark: boolean }[] = [
  { file: 'aprendoclub.webp', alt: 'Aprendoclub', onDark: false },
  { file: 'apturio.webp', alt: 'Apturio', onDark: false },
  { file: 'childrenchic.webp', alt: 'Children Chic', onDark: false },
  { file: 'credito-uss.webp', alt: 'Crédito USS', onDark: false },
  { file: 'cresory.webp', alt: 'Cresory', onDark: false },
  { file: 'delta-cloudz.webp', alt: 'Delta Cloudz', onDark: false },
  { file: 'dr-manuel-a-vargas-hidalgo.webp', alt: 'Dr. Manuel A. Vargas Hidalgo', onDark: false },
  { file: 'dslx.webp', alt: 'DSLX', onDark: false },
  { file: 'estylopia.webp', alt: 'Estylopia', onDark: false },
  { file: 'felipe-vergara.webp', alt: 'Felipe Vergara', onDark: false },
  { file: 'florida-health-care-academy.webp', alt: 'Florida Health Care Academy', onDark: false },
  { file: 'florida-top-roofs.webp', alt: 'Florida Top Roofs', onDark: false },
  { file: 'holafly.webp', alt: 'Holafly', onDark: false },
  { file: 'luxembourg-philharmonie.webp', alt: 'Philharmonie Luxembourg', onDark: false },
  { file: 'money-com.webp', alt: 'Money.com', onDark: false },
  { file: 'pro-torque-diesel.webp', alt: 'Pro Torque Diesel', onDark: false },
  { file: 'puntada-con-amor.webp', alt: 'Puntada con Amor', onDark: false },
  { file: 'souma-hotel.webp', alt: 'Souma Hotel', onDark: false },
  { file: 'storybook-app.webp', alt: 'Storybook App', onDark: false },
  { file: 'the-sosa-team.webp', alt: 'The Sosa Team', onDark: false },
  { file: 'thesmokybox.webp', alt: 'The Smoky Box', onDark: false },
  { file: 'thesmokyrolling.webp', alt: 'The Smoky Rolling', onDark: false },
  { file: 'tumundosalud.webp', alt: 'Tu Mundo Salud', onDark: false },
  { file: 'tursi-digital-nomads.webp', alt: 'Tursi Digital Nomads', onDark: false },
  { file: 'vallas-venezuela.webp', alt: 'Vallas Venezuela', onDark: false },
  { file: 'winaypaq.webp', alt: 'Winaypaq', onDark: true },
]

/** Archivos del sandbox con `onDark` verdadero. */
export const ON_DARK_FILES: string[] = SANDBOX_LOGOS.filter((l) => l.onDark).map((l) => l.file)
