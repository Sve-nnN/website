#!/usr/bin/env node
/*
 * check-copy.mjs: lint del copy de la home contra la guia de voz (research/voice-and-tone-juan.md) y D-05.
 *
 * Uso:
 *   node scripts/check-copy.mjs [--selftest] [--json] [--dir=<carpeta>] [archivos...]
 *
 * Sin archivos valida todos los src/home/copy/*.json (ruta relativa a este script, no al cwd).
 * Reglas V01 a V16 en scripts/lib/voice-rules.mjs; cada mensaje cita la seccion de la guia.
 * Salida: una linea PASS, FAIL o WARN por archivo y regla (`FAIL archivo V07 | ruta | mensaje`) y el conteo final.
 * Codigos de salida: 0 sin FAIL (los avisos no cuentan), 1 con algun FAIL, 2 por uso incorrecto o archivo ilegible.
 * Sin dependencias.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { RULES, ALLOWABLE, lintDoc } from './lib/voice-rules.mjs';
import { isAllowedHref } from '../src/home/links.ts';

const SELF = fileURLToPath(import.meta.url);
const HERE = path.dirname(SELF);
const DEFAULT_DIR = path.resolve(HERE, '../src/home/copy');
const FIXTURES = path.join(HERE, 'fixtures');

const USAGE = 'uso: node scripts/check-copy.mjs [--selftest] [--json] [--dir=<carpeta>] [archivos...]';

/* ---------- argumentos ---------- */

function parseArgs(argv) {
  const opts = { selftest: false, json: false, dir: DEFAULT_DIR, files: [], error: null };
  for (const a of argv) {
    if (a === '--selftest') opts.selftest = true;
    else if (a === '--json') opts.json = true;
    else if (a.startsWith('--dir=')) opts.dir = path.resolve(a.slice('--dir='.length));
    else if (a.startsWith('-')) opts.error = `opcion desconocida: ${a}`;
    else opts.files.push(path.resolve(a));
  }
  return opts;
}

function die(code, msg) {
  console.error(msg);
  process.exit(code);
}

/* ---------- lectura ---------- */

function readDoc(file) {
  let raw;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch (err) {
    return { error: `no se pudo leer ${file}: ${err.code ?? err.message}` };
  }
  try {
    return { doc: JSON.parse(raw), raw };
  } catch (err) {
    return { error: `JSON invalido en ${file}: ${err.message}` };
  }
}

function listCopyFiles(dir) {
  let names;
  try {
    names = fs.readdirSync(dir);
  } catch (err) {
    // Una carpeta que aun no existe (checkout nuevo, antes de 52-03) cuenta como vacia.
    return err.code === 'ENOENT' ? [] : null;
  }
  return names.filter((n) => n.endsWith('.json')).sort().map((n) => path.join(dir, n));
}

/* ---------- ejecucion normal ---------- */

function lintFiles(files) {
  const results = [];
  for (const file of files) {
    const read = readDoc(file);
    if (read.error) return { error: read.error };
    results.push({ file, ...lintDoc(read.doc) });
  }
  return { results };
}

function printText(results) {
  let fail = 0;
  let warn = 0;
  for (const r of results) {
    const name = path.relative(process.cwd(), r.file) || r.file;
    for (const e of r.schemaErrors) {
      console.log(`FAIL ${name} SCHEMA | - | ${e}`);
      fail += 1;
    }
    for (const rule of RULES) {
      const hits = r.findings.filter((f) => f.id === rule.id);
      if (hits.length === 0) {
        console.log(`PASS ${name} ${rule.id}`);
        continue;
      }
      for (const h of hits) {
        console.log(`${h.level} ${name} ${rule.id} | ${h.path} | ${h.message}`);
        if (h.level === 'FAIL') fail += 1;
        else warn += 1;
      }
    }
    for (const a of r.allowed) console.log(`INFO ${name} ALLOW ${a.id} | ${a.path} | ${a.reason}`);
  }
  console.log(`RESULT archivos=${results.length} fail=${fail} warn=${warn}`);
  return { fail, warn };
}

function runNormal(opts) {
  let files = opts.files;
  if (files.length === 0) {
    const found = listCopyFiles(opts.dir);
    if (found === null) die(2, `no se pudo leer la carpeta ${opts.dir}`);
    files = found;
    if (files.length === 0) {
      if (opts.json) console.log(JSON.stringify({ files: [], fail: 0, warn: 0, info: 'carpeta de copy vacia' }));
      else console.log(`INFO carpeta de copy vacia (${opts.dir}): nada que validar`);
      process.exit(0);
    }
  }
  const out = lintFiles(files);
  if (out.error) die(2, out.error);

  if (opts.json) {
    const fail = out.results.reduce((n, r) => n + r.schemaErrors.length + r.findings.filter((f) => f.level === 'FAIL').length, 0);
    const warn = out.results.reduce((n, r) => n + r.findings.filter((f) => f.level === 'WARN').length, 0);
    console.log(JSON.stringify({ files: out.results, fail, warn }, null, 2));
    process.exit(fail > 0 ? 1 : 0);
  }
  const { fail } = printText(out.results);
  process.exit(fail > 0 ? 1 : 0);
}

/* ---------- selftest ---------- */

let passes = 0;
let failures = 0;
function check(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} selftest ${name}${detail ? ` | ${detail}` : ''}`);
  if (ok) passes += 1;
  else failures += 1;
  return ok;
}

const idsOf = (doc) => [...new Set(lintDoc(doc).findings.map((f) => f.id))].sort();
const sameSet = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const pair = (es, en, extra = {}) => ({ es, en, ...extra });
const DASH_LONG = String.fromCharCode(0x2014);

function runFixtures() {
  const bad = readDoc(path.join(FIXTURES, 'copy-bad.json'));
  const good = readDoc(path.join(FIXTURES, 'copy-good.json'));
  if (bad.error || good.error) die(2, bad.error ?? good.error);

  const expected = [...bad.doc._expect].sort();
  const got = idsOf(bad.doc);
  const missing = expected.filter((x) => !got.includes(x));
  const extra = got.filter((x) => !expected.includes(x));
  check('fixture malo dispara exactamente _expect', sameSet(expected, got), `esperado=${expected.join(',')} obtenido=${got.join(',')}${missing.length ? ` faltan=${missing.join(',')}` : ''}${extra.length ? ` sobran=${extra.join(',')}` : ''}`);

  const badLint = lintDoc(bad.doc);
  for (const rule of RULES) {
    const n = badLint.findings.filter((f) => f.id === rule.id).length;
    const levelOk = badLint.findings.filter((f) => f.id === rule.id).every((f) => f.level === rule.level);
    check(`${rule.id} dispara en el fixture malo como ${rule.level}`, n > 0 && levelOk, `${n} hallazgos`);
    check(`${rule.id} cita la guia en el mensaje`, badLint.findings.filter((f) => f.id === rule.id).every((f) => /\[(guía|D-0|amenaza)/.test(f.message)));
  }
  check('fixture malo: el esquema es valido (sin errores de esquema)', badLint.schemaErrors.length === 0, badLint.schemaErrors.join('; '));

  const goodLint = lintDoc(good.doc);
  check('fixture bueno no dispara ninguna regla', goodLint.findings.length === 0 && goodLint.schemaErrors.length === 0, goodLint.findings.map((f) => `${f.id}@${f.path}`).join(' '));
  check('fixtures sin guiones largos ni cortos reales', !/[\u2013\u2014]/.test(bad.raw + good.raw));
}

function runInline() {
  // Falsos positivos probables: el conector propio "asi sea X, Y o Z", A11Y y hashes de commit.
  check('"asi sea X, Y o Z" no marca V04 ni V05', sameSet(idsOf(pair({ t: { text: 'Así sea el servidor, la plantilla o el contenido, lo reviso.' } }, { t: { text: 'Whether it is the server, the template or the content, I check it.' } })), []));
  check('"ya sea" si marca V05', idsOf(pair({ t: { text: 'Ya sea el servidor o la plantilla.' } }, { t: { text: 'The server or the template.' } })).includes('V05'));
  check('A11Y y hash de commit no cuentan como cifra', sameSet(idsOf(pair({ t: { text: 'Cumplo A11Y y reviso el commit 23646a1 y 6849e95.' } }, { t: { text: 'I meet A11Y and check commit 23646a1 and 6849e95.' } })), []));
  check('"is speed" no marca V04 en ingles', sameSet(idsOf(pair({ t: { text: 'La velocidad.' } }, { t: { text: 'The result is speed.' } })), []));

  // Cifras: separadores de miles y fuente obligatoria.
  const num = (text, numbers) => pair({ t: { text } }, { t: { text } }, numbers ? { _numbers: numbers } : {});
  check('cifra agrupada "86 000" se normaliza a 86000', sameSet(idsOf(num('Llego a 86 000 clics', [{ value: '86000', source: 'Search Console' }])), []));
  check('cifra sin entrada en _numbers marca V07 aunque este en ambos idiomas', idsOf(num('Llego a 86000 clics')).includes('V07'));
  check('_numbers con source vacio no habilita la cifra y marca esquema', (() => {
    const d = num('Llego a 86000 clics', [{ value: '86000', source: '  ' }]);
    return idsOf(d).includes('V07') && lintDoc(d).schemaErrors.length === 1;
  })());
  check('_numbers con value no numerico marca esquema', lintDoc(num('x', [{ value: '86,000', source: 'fuente' }])).schemaErrors.length === 1);

  // _allow: solo V04, V13, V15 y V16, con reason.
  const passive = (allow) => pair({ t: { text: 'El rastreo es auditado cada semana' } }, { t: { text: 'I audit the crawl every week' } }, allow ? { _allow: allow } : {});
  check('V04 sin _allow dispara', idsOf(passive()).includes('V04'));
  const allowed = lintDoc(passive([{ rule: 'V04', path: 'es.t.text', reason: 'cita textual del cliente' }]));
  check('V04 con _allow valido se acepta y queda registrado', !allowed.findings.some((f) => f.id === 'V04') && allowed.allowed.length === 1 && allowed.allowed[0].reason !== '');
  check('V04 con _allow sin reason sigue disparando', idsOf(passive([{ rule: 'V04', path: 'es.t.text', reason: '' }])).includes('V04'));
  const voseo = pair({ t: { text: 'Contanos qué necesitás' } }, { t: { text: 'Tell me what you need' } }, { _allow: [{ rule: 'V03', path: 'es.t.text', reason: 'intento de excepcion' }] });
  check('V03 ignora _allow y lo reporta en el esquema', idsOf(voseo).includes('V03') && lintDoc(voseo).schemaErrors.length === 1);
  const title = pair({ t: { h2: 'Cómo puedo ayudarte' } }, { t: { h2: 'How I Can Help' } }, { _allow: [{ rule: 'V13', path: 'en.t.h2', reason: 'titulo de marca' }] });
  check('V13 sin _allow dispara y con _allow se acepta', idsOf({ ...title, _allow: [] }).includes('V13') && !idsOf(title).includes('V13'));
  check('ALLOWABLE contiene exactamente V04, V13, V15 y V16', sameSet([...ALLOWABLE].sort(), ['V04', 'V13', 'V15', 'V16']));

  // Citas de terceros: exentas de V03 a V06, no de V01, V07 ni V11.
  const quote = (es, en) => pair({ t: { quote: es } }, { t: { quote: en } });
  check('quote exenta de V03, V05 y V06', sameSet(idsOf(quote('Contanos, el mejor equipo robusto de nuestro barrio', 'Our robust best team, we say')), []));
  check('quote no exenta de V01', idsOf(quote(`Fue ${DASH_LONG} lo mejor`, 'It was good')).includes('V01'));
  check('quote no exenta de V07', idsOf(quote('Fueron 77 clientes', 'There were 77 clients')).includes('V07'));
  check('quote no exenta de V11', idsOf(quote('Excelente!', 'Excellent')).includes('V11'));

  // Pendientes.
  check('V08 detecta distinta cantidad de pendientes entre idiomas', idsOf(pair({ t: { text: 'A [PENDIENTE: x]' } }, { t: { text: 'A' } })).includes('V08'));
  check('pendientes bien formados e iguales no disparan nada', sameSet(idsOf(pair({ t: { text: 'Foto [PENDIENTE: foto del retrato]' } }, { t: { text: 'Photo [PENDIENTE: foto del retrato]' } })), []));

  // Paridad.
  check('V09 detecta listas de distinta longitud', idsOf(pair({ t: { items: ['a', 'b'] } }, { t: { items: ['a'] } })).includes('V09'));
  check('V09 detecta cadena vacia', idsOf(pair({ t: { text: '' } }, { t: { text: 'x' } })).includes('V09'));
  check('V09 detecta encabezado identico y _sameAllowed lo exime', idsOf(pair({ t: { h2: 'Blog' } }, { t: { h2: 'Blog' } })).includes('V09') && !idsOf(pair({ t: { h2: 'Blog' } }, { t: { h2: 'Blog' } }, { _sameAllowed: ['t.h2'] })).includes('V09'));

  // Encabezados.
  check('V02 admite signos de interrogacion solo en question', idsOf(pair({ t: { question: '¿Cuánto cuesta?' } }, { t: { question: 'How much does it cost?' } })).length === 0 && idsOf(pair({ t: { h2: '¿Cuánto cuesta?' } }, { t: { h2: 'How much does it cost?' } })).includes('V02'));
  check('V02 no marca el punto de "Next.js"', !idsOf(pair({ t: { h2: 'Desarrollo con Next.js y Payload' } }, { t: { h2: 'Development with Next.js and Payload' } })).includes('V02'));
  check('V02 marca "86,000" y "86.000" en encabezados', idsOf(pair({ t: { h2: 'Llegar a 86,000 clics' } }, { t: { h2: 'Reach 86.000 clicks' } }, { _numbers: [{ value: '86000', source: 'x' }] })).includes('V02'));

  // Destinos (V14 y SafeLink comparten isAllowedHref).
  const good = ['#contacto', '/servicios', '/en/services/seo-technical-audit', 'mailto:hello@juan-tech.com', 'https://juan-tech.com/blog', 'https://auditor.juan-tech.com', 'https://github.com/Sve-nnN/website/commit/23646a1', 'https://linkedin.com/in/juancangulo'];
  const bad = ['http://juan-tech.com', 'https://juan-tech.com.evil.com', 'https://juan-tech.com@evil.com', '//evil.com', '/\\evil.com', 'javascript:alert(1)', 'https://github.com/otro/repo', 'https://github.com/Sve-nnN/website-x', 'https://linkedin.com/in/otro', 'https://juan-tech.com:8443/', '#', '', ' https://juan-tech.com'];
  check('destinos permitidos', good.every(isAllowedHref), good.filter((h) => !isAllowedHref(h)).join(' '));
  check('destinos no permitidos', bad.every((h) => !isAllowedHref(h)), bad.filter(isAllowedHref).join(' '));
}

function runCli() {
  const run = (args) => spawnSync(process.execPath, [SELF, ...args], { encoding: 'utf8' });
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'check-copy-'));
  try {
    const r = run([`--dir=${empty}`]);
    check('carpeta de copy vacia sale con 0 y un INFO', r.status === 0 && /INFO/.test(r.stdout), `salida=${r.status}`);
  } finally {
    fs.rmSync(empty, { recursive: true, force: true });
  }
  check('archivo inexistente sale con 2', run([path.join(FIXTURES, 'no-existe.json')]).status === 2);
  check('opcion desconocida sale con 2', run(['--bogus']).status === 2);
  check('fixture malo sale con 1', run([path.join(FIXTURES, 'copy-bad.json')]).status === 1);
  check('fixture bueno sale con 0', run([path.join(FIXTURES, 'copy-good.json')]).status === 0);
  const warnOnly = (() => {
    // Un documento con solo V15 (aviso) no debe contar como FAIL.
    const long = 'Reviso el rastreo, la indexación y la velocidad de cada plantilla del sitio, anoto lo que encuentro en una lista ordenada por impacto, corrijo primero lo que más tráfico cuesta, mido el resultado después de cada cambio y explico por qué tomé cada decisión para repetir el método en otros sitios sin depender de nadie más.';
    const longEn = 'I review crawling, indexing and speed on every template of the site, I write what I find in a list sorted by impact, I fix first what costs the most traffic, I measure the result after each change and I explain why I made each decision so I can repeat the method on other sites without depending on anyone else.';
    return lintDoc(pair({ t: { text: long } }, { t: { text: longEn } }));
  })();
  check('un aviso V15 no cuenta como FAIL', warnOnly.findings.length > 0 && warnOnly.findings.every((f) => f.level === 'WARN'), warnOnly.findings.map((f) => `${f.level} ${f.id}`).join(' '));
}

function runSelftest() {
  runFixtures();
  runInline();
  runCli();
  console.log(`RESULT selftest pass=${passes} fail=${failures}`);
  process.exit(failures > 0 ? 1 : 0);
}

/* ---------- main ---------- */

const opts = parseArgs(process.argv.slice(2));
if (opts.error) die(2, `${opts.error}\n${USAGE}`);
if (opts.selftest) runSelftest();
else runNormal(opts);
