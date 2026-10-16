/*
 * origin-header.mjs: cabecera de origen de los originales de React Bits.
 * Lo comparten install-reactbits.mjs (escribe) y verify-originals.mjs (valida).
 * El registro no trae cabecera ni aviso de licencia; la cabecera es lo unico que se antepone al cuerpo.
 * Sin fechas, para que reinstalar produzca exactamente los mismos bytes.
 */
import { createHash } from 'node:crypto';

export const REGISTRY_BASE = 'https://reactbits.dev/r/';
export const VARIANT = 'TS-CSS';
export const OPEN = '/*\n * @reactbits-origin\n';
export const CLOSE = ' * @end-origin\n */\n';

export const sha256 = (data) => createHash('sha256').update(data).digest('hex');

export const registryUrl = (name) => `${REGISTRY_BASE}${name}-${VARIANT}.json`;

export function buildHeader({ component, file, url, sha256Body }) {
  return (
    OPEN +
    ` * componente: ${component}\n` +
    ` * archivo: ${file}\n` +
    ` * registro: ${url}\n` +
    ` * sha256-body: ${sha256Body}\n` +
    ' * licencia: MIT + Commons Clause, ver LICENSES.md\n' +
    ' * Cuerpo sin modificar; solo se agregó esta cabecera.\n' +
    CLOSE
  );
}

/** Separa un archivo instalado en { header, body }. header es null si no abre con la cabecera de origen. */
export function splitOrigin(text) {
  if (!text.startsWith(OPEN)) return { header: null, body: text };
  const end = text.indexOf(CLOSE);
  if (end === -1) return { header: null, body: text };
  const block = text.slice(OPEN.length, end);
  const header = {};
  for (const line of block.split('\n')) {
    const m = /^ \* ([a-z0-9-]+): (.*)$/.exec(line);
    if (m) header[m[1]] = m[2];
  }
  return { header, body: text.slice(end + CLOSE.length) };
}
