/**
 * Corrige errores tecnicos y afirmaciones sin fuente en cinco posts, en es y en en
 * (decision de Juan, 2026-11-25: "Corregir todo"):
 *   - estrategia-de-contenidos: los casos de Tableau, Agentforce y Slack pasan a escenarios
 *     hipoteticos, como ya estaba el ingles.
 *   - seo-off-page-guia: fuera el peso "superior al 50%", fuera 2024 como futuro y correccion
 *     de la desautorizacion de enlaces (support.google.com/webmasters/answer/2648487).
 *   - complejidad-algoritmica: O, Omega y Theta son cotas, no el peor, mejor y promedio.
 *   - hidratacion-web: Next.js y Svelte hidratan, Qwik es el ejemplo de resumabilidad, y salen
 *     las cifras de 10 y 2 segundos sin fuente.
 *   - topic-clusters-seo: "varios sitios" pasa a ejemplo hipotetico.
 *
 * Solo cambian nodos de texto ya existentes: no se anade ni se borra ningun nodo.
 * Datos: data/51-posts-ops.json (ruta, texto anterior y texto nuevo).
 * Uso: ver data/51-content-lib.ts. --only <slug,slug>. Dry-run por defecto.
 */
import { readFileSync } from 'node:fs'

import { fail, runPlans, type DocPlan } from './data/51-content-lib'

type Entry = Pick<DocPlan, 'key' | 'ops'> & { id: number; slug: string }

const entries = JSON.parse(readFileSync(new URL('./data/51-posts-ops.json', import.meta.url), 'utf8')) as Entry[]

runPlans(
  'correcciones en posts',
  entries.map((e) => ({ ...e, collection: 'posts' })),
).catch(fail)
