/*
 * browser.mjs: resolucion de Playwright y de Chromium para los scripts de la home.
 * Playwright se busca en los ancestros de la app (node_modules de la raiz del repositorio, sin instalar nada aqui).
 * Si la revision de Chromium que espera esa version de Playwright no esta descargada, se usa el headless shell mas nuevo
 * que haya en la cache de ms-playwright. CHROMIUM_PATH tiene prioridad sobre todo.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const CHROMIUM_ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

export async function loadPlaywright() {
  let dir = APP;
  for (let i = 0; i < 10; i += 1) {
    const entry = path.join(dir, 'node_modules', 'playwright', 'index.mjs');
    if (fs.existsSync(entry)) return import(pathToFileURL(entry).href);
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  throw new Error('No se resuelve Playwright desde los ancestros de la app. Instala playwright en el repositorio principal.');
}

function cachedHeadlessShell() {
  const cache = path.join(os.homedir(), 'Library', 'Caches', 'ms-playwright');
  if (!fs.existsSync(cache)) return null;
  const dirs = fs
    .readdirSync(cache)
    .filter((d) => d.startsWith('chromium_headless_shell-'))
    .sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]));
  for (const d of dirs) {
    const root = path.join(cache, d);
    for (const sub of fs.readdirSync(root)) {
      const bin = path.join(root, sub, 'chrome-headless-shell');
      if (fs.existsSync(bin)) return bin;
    }
  }
  return null;
}

export async function launch(chromium, extra = {}) {
  const opts = { args: CHROMIUM_ARGS, ...extra };
  if (process.env.CHROMIUM_PATH) return chromium.launch({ ...opts, executablePath: process.env.CHROMIUM_PATH });
  try {
    return await chromium.launch(opts);
  } catch (error) {
    const fallback = cachedHeadlessShell();
    if (!fallback) throw error;
    return chromium.launch({ ...opts, executablePath: fallback });
  }
}
