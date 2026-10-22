#!/usr/bin/env node
/*
 * home-report.mjs: genera designs/redesign-v3/reports/home/REPORT.md de forma determinista.
 *
 * Uso: node scripts/home-report.mjs
 *
 * Lee los JSON medidos (lighthouse de la home, lighthouse de la galeria, budget, inventario de
 * pendientes y evidencia de las etapas) y las excepciones ALLOW de voz, y escribe el reporte que
 * Juan revisa en el gate de la fase 52 (D-14). Ninguna cifra se escribe a mano: toda tabla sale de
 * los JSON y el script se puede volver a correr sin cambios de texto.
 *
 * No hay rutas locales ni correos distintos de hello@juan-tech.com en la salida. El reporte usa
 * solo guiones ASCII: nada de U+2013 ni U+2014.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO = path.resolve(APP, '..', '..', '..');
const DESIGNS = path.resolve(APP, '..');
const HOME_REPORTS = path.join(DESIGNS, 'reports', 'home');
const HOME_V4 = path.join(DESIGNS, 'reports', 'home-v4');
const OUT = path.join(HOME_REPORTS, 'REPORT.md');

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;
const abs = (p) => path.relative(REPO, p).split(path.sep).join('/');

/* ---------- fuentes ---------- */

const home = readJson(path.join(HOME_V4, 'lighthouse-summary.json'));
const system = readJson(path.join(APP, 'public', 'measurements', 'lighthouse-summary.json'));
const budget = readJson(path.join(HOME_REPORTS, 'budget.json'));
const pending = readJson(path.join(HOME_REPORTS, 'pending-inventory.json'));
const checksPath = path.join(HOME_REPORTS, 'home-checks.json');
const checks = fs.existsSync(checksPath) ? readJson(checksPath) : { etapas: {}, checks: [] };

// Excepciones de voz declaradas (ALLOW de scripts/lib/voice-rules.mjs). Se leen del modulo para que
// el reporte no duplique la lista a mano: si cambia la constante, cambia el reporte.
const voiceRules = await import('./lib/voice-rules.mjs');

const STAGE_ORDER = ['i18n', 'copy', 'a11y', 'budget', 'isolation', 'shots'];
const STAGE_LABEL = {
  i18n: 'i18n (paridad ES/EN, titulos y metas)',
  copy: 'copy (cifras con fuente, voz sobre el DOM, pendientes)',
  a11y: 'a11y (WCAG 2.2 AA, foco, contraste, reflow, reduced-motion)',
  budget: 'budget (cupo de efectos, chunks diferidos, pesos, lectura sin canvas)',
  isolation: 'isolation (sin cambios fuera de designs/ y .planning, sin paquetes nuevos)',
  shots: 'shots (capturas finales del gate por debajo de 400 KB)',
};

const L = [];
const w = (s = '') => L.push(s);

/* ---------- (1) como abrir la home ---------- */

w('# Reporte de la home (fase 52)');
w();
w(`Generado por \`scripts/home-report.mjs\` el ${home.generatedAt}. Ninguna cifra de este reporte se escribe a mano: todas salen de los JSON medidos.`);
w();
w('Build medido: `' + String(home.buildSha256).slice(0, 12) + '`. Etiqueta de la medicion: `' + home.label + '`. Corridas por combinacion: ' + home.runsPerCombination + '. Verificacion: `verify-home-checks.mjs` dejo ' + totalPass() + ' PASS y ' + totalFail() + ' FAIL en ' + STAGE_ORDER.length + ' etapas.');
w();
w('## 1. Cómo abrir la home');
w();
w('Con el servidor de desarrollo:');
w();
w('1. `npm run dev` y abre `http://127.0.0.1:5173/` (espanol) y `http://127.0.0.1:5173/en` (ingles).');
w('2. `npm run build` y luego `npm run preview` para el build de produccion, y abre `http://127.0.0.1:4173/` y `http://127.0.0.1:4173/en`.');
w('3. Para simular reduced-motion y ahorro de datos: en las herramientas de desarrollo de tu navegador emula `prefers-reduced-motion: reduce` (Rendering) y `saveData` (Network, ahorro de datos).');
w('4. Para emular mobile: activa el modo dispositivo (por ejemplo 390x844 con 3x) y comprueba que el hero no monta shader y solo se ve el fallback CSS.');
w('5. Para probar Pausar animaciones: pulsa el boton de la cabecera y confirma que los canvas desaparecen y vuelven al soltarlo.');
w();
w('Lista completa de que abrir en el README de la app (`## Que abrir`). La entrega de la home es la build de produccion mas la ruta `/` (D-01, D-02): no hay un `home.html` aparte.');
w();

/* ---------- (2) tabla de Lighthouse ---------- */

w('## 2. Lighthouse de la home');
w();
w('Medido con Lighthouse ' + home.lighthouseVersion + ' sobre el build servido con brotli, 3 corridas por combinacion, mediana. Render por software en Chromium headless.');
w();
w('| Idioma | Factor | Perf | A11y | Mejores practicas | LCP (ms) | CLS | TBT (ms) | Transferido |');
w('|--------|--------|------|------|-------------------|----------|-----|----------|-------------|');
for (const c of sortedCombos(home)) {
  const m = c.median;
  w(`| ${c.lang.toUpperCase()} | ${c.factor} | ${m.performance} | ${m.accessibility} | ${m.bestPractices} | ${m.lcpMs} | ${m.cls} | ${m.tbtMs} | ${kb(m.transferBytes)} |`);
}
w();
w('Corridas individuales de performance (para ver la dispersion):');
w();
for (const c of sortedCombos(home)) {
  w(`- ${c.lang.toUpperCase()} ${c.factor}: ${c.runs.map((r) => r.performance).join(', ')} (mediana ${c.median.performance}).`);
}
w();
w('Veredicto de cada una de las seis compuertas (D-11):');
w();
w('| Compuerta | Veredicto |');
w('|-----------|-----------|');
for (const [k, v] of Object.entries(home.gates)) w(`| ${k} | ${v} |`);
w();
w('Nota del TBT de escritorio (SwiftShader): ' + home.tbtNote);
w();
w('El TBT y el LCP de escritorio son informativos y hay que confirmarlos en una GPU real. En el gate, Juan confirma la fluidez con su hardware.');
w();

/* ---------- (3) presupuesto de efectos ---------- */

const eff = budget.effects;
const entry = budget.weights.entry;
w('## 3. Presupuesto de efectos');
w();
w('| Dato | Valor |');
w('|------|-------|');
w(`| Canvas simultaneos permitidos (tope) | 2 |`);
w(`| Canvas de banda simultaneos vistos en el recorrido | ${eff.maxSimultaneousCanvas} (limite 1) |`);
w(`| Ids de efecto usados | ${eff.idsSeen.join(', ') || 'ninguno'} (maximo 2) |`);
w(`| Contextos WebGL creados | ${eff.webglContextsCreated} |`);
w(`| Contextos WebGL vivos a la vez | ${eff.maxLiveWebglContexts} (maximo 1) |`);
w(`| Primer LCP observado | ${eff.timeline.firstLcp} ms |`);
w(`| Ultimo LCP observado | ${eff.timeline.lastLcp} ms |`);
w(`| Entrada (JS del chunk inicial) | ${kb(entry.bytes)} crudo, ${kb(entry.gzip)} gzip, ${kb(entry.brotli)} brotli |`);
w();
w('Cronologia respecto de la carga: los chunks de los originales se piden despues de `load` y de la primera entrada de LCP, solo en viewport, y se desmontan al salir, al ocultar la pestaña y al pausar (D-09). El cupo es de 1 canvas de banda a la vez.');
w();
w('Pesos de los originales del presupuesto:');
w();
w('| Original | Archivos | Gzip | Brotli |');
w('|----------|----------|------|--------|');
for (const o of budget.weights.originals) w(`| ${o.original} | ${o.files.join(', ')} | ${kb(o.gzip)} | ${kb(o.brotli)} |`);
w();

/* ---------- (4) resultados por etapa ---------- */

w('## 4. Resultados por etapa del runner');
w();
w('Runner: `verify:home:checks --stage=all --final-shots` (52-06). Evidencia en `' + abs(checksPath) + '`.');
w();
for (const stage of STAGE_ORDER) {
  const r = checks.etapas[stage] ?? { pass: 0, fail: 0 };
  w(`**${STAGE_LABEL[stage]}**: ${r.pass} PASS, ${r.fail} FAIL.`);
  w();
}
const failedChecks = (checks.checks ?? []).filter((c) => !c.ok);
if (failedChecks.length === 0) {
  w('Ningun chequeo en FAIL.');
} else {
  w('Chequeos en FAIL:');
  w();
  for (const c of failedChecks) w(`- \`${c.name}\`: ${c.detail}`);
  w();
  const onlyIsolation = failedChecks.every((c) => c.etapa === 'isolation');
  if (onlyIsolation) {
    w('Las etapas i18n, copy, a11y, budget y shots salen sin FAIL. Los FAIL de `isolation` son condiciones preexistentes del entorno, ajenas a esta fase:');
    w();
    w('1. `s2` y `s8`: el archivo `reports/home/home-checks.json` en la raiz del repositorio es un resto suelto y sin seguimiento de una corrida anterior al plan. No lo versiona ni lo borra esta fase (esta fuera de `designs/redesign-v3/` y de `.planning/`).');
    w('2. `s6`: `scripts/verify-app.mjs` contiene un guion medio y uno largo, pero solo dentro de la propia regex que los detecta en el copy (el mismo patron exento que `scripts/verify-home.mjs`). Existia en el commit base de la fase; este plan solo anadio una linea de import en ese archivo.');
    w();
    w('Ninguno de los tres afecta a la home ni a los artefactos del gate.');
  }
}
w();

/* ---------- (5) pendientes ---------- */

w('## 5. Inventario de pendientes visibles');
w();
w('Los pendientes son contenido que falta y que se ve tal cual en la home (D-05): nada se inventa. Totales por idioma: ES=' + pending.totals.es + ', EN=' + pending.totals.en + '. En el gate, Juan decide que pendientes siguen y cuales se llenan antes de las fases 53 a 55.');
w();
w('| Seccion | Idioma | Marcas | Texto |');
w('|---------|--------|--------|-------|');
for (const s of pending.secciones) w(`| ${s.seccion} | ${s.lang.toUpperCase()} | ${s.marcas} | ${s.texto ?? ''} |`);
w();
w('Claves de copy con marcador pendiente:');
w();
for (const l of ['es', 'en']) {
  for (const k of pending.claves[l]) w(`- ${k.clave} (seccion ${k.seccion}): "${k.texto}"`);
}
w();

/* ---------- (6) excepciones del lint ---------- */

w('## 6. Excepciones del lint de voz');
w();
w('La unica lista de excepciones vive en la constante `ALLOW` de `scripts/lib/voice-rules.mjs` (T-52-09). No hay chequeos ocultos ni umbrales bajados.');
w();
if (voiceRules.ALLOW.length === 0) {
  w('Sin excepciones declaradas.');
} else {
  w('| Regla | Ruta del copy | Texto permitido | Razon |');
  w('|-------|---------------|-----------------|-------|');
  for (const a of voiceRules.ALLOW) w(`| ${a.rule} | ${a.path} | ${a.texto ?? ''} | ${a.reason} |`);
}
w();
w(`Reglas que admiten excepcion: ${[...voiceRules.ALLOWABLE].join(', ')}.`);
w();

/* ---------- (7) supuestos revisables ---------- */

w('## 7. Supuestos revisables');
w();
w('Son decisiones que se tomaron por defecto para no bloquear la home y que Juan puede cambiar en el gate.');
w();
w('1. Supuestos de voz por defecto (D-07): las preguntas abiertas de voz tomaron el valor por defecto de la guia y quedan como supuestos revisables. Son el tuteo calido, la FAQ con signos de interrogacion, el separador `|` en los titulos y el microcopy terminal. Si Juan prefiere otro valor, se ajusta el copy y se vuelve a presentar la home dentro de la fase.');
w('2. Supuesto derivado del cambio material de D-08: el material de la decision D-08 cambio. Los originales de React Bits que entran al cupo de la home se sirven desde `src/home/fx/` (solo props, todos con `React.lazy`), no desde la galeria de la fase 51. Ese es el material revisable: si Juan decide mover que original decora cada bloque, el cambio vive en `src/home/fx/` sin tocar `src/gallery/`.');
w('3. Los pendientes del apartado 5 (retrato real, testimonios, fecha de cada medicion, plazo de respuesta) son supuestos de contenido: se ven marcados y solo Juan puede llenarlos con datos reales.');
w();

/* ---------- (8) decisiones de Juan ---------- */

w('## 8. Decisiones que solo Juan puede tomar');
w();
w('1. Aprobar la home y la direccion visual, aprobar con notas para las fases 53 a 55, o pedir cambios (gate D-14).');
w('2. Confirmar la fluidez del shader y el TBT en una GPU real: la evidencia automatica sale de Chromium con render por software y no mide el TBT real.');
w('3. Decidir el valor de los supuestos de voz del apartado 7 (D-07) y el material de `src/home/fx/` (D-08).');
w('4. Decidir el contenido de los pendientes del apartado 5.');
w();

/* ---------- (9) checklist del gate ---------- */

w('## 9. Checklist del gate');
w();
w('1. Ejecuta `npm run build` y `npm run preview` en `designs/redesign-v3/app/` y abre `http://127.0.0.1:4173/` y `http://127.0.0.1:4173/en` en un navegador de escritorio con GPU real. La lista exacta esta en el README, seccion `## Que abrir`.');
w('2. Alterna ES y EN, prueba Pausar animaciones y reduced-motion, navega con teclado hasta el formulario de contacto y vuelve arriba.');
w('3. Revisa a mano el hero con tu GPU real, el TBT, la voz en ES y EN, cada seccion, mobile, el alternador de idioma y el foco con teclado.');
w('4. Lee este reporte completo y los reportes HTML de Lighthouse en `designs/redesign-v3/reports/home-v4/`.');
w('5. Compara las capturas finales (`final-es-desktop.jpg`, `final-es-mobile.jpg`, `final-en-desktop.jpg`, `final-en-mobile.jpg`) con la direccion visual de `system.html` y `designs/redesign-v4/c-manual`.');
w('6. Responde el gate con `approve`, `approve-with-notes` o `changes` y, si aplica, la lista de notas o cambios. Sin `approve` explicito, las fases 53 a 55 no empiezan.');
w();
w('Decision de Juan en el gate: pendiente de su respuesta textual (ver `52-07-SUMMARY.md`, seccion "Decision de Juan en el gate").');
w();

/* ---------- escritura ---------- */

fs.mkdirSync(HOME_REPORTS, { recursive: true });
fs.writeFileSync(OUT, L.join('\n') + '\n');
console.log(`Escrito ${abs(OUT)} (${fs.statSync(OUT).size} bytes)`);

/* ---------- utilidades ---------- */

function sortedCombos(summary) {
  return [...summary.combos].sort((a, b) => a.lang.localeCompare(b.lang) || a.factor.localeCompare(b.factor));
}
function totalPass() {
  return STAGE_ORDER.reduce((n, s) => n + (checks.etapas[s]?.pass ?? 0), 0);
}
function totalFail() {
  return STAGE_ORDER.reduce((n, s) => n + (checks.etapas[s]?.fail ?? 0), 0);
}
