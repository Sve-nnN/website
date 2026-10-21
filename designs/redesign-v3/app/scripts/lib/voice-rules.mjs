/*
 * voice-rules.mjs: reglas V01 a V16 de la guia de voz (research/voice-and-tone-juan.md) como funciones puras.
 *
 * Cada regla tiene id estable, nivel (FAIL o WARN), seccion de la guia y run(ctx). run devuelve hallazgos
 * { path, message }. lintDoc() los completa con id, nivel y guia y valida el esquema; lintRendered() aplica
 * las reglas de estilo al TEXTO RENDERIZADO de la home (D-04), para que una cadena escrita a mano en un
 * componente tambien falle.
 *
 * Portado del worktree de la fase 52 (agent-a52c13fdfcfe5a678) al copy v4 y sin dependencias:
 *  - se descartan las importaciones de ../../src/home/pending.ts y links.ts (no existen en v4): el regex de
 *    pendientes y la lista de destinos permitidos se declaran aqui;
 *  - se descartan _allow, _numbers y _sameAllowed (el copy v4 no los trae): las excepciones viven en la
 *    constante unica ALLOW de este archivo, con regla, texto exacto y razon, y se listan en el SUMMARY;
 *  - V12 (microcopy de terminal) se conserva pero no halla nada: el copy v4 no tiene la clave "terminal".
 */

export const LANGS = ['es', 'en'];
export const HEADING_KEYS = new Set(['h1', 'h2', 'h3', 'title', 'heading', 'question', 'symptom', 'cardTitle']);
export const SKIP_KEYS = new Set(['code', 'commitSha', 'commitUrl', 'href', 'url', 'repoUrl', 'id', 'slug', 'filePath']);
export const URL_KEYS = new Set(['href', 'url', 'repoUrl', 'commitUrl']);
/** Solo estas reglas heuristicas admiten excepcion justificada en ALLOW (T-52-09). */
export const ALLOWABLE = new Set(['V04', 'V13', 'V15', 'V16']);

/**
 * Excepciones declaradas (T-52-09): no hay chequeos ocultos ni umbrales bajados. Cada entrada trae la regla,
 * el texto exacto que se permite y la razon. Se listan en el SUMMARY.
 */
export const ALLOW = [
  {
    rule: 'V04',
    path: 'es.casos.items.2.title',
    reason:
      'Titulo de caso anonimo: "Escalar el contenido legal educativo a más de 86 000 clics orgánicos anuales" es la descripcion literal del resultado, no un acto con agente claro.',
  },
  {
    rule: 'V04',
    path: 'en.casos.items.2.title',
    reason: 'Espejo en ingles del titulo anterior: mismo caso anonimo, misma descripcion literal del resultado.',
  },
];

/* ---------- utilidades ---------- */

const WORD_CHARS = '\\p{L}\\p{N}_';
/** Expresion con limites de palabra Unicode (\b no entiende tildes). */
const wb = (src, flags = 'giu') => new RegExp(`(?<![${WORD_CHARS}])(?:${src})(?![${WORD_CHARS}])`, flags);
const listRe = (words) => wb(words.join('|'));

/** Marcadores de pendiente visibles del copy v4: PENDIENTE / PENDING (con o sin detalle detras). */
export const PENDING_RE = /\b(?:PENDIENTE|PENDING)\b/gi;
export const countPending = (value) => (String(value).match(PENDING_RE) ?? []).length;
/** Un marcador mal formado seria un corchete abierto sin cerrar o un marcador suelto sin palabra conocida. */
export const hasMalformedPending = (value) => /\[[^\]]*$/.test(String(value)) || /\[(?:PEND|PENDING|PENDIENTE)(?![\w ]*\])/.test(String(value));

/** Cadena sin marcadores de pendiente (son anotaciones de revision, no copy del sitio). */
const plain = (value) => value.replace(PENDING_RE, ' ');
const wordsOf = (s) => s.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));
const relPath = (leaf) => leaf.path.split('.').slice(1).join('.');
const isString = (leaf) => typeof leaf.value === 'string';

/* ---------- destinos permitidos (T-52-02), sin importar links.ts ---------- */

const EXACT_HOSTS = new Set(['juan-tech.com', 'www.juan-tech.com']);
const LINKEDIN_OK = (p) => p === '/in/juancangulo' || p === '/in/juancangulo/';
const SITE_PREFIXES = ['/blog', '/servicios', '/case-studies', '/websites', '/stack', '/authors', '/contact', '/search', '/privacy', '/terms', '/sitemap.xml'];

/** Admite #ancla, rutas de una sola barra, mailto: y https:// a juan-tech.com o el perfil de LinkedIn. */
export function isAllowedHref(href) {
  if (typeof href !== 'string' || href === '') return false;
  if (/[\u0000-\u001f\u007f\s\\]/.test(href)) return false;
  if (href.startsWith('#')) return href.length > 1;
  if (href.startsWith('/')) return !href.startsWith('//');
  if (href.startsWith('mailto:')) return /^mailto:[^@/?#]+@[^@/?#]+(\?\S*)?$/.test(href);
  let url;
  try {
    url = new URL(href);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) return false;
  const host = url.hostname;
  if (EXACT_HOSTS.has(host)) return SITE_PREFIXES.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`)) || url.pathname === '/';
  if (host === 'linkedin.com' || host === 'www.linkedin.com') return LINKEDIN_OK(url.pathname);
  return false;
}

/** Recorre es y en y devuelve las hojas y las listas. key es la clave de propiedad mas cercana. */
export function walkDoc(doc) {
  const leaves = [];
  const lists = [];
  const walk = (node, segs, key, lang) => {
    if (Array.isArray(node)) {
      lists.push({ path: segs.join('.'), lang, length: node.length });
      node.forEach((v, i) => walk(v, [...segs, String(i)], key, lang));
    } else if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) walk(v, [...segs, k], k, lang);
    } else {
      leaves.push({ path: segs.join('.'), key, lang, value: node });
    }
  };
  for (const lang of LANGS) if (doc && doc[lang] !== undefined) walk(doc[lang], [lang], lang, lang);
  return { leaves, lists };
}

/** Hojas de texto para las reglas de estilo: sin claves tecnicas y, salvo quote=true, sin citas de terceros. */
function textLeaves(ctx, { quote = false } = {}) {
  return ctx.leaves.filter((l) => isString(l) && !SKIP_KEYS.has(l.key) && (quote || l.key !== 'quote'));
}
const headingLeaves = (ctx) => ctx.leaves.filter((l) => isString(l) && HEADING_KEYS.has(l.key));

function eachMatch(re, text, fn) {
  for (const m of text.matchAll(re)) fn(m);
}

/** Problemas de puntuacion de un encabezado. questionOk permite los signos de interrogacion. */
function headingPunctuation(text, questionOk) {
  const found = [];
  if (/,/.test(text)) found.push('coma');
  if (/\.(?=\s|$)|\.{2,}|…/.test(text)) found.push('punto o puntos suspensivos');
  if (/[:;]/.test(text)) found.push('dos puntos o punto y coma');
  if (/[!¡]/.test(text)) found.push('signo de exclamacion');
  if (!questionOk && /[?¿]/.test(text)) found.push('signo de interrogacion fuera de una pregunta');
  if (/\d[.,]\d{3}(?!\d)/.test(text)) found.push('cifra agrupada con punto o coma (escribe 86 000 con espacio de no separacion)');
  return found;
}

/* ---------- vocabularios ---------- */

const VOSEO = [
  'vos', 'tenés', 'podés', 'querés', 'sabés', 'sos', 'acá', 'mirá', 'fijate', 'contanos', 'escribime',
  'decime', 'hacé', 'avisame', 'mandame', 'dejame', 'ponete', 'andá', 'venís', 'decís',
];

const ES_PASSIVE_AUX = 'es|son|fue|fueron|era|eran|será|serán|sea|sean|sido|siendo';
const ES_PARTICIPLE = '\\p{L}{2,}(?:ado|ada|ados|adas|ido|ida|idos|idas)|(?:hech|escrit|vist|puest|dich|abiert|resuelt|cubiert|rot|vuelt)[oa]s?';
const ES_PASSIVE = wb(`(?:${ES_PASSIVE_AUX})\\s+(?:${ES_PARTICIPLE})`);

const EN_PASSIVE_AUX = 'is|are|was|were|be|been|being';
const EN_IRREGULAR = 'built|made|done|given|shown|seen|written|known|taken|chosen|found|kept|held|sent';
const EN_PASSIVE = wb(`(?:${EN_PASSIVE_AUX})\\s+(\\w{2,}ed|${EN_IRREGULAR})`);
/** Palabras en -ed que no son participios ("is speed"); evitan falsos positivos de V04 en ingles. */
const EN_NOT_PARTICIPLE = new Set(['speed', 'need', 'seed', 'feed', 'embed', 'proceed', 'succeed', 'exceed', 'indeed', 'hundred']);

const AI_ES = [
  ['robusto', 'robust[oa]s?'], ['integral', 'integrales|integral'], ['holístico', 'holístic[oa]s?'],
  ['sinergia', 'sinergias?'], ['ecosistema', 'ecosistemas?'], ['panorama', 'panorama'], ['paradigma', 'paradigmas?'],
  ['revolucionario', 'revolucionari[oa]s?'], ['de vanguardia', 'de vanguardia'], ['siguiente nivel', 'siguiente nivel'],
  ['desbloquear', 'desbloque(?:ar|a|o|amos)'], ['cabe destacar', 'cabe destacar'],
  ['es importante mencionar', 'es importante mencionar'], ['vale la pena señalar', 'vale la pena señalar'],
  ['en conclusión', 'en conclusión'], ['sin duda', 'sin duda'], ['en el mundo actual', 'en el mundo actual'],
  ['resultados medibles', 'resultados medibles'], ['partner estratégico', 'partner estratégico'],
  ['a medida', '(?:estrategia|solución|soluciones|servicio|servicios) a medida'],
  ['metodología propia', 'metodología propia'], ['growth', 'growth'], ['expertise', 'expertise'],
  ['ya sea', 'ya sea'], ['el mejor', '(?:el|la) mejor'], ['líder', 'líderes|líder'],
  ['no solo ... sino', 'no solo\\b[^.!?]{0,80}?\\bsino'], ['más que un ... es un', 'más que (?:un|una)\\b[^.!?]{0,60}?\\bes (?:un|una)'],
];
const AI_EN = [
  ['leverage', 'leverag(?:e|es|ed|ing)'], ['unlock', 'unlock(?:s|ed|ing)?'], ['seamless', 'seamless(?:ly)?'],
  ['game-changing', 'game-changing'], ['world-class', 'world-class'], ['robust', 'robust'], ['holistic', 'holistic'],
  ['synergy', 'synerg(?:y|ies)'], ['ecosystem', 'ecosystems?'], ['landscape', 'landscapes?'], ['cutting-edge', 'cutting-edge'],
  ['best-in-class', 'best-in-class'], ["in today's", 'in today[\'’]s'], ["it's worth noting", 'it[\'’]s worth noting'],
];

const AGENCY = {
  es: ['nosotros', 'nosotras', 'nuestro', 'nuestra', 'nuestros', 'nuestras', 'la agencia', 'Sapling'],
  en: ['we', 'our', 'ours', 'us', 'the agency', 'Sapling'],
};

const ES_STOP = ['el', 'la', 'los', 'las', 'del', 'para', 'con', 'una', 'por', 'que', 'sobre'];
const EN_STOP = ['the', 'and', 'with', 'for', 'your', 'from', 'that'];

const EN_SMALL = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'nor', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'as', 'vs', 'via', 'per']);

const META_SUFFIX = ' | Juan Carlos Angulo';

/* ---------- reglas ---------- */

export const RULES = [
  {
    id: 'V01', level: 'FAIL', guide: 'guía 4.1 regla 1',
    run: (ctx) =>
      ctx.leaves
        .filter((l) => isString(l) && /[\u2013\u2014]/.test(l.value))
        .map((l) => ({ path: l.path, message: 'guion largo o guion corto: usa coma, punto o dos puntos' })),
  },
  {
    id: 'V02', level: 'FAIL', guide: 'guía 4.1 regla 9 y D-07',
    run: (ctx) =>
      headingLeaves(ctx).flatMap((l) => {
        const found = headingPunctuation(plain(l.value), l.key === 'question');
        return found.length ? [{ path: l.path, message: `el encabezado lleva ${found.join(', ')}` }] : [];
      }),
  },
  {
    id: 'V03', level: 'FAIL', guide: 'guía 4.1 regla 3 y guía 5',
    run: (ctx) => {
      const re = listRe(VOSEO);
      const out = [];
      for (const l of textLeaves(ctx).filter((x) => x.lang === 'es')) {
        eachMatch(re, plain(l.value), (m) => out.push({ path: l.path, message: `voseo o regionalismo no neutro "${m[0]}": usa tuteo neutro` }));
      }
      return out;
    },
  },
  {
    id: 'V04', level: 'FAIL', guide: 'guía 4.1 regla 2',
    run: (ctx) => {
      const out = [];
      for (const l of textLeaves(ctx)) {
        const text = plain(l.value);
        if (l.lang === 'es') {
          eachMatch(ES_PASSIVE, text, (m) => out.push({ path: l.path, message: `posible voz pasiva "${m[0]}": escribe quien hace que` }));
        } else {
          eachMatch(EN_PASSIVE, text, (m) => {
            if (!EN_NOT_PARTICIPLE.has(m[1].toLowerCase())) out.push({ path: l.path, message: `posible voz pasiva "${m[0]}": escribe quien hace que` });
          });
        }
      }
      return out;
    },
  },
  {
    id: 'V05', level: 'FAIL', guide: 'guía 4.3 y vocabulario del brief',
    run: (ctx) => {
      const out = [];
      const sets = { es: AI_ES.map(([label, src]) => [label, wb(src)]), en: AI_EN.map(([label, src]) => [label, wb(src)]) };
      for (const l of textLeaves(ctx)) {
        const text = plain(l.value);
        for (const [label, re] of sets[l.lang]) {
          if (re.test(text)) out.push({ path: l.path, message: `frase o palabra de texto de IA o de folleto: "${label}"` });
          re.lastIndex = 0;
        }
      }
      return out;
    },
  },
  {
    id: 'V06', level: 'FAIL', guide: 'guía 4.1 regla 11',
    run: (ctx) => {
      const res = { es: listRe(AGENCY.es), en: listRe(AGENCY.en) };
      const out = [];
      for (const l of textLeaves(ctx)) {
        eachMatch(res[l.lang], plain(l.value), (m) => out.push({ path: l.path, message: `autorreferencia de agencia o plural mayestatico "${m[0]}": habla Juan en primera persona del singular` }));
      }
      return out;
    },
  },
  {
    id: 'V07', level: 'FAIL', guide: 'guía 4.1 regla 4 y D-05',
    run: (ctx) => {
      // Grupos de miles por espacio, espacio duro, punto o coma; si no, entero con decimal opcional. Sin letras pegadas.
      const re = new RegExp(`(?<![${WORD_CHARS}])(?:\\d{1,3}(?:[ \\u00a0\\u202f.,]\\d{3})+(?!\\d)|\\d+(?:[.,]\\d+)?)(?![${WORD_CHARS}])`, 'gu');
      const out = [];
      for (const l of textLeaves(ctx, { quote: true })) {
        const seen = new Set();
        eachMatch(re, plain(l.value), (m) => {
          const digits = m[0].replace(/\D/g, '');
          if (ctx.numbers.has(digits) || seen.has(digits)) return;
          seen.add(digits);
          out.push({ path: l.path, message: `cifra "${m[0]}" sin fuente en el ledger (numbers-ledger.json)` });
        });
      }
      return out;
    },
  },
  {
    id: 'V08', level: 'FAIL', guide: 'D-05 y guía 4.1 regla 4',
    run: (ctx) => {
      const out = [];
      for (const l of ctx.leaves.filter(isString)) {
        if (hasMalformedPending(l.value)) out.push({ path: l.path, message: 'marcador de pendiente mal formado: usa [PENDIENTE: descripcion] con descripcion y corchete de cierre' });
      }
      const byLang = { es: new Map(), en: new Map() };
      for (const l of ctx.leaves.filter(isString)) byLang[l.lang].set(relPath(l), l);
      for (const [rel, es] of byLang.es) {
        const en = byLang.en.get(rel);
        if (!en) continue;
        const a = countPending(es.value);
        const b = countPending(en.value);
        if (a !== b) out.push({ path: es.path, message: `distinta cantidad de pendientes entre ES (${a}) y EN (${b}) en "${rel}"` });
      }
      return out;
    },
  },
  {
    id: 'V09', level: 'FAIL', guide: 'guía 4.1 regla 7',
    run: (ctx) => {
      const out = [];
      const byLang = { es: new Map(), en: new Map() };
      for (const l of ctx.leaves) byLang[l.lang].set(relPath(l), l);
      for (const [from, to, other] of [['es', 'en', 'EN'], ['en', 'es', 'ES']]) {
        for (const [rel, leaf] of byLang[from]) {
          if (!byLang[to].has(rel)) out.push({ path: leaf.path, message: `falta el equivalente en ${other}: "${rel}"` });
        }
      }
      const listsEn = new Map(ctx.lists.filter((x) => x.lang === 'en').map((x) => [x.path.split('.').slice(1).join('.'), x]));
      for (const x of ctx.lists.filter((y) => y.lang === 'es')) {
        const rel = x.path.split('.').slice(1).join('.');
        const en = listsEn.get(rel);
        if (en && en.length !== x.length) out.push({ path: x.path, message: `la lista tiene ${x.length} elementos en ES y ${en.length} en EN` });
      }
      for (const l of ctx.leaves) {
        if (isString(l) && l.value.trim() === '') out.push({ path: l.path, message: 'cadena vacia' });
      }
      return out;
    },
  },
  {
    id: 'V10', level: 'FAIL', guide: 'guía 4.1 regla 10',
    run: (ctx) => {
      const out = [];
      for (const l of ctx.leaves.filter((x) => isString(x) && /(^|\.)meta\.title$/.test(x.path))) {
        const problems = [];
        const len = [...l.value].length;
        if (len > 60) problems.push(`mide ${len} caracteres (maximo 60)`);
        if (/,/.test(l.value) || /\.(?=\s|$)|\.{2,}/.test(l.value)) problems.push('lleva punto o coma');
        if (!l.value.endsWith(META_SUFFIX)) problems.push(`no termina en "${META_SUFFIX}"`);
        if (problems.length) out.push({ path: l.path, message: `meta titulo: ${problems.join('; ')}` });
      }
      return out;
    },
  },
  {
    id: 'V11', level: 'FAIL', guide: 'guía 4.2',
    run: (ctx) =>
      ctx.leaves
        .filter((l) => isString(l) && !SKIP_KEYS.has(l.key) && /[!¡]/.test(l.value))
        .map((l) => ({ path: l.path, message: 'signo de exclamacion: la guia solo lo admite en cita textual y esta regla no admite excepcion' })),
  },
  {
    id: 'V12', level: 'FAIL', guide: 'guía 6',
    run: (ctx) =>
      ctx.leaves
        .filter((l) => isString(l) && l.key === 'terminal' && wordsOf(l.value).length > 3)
        .map((l) => ({ path: l.path, message: `microcopy de terminal de ${wordsOf(l.value).length} palabras (maximo 3)` })),
  },
  {
    id: 'V13', level: 'FAIL', guide: 'guía 4.2',
    run: (ctx) => {
      const out = [];
      for (const l of headingLeaves(ctx).filter((x) => x.lang === 'en')) {
        const words = plain(l.value).split(/\s+/).filter((w) => /\p{L}/u.test(w));
        if (words.length < 3) continue;
        const titleCase = words.every((w, i) => {
          const first = w.replace(/^[^\p{L}]+/u, '')[0] ?? '';
          const upper = first !== '' && first === first.toUpperCase() && first !== first.toLowerCase();
          return upper || (i > 0 && EN_SMALL.has(w.toLowerCase()));
        });
        if (titleCase) out.push({ path: l.path, message: 'encabezado en ingles en Title Case: usa mayuscula inicial y nombres propios' });
      }
      return out;
    },
  },
  {
    id: 'V14', level: 'FAIL', guide: 'amenaza T-52-02',
    run: (ctx) =>
      ctx.leaves
        .filter((l) => isString(l) && URL_KEYS.has(l.key) && !isAllowedHref(l.value))
        .map((l) => ({ path: l.path, message: `destino fuera de la lista permitida: "${l.value}"` })),
  },
  {
    id: 'V15', level: 'WARN', guide: 'guía 4.2',
    run: (ctx) => {
      const out = [];
      for (const l of textLeaves(ctx)) {
        for (const sentence of plain(l.value).split(/(?<=[.!?…])\s+/)) {
          const n = wordsOf(sentence).length;
          if (n > 40) out.push({ path: l.path, message: `frase de ${n} palabras (la guia pide menos de 40 salvo que el ritmo largo se lea sin trabarse)` });
        }
      }
      return out;
    },
  },
  {
    id: 'V16', level: 'FAIL', guide: 'guía 4.1 regla 7 y D-06',
    run: (ctx) => {
      const stop = { es: listRe(EN_STOP), en: listRe(ES_STOP) };
      const out = [];
      for (const l of textLeaves(ctx)) {
        const hits = [...plain(l.value).matchAll(stop[l.lang])].map((m) => m[0].toLowerCase());
        if (hits.length >= 2) {
          const other = l.lang === 'es' ? 'ingles' : 'espanol';
          out.push({ path: l.path, message: `cadena ${l.lang.toUpperCase()} con palabras en ${other} (${[...new Set(hits)].join(', ')}): ¿bloque en el idioma equivocado?` });
        }
      }
      return out;
    },
  },
];

/* ---------- esquema y ejecucion ---------- */

/** Valida que es y en existan. El copy v4 no trae _numbers, _allow ni _sameAllowed. */
export function validateSchema(doc) {
  const errors = [];
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return ['la raiz debe ser un objeto con las claves es y en'];
  for (const lang of LANGS) {
    if (!doc[lang] || typeof doc[lang] !== 'object') errors.push(`falta la rama "${lang}" o no es un objeto`);
  }
  return errors;
}

const allowFor = (id, path) => ALLOW.find((a) => a.rule === id && (a.path === path || !a.path));
const validAllow = (a) => a && ALLOWABLE.has(a.rule) && typeof a.path === 'string' && typeof a.reason === 'string' && a.reason.trim() !== '';

/**
 * Ejecuta todas las reglas sobre un documento. `numbers` es el conjunto de cifras del ledger con fuente.
 * Devuelve { findings, allowed, schemaErrors }.
 */
export function lintDoc(doc, numbers = new Set()) {
  const schemaErrors = validateSchema(doc);
  if (schemaErrors.length) return { findings: [], allowed: [], schemaErrors };
  const { leaves, lists } = walkDoc(doc);
  const ctx = { leaves, lists, numbers };
  const findings = [];
  const allowed = [];
  for (const rule of RULES) {
    for (const f of rule.run(ctx)) {
      const full = { id: rule.id, level: rule.level, path: f.path, message: `${f.message} [${rule.guide}]` };
      const exception = allowFor(rule.id, f.path);
      if (exception) allowed.push({ ...full, reason: exception.reason });
      else findings.push(full);
    }
  }
  return { findings, allowed, schemaErrors };
}

/**
 * Reglas de estilo sobre el TEXTO RENDERIZADO (D-04): items = [{ seccion, lang, texto }].
 * Aplica el subconjunto de reglas que tiene sentido sobre frases sueltas ya pintadas en el DOM. Cada item se
 * convierte en una hoja con clave 'text' (o 'quote' para citas) y ruta `<lang>.render.<seccion>.<i>`.
 * Devuelve { findings, allowed }.
 */
const RENDERED_RULES = ['V01', 'V02', 'V03', 'V05', 'V06', 'V11', 'V16'];
export function lintRendered(items) {
  const leaves = items.map((it, i) => ({ path: `${it.lang}.render.${it.seccion}.${i}`, key: it.quote ? 'quote' : 'text', lang: it.lang, value: it.texto }));
  const ctx = { leaves, lists: [], numbers: new Set() };
  const findings = [];
  const allowed = [];
  for (const rule of RULES.filter((r) => RENDERED_RULES.includes(r.id))) {
    for (const f of rule.run(ctx)) {
      const full = { id: rule.id, level: rule.level, path: f.path, message: `${f.message} [${rule.guide}]` };
      const exception = allowFor(rule.id, f.path);
      if (exception) allowed.push({ ...full, reason: exception.reason });
      else findings.push(full);
    }
  }
  return { findings, allowed };
}
