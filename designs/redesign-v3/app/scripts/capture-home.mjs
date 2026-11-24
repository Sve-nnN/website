#!/usr/bin/env node
/*
 * capture-home.mjs: capturas JPG (calidad 70) de la home React (dist/) y del HTML aprobado, para compararlos lado a lado.
 *
 * Uso: node scripts/capture-home.mjs [--only=react|html] [--palette=papel-bosque]
 * Escribe en designs/redesign-v3/reports/home-v4/: react-desktop-*.jpg, react-mobile-*.jpg y html-desktop-*.jpg.
 * Desktop 1440x900 (hero, clientes, servicios, casos, websites, testimonios, footer) y mobile 390 (hero y menu abierto).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startStaticServer } from './lib/static-server.mjs';
import { launch, loadPlaywright } from './lib/browser.mjs';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.resolve(APP, '..', 'reports', 'home-v4');
const HTML_ROOT = path.resolve(APP, '..', '..', 'redesign-v4', 'c-manual');
const arg = (n, d) => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `--${n}=${d}`).split('=')[1];
const only = arg('only', 'all');
const palette = arg('palette', 'papel-bosque');
fs.mkdirSync(OUT, { recursive: true });

const { chromium } = await loadPlaywright();
const browser = await launch(chromium);
const react = await startStaticServer({ root: path.join(APP, 'dist'), compress: false });
const html = await startStaticServer({ root: HTML_ROOT, compress: false });
const SECTIONS = ['top', 'clientes', 'servicios', 'casos', 'websites', 'testimonios'];
const shot = (page, name) => page.screenshot({ path: path.join(OUT, `${name}.jpg`), type: 'jpeg', quality: 70 });

async function toSection(page, id) {
  await page.evaluate(async (sid) => {
    const el = document.getElementById(sid);
    const y = sid === 'top' ? 0 : el.getBoundingClientRect().top + window.scrollY - 70;
    // recorre en pasos para disparar reveals y contadores
    const steps = 6;
    const from = window.scrollY;
    for (let i = 1; i <= steps; i += 1) {
      window.scrollTo({ top: from + ((y - from) * i) / steps, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 120));
    }
  }, id);
  await page.waitForTimeout(2600);
}

async function desktop(label, base) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${base}/?paleta=${palette}`, { waitUntil: 'load' });
  await page.waitForTimeout(label === 'react' ? 9000 : 2500);
  for (const id of SECTIONS) {
    await toSection(page, id);
    if (label === 'react' && id === 'websites') {
      const box = await page.locator('.site:nth-child(2) .dev').boundingBox();
      await page.mouse.move(box.x + 30, box.y + 60);
      for (let i = 0; i < 14; i += 1) await page.mouse.move(box.x + 40 + i * 22, box.y + 90 + Math.sin(i / 2) * 50);
      await page.waitForTimeout(900);
    }
    if (label === 'react' && id === 'servicios') {
      const box = await page.locator('.bento .cell:nth-child(1)').boundingBox();
      await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.4);
      await page.waitForTimeout(600);
    }
    await shot(page, `${label}-desktop-${id === 'top' ? 'hero' : id}`);
  }
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await page.waitForTimeout(1800);
  await shot(page, `${label}-desktop-footer`);
  await ctx.close();
}

async function mobile(label, base) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await page.goto(`${base}/?paleta=${palette}`, { waitUntil: 'load' });
  await page.waitForTimeout(3500);
  await shot(page, `${label}-mobile-hero`);
  await page.click('#menubtn');
  await page.waitForTimeout(500);
  await shot(page, `${label}-mobile-menu`);
  await ctx.close();
}

if (only !== 'html') {
  await desktop('react', react.url);
  await mobile('react', react.url);
}
if (only !== 'react') await desktop('html', html.url);
await browser.close();
await react.close();
await html.close();
console.log('Capturas en', path.relative(process.cwd(), OUT));
