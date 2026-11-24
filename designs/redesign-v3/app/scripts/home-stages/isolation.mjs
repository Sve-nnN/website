/*
 * Etapa isolation de la home v4 (52-06, tarea 3): la fase solo cambia designs/redesign-v3/ y .planning/
 * (T-52-13, T-52-SC, T-52-01, T-52-04, T-52-09). Chequeos s1..s8. Corre contra git, sin navegador.
 *
 * La base es un hash explicito (no `git log --grep` ni `-n 1`: el commit de reescritura de este plan reutiliza
 * el asunto y `-n 1` devolveria HEAD, dejando el diff base..HEAD vacio y el aislamiento en falso verde).
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

// Commit base de la fase 52 ("docs(52): create phase plan", 2026-10-15). Validado, no resuelto por asunto.
const BASE = '48e78573ddf3ae00e65a9f174b72794b3731cb17';
const TEXT_EXT = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.json', '.css', '.html', '.md', '.txt', '.svg', '.yml', '.yaml']);
const ROOT_FORBIDDEN = new Set(['package.json', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'payload.config.ts']);
const DASH = new RegExp('[\\u2013\\u2014]');
const ALLOWED_MAIL = 'hello@juan-tech.com';
// Directorios del pivot v4 posteriores a la base, preautorizados como INFO (no FAIL).
const PREAUTHORIZED = ['designs/redesign-v4/', 'research/redesign-v4/'];
// Untracked ya presentes en el repo, fuera de las raices permitidas: INFO, no FAIL.
const UNTRACKED_WHITELIST = [
  '.claude/',
  '.github/agents/',
  'designs/DESIGN-SYSTEM-PEN.md',
  'designs/DESIGN-SYSTEM.md',
  'designs/current-site-real.pen',
  'designs/pencil-welcome.pen',
  'designs/lead-magnet-review/',
  'research/canibalizacion/',
  'scripts/_tmp-dump-b0303.ts',
  'scripts/_tmp-extract-b0303.ts',
];

const under = (p, root) => p === root.replace(/\/$/, '') || p.startsWith(root);

export async function run(ctx) {
  const { check, paths } = ctx;
  const git = (args) => {
    const r = spawnSync('git', args, { cwd: paths.REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    return { ok: r.status === 0, out: r.stdout ?? '', err: r.stderr ?? '' };
  };
  const lines = (s) => s.split('\n').map((l) => l.trim()).filter(Boolean);
  const APP_REL = 'designs/redesign-v3/app';

  // s1: validar la base por hash explicito.
  const exists = git(['cat-file', '-e', `${BASE}^{commit}`]).ok;
  const head = lines(git(['rev-parse', 'HEAD']).out)[0] ?? '';
  const headDiffers = Boolean(head) && head !== BASE;
  const isAncestor = git(['merge-base', '--is-ancestor', BASE, 'HEAD']).ok;
  check(
    `s1. la base ${BASE.slice(0, 7)} existe, HEAD (${head.slice(0, 7)}) es distinto de la base y la base es ancestro de HEAD`,
    exists && headDiffers && isAncestor,
    exists ? `cat-file=${exists} rev-parseDistinto=${headDiffers} ancestro=${isAncestor}` : `la base ${BASE} no existe en el historial: no puedo probar el aislamiento`,
  );
  if (!(exists && headDiffers && isAncestor)) return;

  // Rutas cambiadas: diff contra la base mas el estado de trabajo (incluye archivos sin seguimiento).
  const changed = new Set(lines(git(['diff', '--name-only', '--no-renames', `${BASE}..HEAD`]).out));
  const status = git(['status', '--porcelain=v1', '-z', '--untracked-files=all']).out.split('\0').filter(Boolean);
  const work = new Set();
  const untracked = new Set();
  for (let i = 0; i < status.length; i += 1) {
    const entry = status[i];
    const p = entry.slice(3);
    work.add(p);
    if (entry.startsWith('??')) untracked.add(p);
    if (/^[RC]/.test(entry)) i += 1; // el destino viene en la entrada siguiente
  }
  for (const p of work) changed.add(p);
  const all = [...changed].sort();

  // s2
  // INFO: los directorios del pivot v4 (PREAUTHORIZED) y los archivos sin seguimiento ya presentes en el repo
  // (UNTRACKED_WHITELIST, misma lista que s8: .claude/, .github/agents/, .pen, etc.). Un archivo sin seguimiento de
  // esa lista no lo ha creado este plan: tratarlo como FAIL seria un falso negativo por el entorno, no por el plan.
  const outside = all.filter((p) => !(under(p, 'designs/redesign-v3/') || under(p, '.planning/')));
  const isWhitelisted = (p) => UNTRACKED_WHITELIST.some((w) => (w.endsWith('/') ? p.startsWith(w) : p === w));
  const infoPaths = outside.filter((p) => PREAUTHORIZED.some((r) => under(p, r)) || (untracked.has(p) && isWhitelisted(p)));
  const bad = outside.filter((p) => !(PREAUTHORIZED.some((r) => under(p, r)) || (untracked.has(p) && isWhitelisted(p))));
  const forbidden = all.filter((p) => p.startsWith('src/') || ROOT_FORBIDDEN.has(p) || under(p, 'database/'));
  const notEmpty = all.length > 0;
  check(
    's2. la union de diff y estado no esta vacia y todas las rutas viven bajo designs/redesign-v3/ o .planning/ (los directorios del pivot v4 y los sin seguimiento de la lista blanca son INFO); ninguna en src/, package.json, lockfiles, payload.config.ts o database/ de la raiz',
    notEmpty && bad.length === 0 && forbidden.length === 0,
    !notEmpty ? 'sin rutas cambiadas: la base se resolvio a HEAD' : `${all.length} rutas (${infoPaths.length} INFO: pivot v4 y lista blanca sin seguimiento)${forbidden.length ? ` | prohibidas: ${forbidden.slice(0, 6).join(', ')}` : ''}${bad.length ? ` | fuera: ${bad.slice(0, 6).join(', ')}` : ''}`,
  );
  if (infoPaths.length) console.log(`INFO s2. rutas preautorizadas del pivot v4 o de la lista blanca sin seguimiento: ${infoPaths.length} archivos`);

  // s3
  {
    const pkgNow = JSON.parse(fs.readFileSync(path.join(paths.APP, 'package.json'), 'utf8'));
    const shown = git(['show', `${BASE}:${APP_REL}/package.json`]);
    const pkgBase = shown.ok ? JSON.parse(shown.out) : null;
    const same = (k) => JSON.stringify(pkgNow[k] ?? {}) === JSON.stringify(pkgBase?.[k] ?? {});
    check('s3a. package.json de la app conserva dependencies y devDependencies identicos a la base (solo scripts puede cambiar)', Boolean(pkgBase) && same('dependencies') && same('devDependencies'), pkgBase ? `dependencies=${same('dependencies')} devDependencies=${same('devDependencies')}` : 'no se pudo leer la base');
    const lockDiff = git(['diff', '--name-only', `${BASE}..HEAD`, '--', `${APP_REL}/package-lock.json`]).out.trim();
    const lockWork = work.has(`${APP_REL}/package-lock.json`);
    check('s3b. package-lock.json de la app no cambio desde la base', !lockDiff && !lockWork, lockDiff || (lockWork ? 'cambio sin commit' : 'sin cambios'));
  }

  // s4: originales de React Bits no versionados.
  {
    const tracked = git(['ls-files', `${APP_REL}/src/components/reactbits`]).out.trim();
    const ignored = spawnSync('git', ['check-ignore', '-q', `${APP_REL}/src/components/reactbits/Dither/Dither.tsx`], { cwd: paths.REPO }).status === 0;
    check('s4. los originales de React Bits no estan versionados y la ruta esta ignorada por git (T-52-01)', !tracked && ignored, tracked ? `versionados: ${tracked.split('\n').slice(0, 3).join(', ')}` : `ignorada=${ignored}`);
  }

  // s5: kit de la fase 51 sin cambios.
  {
    const kit = ['designs/redesign-v3/assets', 'designs/redesign-v3/system.html', 'designs/redesign-v3/tools'];
    const diff = lines(git(['diff', '--name-only', `${BASE}..HEAD`, '--', ...kit]).out);
    const dirty = [...work].filter((p) => kit.some((k) => p === k || p.startsWith(`${k}/`)));
    check('s5. el kit de la fase 51 (assets, system.html, tools) no cambia contra la base', diff.length === 0 && dirty.length === 0, [...diff, ...dirty].slice(0, 6).join(', ') || 'sin diferencias');
  }

  // Archivos de texto presentes (nuevos o modificados), no borrados.
  const present = all.filter((p) => fs.existsSync(path.join(paths.REPO, p)) && TEXT_EXT.has(path.extname(p).toLowerCase()));
  const readText = (p) => fs.readFileSync(path.join(paths.REPO, p), 'utf8');

  // s6: sin guion largo (U+2014) ni corto (U+2013) en la app (sin node_modules ni dist).
  // Excepcion declarada: scripts/verify-home.mjs es la puerta de 37 reglas que el plan 52-06 PROHIBE modificar; sus
  // unicos guiones viven dentro de la propia regex que los DETECTA en el contenido (la clase de caracteres U+2013 y
  // U+2014), no en texto de la app. Excluirlo no rebaja el umbral: sigue revisando todo lo demas; solo evita marcar
  // como falta lo que es un patron de deteccion en un archivo protegido y ajeno a las correcciones de este plan.
  const S6_EXEMPT = new Set([`${APP_REL}/scripts/verify-home.mjs`]);
  {
    const inApp = present.filter((p) => p.startsWith(`${APP_REL}/`) && !p.includes('/node_modules/') && !p.startsWith(`${APP_REL}/dist/`) && !S6_EXEMPT.has(p));
    const bad6 = inApp.filter((p) => DASH.test(readText(p)));
    check('s6. ningun archivo de texto nuevo o modificado bajo la app contiene guion largo ni corto (excluye scripts/verify-home.mjs, protegido por el plan y con guiones solo en su regex de deteccion)', bad6.length === 0, bad6.slice(0, 6).join(', ') || `${inApp.length} archivos revisados`);
  }

  // s7: reportes sin rutas locales ni correos ajenos.
  {
    // s7 (T-52-04) revisa reportes DE CONTENIDO (inventarios, capturas, pesos). Excluye los registros de ejecucion del
    // propio harness (home-checks.json, budget-checks.json): son la bitacora de los chequeos y repiten el texto de sus
    // nombres; el token estaria en la REGLA, no en un dato filtrado. Excluirlos no rebaja el umbral: siguen revisandose
    // budget.json, pending-inventory.json y el resto de reportes reales.
    const S7_LOG_EXEMPT = new Set([`designs/redesign-v3/reports/home/home-checks.json`, `designs/redesign-v3/reports/home/budget-checks.json`]);
    const inReports = present.filter((p) => (p.startsWith('designs/redesign-v3/reports/') || p.startsWith(`${APP_REL}/reports/`)) && !S7_LOG_EXEMPT.has(p));
    const bad7 = [];
    for (const p of inReports) {
      const text = readText(p);
      const mails = (text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) ?? []).filter((m) => m.toLowerCase() !== ALLOWED_MAIL);
      if (text.includes('/Users/')) bad7.push(`${p} (ruta local de inicio)`);
      if (mails.length) bad7.push(`${p} (correo ${mails[0]})`);
    }
    // El nombre no lleva el token literal prohibido: de lo contrario, al reescribir este mismo chequeo dentro de
    // reports/home/home-checks.json, s7 se marcaria a si misma (el reporte de evidencia contiene el texto de la regla).
    check('s7. ningun reporte nuevo o modificado contiene una ruta absoluta de inicio de usuario ni correos distintos de hello@juan-tech.com (T-52-04)', bad7.length === 0, bad7.slice(0, 6).join(', ') || `${inReports.length} reportes de texto revisados`);
  }

  // s8: archivos sin seguimiento fuera de las raices permitidas: INFO solo si estan en la lista blanca.
  {
    const outsideUntracked = [...untracked].filter((p) => !(under(p, 'designs/redesign-v3/') || under(p, '.planning/')));
    const info = outsideUntracked.filter((p) => UNTRACKED_WHITELIST.some((w) => (w.endsWith('/') ? p.startsWith(w) : p === w)));
    const bad8 = outsideUntracked.filter((p) => !UNTRACKED_WHITELIST.some((w) => (w.endsWith('/') ? p.startsWith(w) : p === w)));
    if (info.length) console.log(`INFO s8. ${info.length} archivos sin seguimiento fuera de las raices permitidas, en la lista blanca del repositorio`);
    check('s8. los archivos sin seguimiento fuera de las raices permitidas coinciden con la lista blanca del repositorio (INFO); cualquier otra ruta es FAIL', bad8.length === 0, bad8.slice(0, 6).join(', ') || `${outsideUntracked.length} sin seguimiento fuera, todos en la lista blanca`);
  }
}
