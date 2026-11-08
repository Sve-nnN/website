#!/usr/bin/env node
// Guardia de migracion aditiva de la fase 54 (T-54-06 y T-54-07).
//
// Localiza la migracion mas reciente de src/migrations cuyo nombre contiene
// `phase54_shadow_content`, aisla el cuerpo de `up` y exige que sea solo
// aditivo y que toque unicamente objetos de la lista permitida:
//
//   - tablas con prefijo home_page y about_page (globals nuevos)
//   - clientes, solo con la columna on_dark
//   - las tablas del bloque toolStack (groups_tools y _groups_v_tools, por el
//     dbName 'groups'), solo con la columna logo_id (mas su llave foranea e
//     indice)
//   - media, solo como destino de REFERENCES
//   - tipos enum_home_page_* y enum_about_page_*
//
// Cualquier sentencia fuera de la lista imprime FAIL con su texto: es senal de
// esquema ajeno arrastrado desde el snapshot o de una operacion destructiva, y
// detiene el plan para decision de Juan. El cuerpo de `down` contiene DROP por
// diseno y no se revisa.
//
// Uso:
//   node scripts/verify/54-migration-additive.mjs            revisa la migracion
//   node scripts/verify/54-migration-additive.mjs --selftest fixtures propios

import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const migrationsDir = join(here, '..', '..', 'src', 'migrations')

const PREFIXES = ['home_page', 'about_page']

const isShadowTable = (t) => PREFIXES.some((p) => t === p || t.startsWith(`${p}_`))
// El bloque toolStack declara dbName 'groups' en categoryGroups (limite de 63
// caracteres de Postgres), asi que sus tablas reales se llaman groups_tools y
// _groups_v_tools (ver 20260905_060823_phase48_tool_stack_block). Se aceptan
// esos dos nombres exactos y, por si cambia el dbName, cualquiera con tool_stack.
const TOOL_STACK_TABLES = ['groups_tools', '_groups_v_tools']
const isToolStackTable = (t) => TOOL_STACK_TABLES.includes(t) || t.includes('tool_stack')

/** Aisla el contenido SQL del cuerpo de `up`. */
export function extractUpBody(source) {
  const start = source.indexOf('export async function up')
  const end = source.indexOf('export async function down')
  if (start === -1 || end === -1 || end < start) return null
  return source.slice(start, end)
}

/** Devuelve la lista de fallos de un cuerpo `up` (vacia si es valido). */
export function checkUpBody(body) {
  const failures = []
  const fail = (why, stmt) => failures.push(`${why}: ${stmt.replace(/\s+/g, ' ').trim()}`)

  // Contenido de cada plantilla sql`...` del cuerpo de up.
  const sqlText = [...body.matchAll(/sql`([\s\S]*?)`/g)].map((m) => m[1]).join(';\n')
  const statements = sqlText
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !/^--/.test(s))

  if (statements.length === 0) failures.push('El cuerpo de up no contiene sentencias SQL')

  for (const stmt of statements) {
    // 1. Palabras prohibidas en cualquier sentencia.
    if (/\bDROP\b/i.test(stmt)) fail('DROP prohibido', stmt)
    if (/\bTRUNCATE\b/i.test(stmt)) fail('TRUNCATE prohibido', stmt)
    if (/\bDELETE\s+FROM\b/i.test(stmt)) fail('DELETE FROM prohibido', stmt)
    if (/\bRENAME\b/i.test(stmt)) fail('RENAME prohibido', stmt)
    if (/ALTER\s+COLUMN/i.test(stmt)) {
      if (/\bTYPE\b/i.test(stmt)) fail('ALTER COLUMN TYPE prohibido', stmt)
      if (/SET\s+NOT\s+NULL/i.test(stmt)) fail('SET NOT NULL prohibido', stmt)
      fail('ALTER COLUMN fuera de la lista', stmt)
    }

    // 2. Cada tabla nombrada en REFERENCES debe estar permitida.
    for (const m of stmt.matchAll(/REFERENCES\s+"public"\."([a-z0-9_]+)"/gi)) {
      const t = m[1]
      if (!(isShadowTable(t) || isToolStackTable(t) || t === 'media')) {
        fail(`REFERENCES a tabla fuera de la lista (${t})`, stmt)
      }
    }

    // 3. Clasificacion por tipo de sentencia.
    let m
    if ((m = stmt.match(/^CREATE\s+TYPE\s+"public"\."([a-z0-9_]+)"/i))) {
      const name = m[1]
      if (!(name.startsWith('enum_home_page_') || name.startsWith('enum_about_page_'))) {
        fail(`CREATE TYPE fuera de la lista (${name})`, stmt)
      }
    } else if ((m = stmt.match(/^CREATE\s+TABLE\s+"([a-z0-9_]+)"/i))) {
      if (!isShadowTable(m[1])) fail(`CREATE TABLE fuera de la lista (${m[1]})`, stmt)
    } else if ((m = stmt.match(/^ALTER\s+TABLE\s+"([a-z0-9_]+)"/i))) {
      const t = m[1]
      if (isShadowTable(t)) continue
      if (t === 'clientes') {
        const onlyOnDark =
          /ADD\s+COLUMN\s+"on_dark"\s+boolean/i.test(stmt) && !/ADD\s+CONSTRAINT/i.test(stmt)
        if (!onlyOnDark) fail('clientes solo admite ADD COLUMN on_dark', stmt)
      } else if (isToolStackTable(t)) {
        const addsLogo =
          /ADD\s+COLUMN\s+"logo_id"\s+integer/i.test(stmt) ||
          (/ADD\s+CONSTRAINT\s+"[a-z0-9_]*logo[a-z0-9_]*"\s+FOREIGN\s+KEY\s+\("logo_id"\)/i.test(stmt) &&
            /REFERENCES\s+"public"\."media"/i.test(stmt))
        if (!addsLogo) fail(`tabla ${t} solo admite la columna logo_id y su llave foranea`, stmt)
      } else {
        fail(`ALTER TABLE sobre tabla ajena (${t})`, stmt)
      }
    } else if ((m = stmt.match(/^CREATE\s+(?:UNIQUE\s+)?INDEX\s+"[a-z0-9_]+"\s+ON\s+"([a-z0-9_]+)"/i))) {
      const t = m[1]
      if (isShadowTable(t)) continue
      if (isToolStackTable(t) && /\("logo_id"\)/.test(stmt)) continue
      fail(`CREATE INDEX fuera de la lista (${t})`, stmt)
    } else {
      fail('Sentencia fuera de la lista', stmt)
    }
  }
  return failures
}

function selftest() {
  const valid = `export async function up({ db }) {
  await db.execute(sql\`
   CREATE TYPE "public"."enum_home_page_services_items_icon" AS ENUM('search', 'code');
  CREATE TABLE "home_page" ("id" serial PRIMARY KEY NOT NULL);
  CREATE TABLE "home_page_locales" ("tagline" varchar, "_locale" "_locales" NOT NULL, "_parent_id" integer NOT NULL);
  CREATE TABLE "about_page" ("id" serial PRIMARY KEY NOT NULL);
  ALTER TABLE "clientes" ADD COLUMN "on_dark" boolean DEFAULT false;
  ALTER TABLE "groups_tools" ADD COLUMN "logo_id" integer;
  ALTER TABLE "_groups_v_tools" ADD COLUMN "logo_id" integer;
  ALTER TABLE "home_page_locales" ADD CONSTRAINT "home_page_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "groups_tools" ADD CONSTRAINT "groups_tools_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "home_page_locales_parent_idx" ON "home_page_locales" USING btree ("_parent_id");
  CREATE INDEX "groups_tools_logo_idx" ON "groups_tools" USING btree ("logo_id");\`)
}

export async function down({ db }) {
  await db.execute(sql\`
   DROP TABLE "home_page" CASCADE;\`)
}
`
  const defective = {
    'DROP COLUMN': `export async function up({ db }) {
  await db.execute(sql\`
   ALTER TABLE "clientes" DROP COLUMN "featured";\`)
}
export async function down({ db }) {}
`,
    'ALTER COLUMN TYPE': `export async function up({ db }) {
  await db.execute(sql\`
   ALTER TABLE "home_page" ALTER COLUMN "id" SET DATA TYPE bigint;\`)
}
export async function down({ db }) {}
`,
    'ALTER TABLE sobre posts': `export async function up({ db }) {
  await db.execute(sql\`
   ALTER TABLE "posts" ADD COLUMN "extra" varchar;\`)
}
export async function down({ db }) {}
`,
  }

  let bad = 0
  const validFailures = checkUpBody(extractUpBody(valid))
  if (validFailures.length > 0) {
    bad++
    console.log('FAIL selftest: el fixture valido produjo fallos')
    for (const f of validFailures) console.log(`  ${f}`)
  } else {
    console.log('PASS selftest: fixture valido sin fallos')
  }
  for (const [name, src] of Object.entries(defective)) {
    const f = checkUpBody(extractUpBody(src))
    if (f.length === 0) {
      bad++
      console.log(`FAIL selftest: el defectuoso "${name}" no produjo ningun fallo`)
    } else {
      console.log(`PASS selftest: "${name}" detectado (${f.length} fallo/s)`)
    }
  }
  process.exit(bad > 0 ? 1 : 0)
}

function main() {
  const files = readdirSync(migrationsDir)
    .filter((f) => f.includes('phase54_shadow_content') && f.endsWith('.ts'))
    .sort()
  if (files.length === 0) {
    console.log('FAIL: no existe ninguna migracion phase54_shadow_content en src/migrations')
    process.exit(1)
  }
  const file = files[files.length - 1]
  const body = extractUpBody(readFileSync(join(migrationsDir, file), 'utf8'))
  if (!body) {
    console.log(`FAIL: no se pudo aislar el cuerpo de up en ${file}`)
    process.exit(1)
  }
  const failures = checkUpBody(body)
  if (failures.length > 0) {
    for (const f of failures) console.log(`FAIL ${f}`)
    console.log(`FAIL: ${file} no es aditiva o arrastra esquema ajeno. Detener y consultar con Juan`)
    process.exit(1)
  }
  console.log(`PASS: ${file} es aditiva y solo toca objetos de la lista permitida`)
}

if (process.argv.includes('--selftest')) selftest()
else main()
