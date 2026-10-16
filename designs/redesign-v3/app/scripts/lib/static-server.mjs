/*
 * static-server.mjs: servidor estatico minimo para medir el build de produccion.
 * Escucha solo en 127.0.0.1 con puerto efimero, aplica fallback SPA a index.html para rutas sin
 * extension y comprime con brotli o gzip segun Accept-Encoding (cache en memoria).
 * Guarda contra path traversal: la ruta resuelta debe quedar bajo root (T-51.1-05).
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.txt': 'text/plain; charset=utf-8',
};
const COMPRESSIBLE = new Set(['.html', '.js', '.mjs', '.css', '.json', '.svg', '.txt']);

export function startStaticServer({ root, compress = true }) {
  const base = path.resolve(root);
  const cache = new Map();

  const encodeBody = (key, data, encoding) => {
    const k = `${encoding}:${key}`;
    if (!cache.has(k)) {
      const out =
        encoding === 'br'
          ? zlib.brotliCompressSync(data, {
              params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: data.length },
            })
          : zlib.gzipSync(data, { level: 9 });
      cache.set(k, out);
    }
    return cache.get(k);
  };

  const server = http.createServer((req, res) => {
    let urlPath;
    try {
      urlPath = decodeURIComponent(new URL(req.url ?? '/', 'http://127.0.0.1').pathname);
    } catch {
      res.writeHead(400).end();
      return;
    }
    let file = path.resolve(base, '.' + urlPath);
    if (file !== base && !file.startsWith(base + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    let ext = path.extname(file);
    if (urlPath.endsWith('/') || !ext) {
      // Fallback SPA: rutas sin extension sirven index.html.
      file = path.join(base, 'index.html');
      ext = '.html';
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('not found');
        return;
      }
      const headers = { 'content-type': MIME[ext] ?? 'application/octet-stream', 'cache-control': 'no-store' };
      const accept = String(req.headers['accept-encoding'] ?? '');
      let body = data;
      if (compress && COMPRESSIBLE.has(ext)) {
        const encoding = /\bbr\b/.test(accept) ? 'br' : /\bgzip\b/.test(accept) ? 'gzip' : null;
        if (encoding) {
          body = encodeBody(file, data, encoding);
          headers['content-encoding'] = encoding;
          headers.vary = 'Accept-Encoding';
        }
      }
      headers['content-length'] = body.length;
      res.writeHead(200, headers).end(body);
    });
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        url: `http://127.0.0.1:${port}`,
        port,
        close: () => new Promise((r) => server.close(() => r())),
      });
    });
  });
}
