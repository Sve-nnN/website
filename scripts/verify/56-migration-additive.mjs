#!/usr/bin/env node
// Guardia de migracion aditiva de la fase 56 (T-56-10).
//
// Localiza la migracion mas reciente de src/migrations cuyo nombre contiene
// `phase56_legal_shadow`, aisla el cuerpo de `up` y exige que sea solo aditivo y
// que toque unicamente las dos tablas del global legal-pages:
//
//   - legal_pages
//   - legal_pages_locales
//
// Permitido: CREATE TABLE de esas dos, ALTER TABLE ... ADD CONSTRAINT de llaves
// foraneas de ellas (REFERENCES a ellas) y CREATE [UNIQUE] INDEX sobre ellas. Como
// unica excepcion, un bloque DO $$ ... $$ que haga GRANT SELECT sobre esas dos
// tablas al rol juantech_preview_ro (guardado con IF EXISTS sobre pg_roles).
// Cualquier otra sentencia imprime FAIL con su texto: es senal de deriva del
// snapshot o de una operacion destructiva, y detiene el plan para decision de
// Juan (no se edita el SQL a mano). El cuerpo de `down` contiene DROP por diseno y
// no se revisa.
//
// Ademas comprueba que la migracion este en src/migrations/index.ts y que su .json
// de snapshot exista. No ejecuta migrate ni abre ninguna base.
//
// Uso:
//   node scripts/verify/56-migration-additive.mjs            revisa la migracion
//   node scripts/verify/56-migration-additive.mjs --selftest fixtures propios

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const migrationsDir = join(here, '..', '..', 'src', 'migrations')

const ALLOWED_TABLES = ['legal_pages', 'legal_pages_locales']
const ALLOWED_ROLE = 'juantech_preview_ro'

const isAllowed = (t) => ALLOWED_TABLES.includes(t)

/** Aisla el contenido SQL del cuerpo de `up`. */
export function extractUpBody(source) {
  const start = source.indexOf('export async function up')
  const end = source.indexOf('export async function down')
  if (start === -1 || end === -1 || end < start) return null
  return source.slice(start, end)
}

/**
 * Revisa un bloque DO $$ ... $$. Solo se admite el GRANT SELECT guardado sobre las
 * dos tablas permitidas al rol del preview. Devuelve el motivo del fallo o null.
 */
function doBlockProblem(block) {
  const inner = block.replace(/^\s*DO\s+\$\$/i, '').replace(/\$\$\s*$/, '')
  const stmts = inner
    .split(';')
    .map((s) => s.replace(/--[^\n]*/g, '').replace(/\s+/g, ' ').trim())
    .filter((s) => s.length > 0)

  // Forma esperada: BEGIN IF EXISTS (...) THEN GRANT ...; END IF; END
  const expected = [
    /^BEGIN IF EXISTS \(SELECT 1 FROM pg_roles WHERE rolname = 'juantech_preview_ro'\) THEN GRANT SELECT ON TABLE ("legal_pages(?:_locales)?"(?:, )?)+ TO "juantech_preview_ro"$/i,
    /^END IF$/i,
    /^END$/i,
  ]
  if (stmts.length !== expected.length) return 'el bloque DO tiene una forma distinta de BEGIN IF EXISTS GRANT END IF END'
  for (let i = 0; i < expected.length; i++) {
    if (!expected[i].test(stmts[i])) return `sentencia del bloque DO fuera de la forma permitida (${stmts[i]})`
  }
  const grantTables = [...stmts[0].matchAll(/"([a-z0-9_]+)"/g)].map((m) => m[1]).filter((t) => t !== ALLOWED_ROLE)
  for (const t of grantTables) if (!isAllowed(t)) return `GRANT sobre tabla fuera de la lista (${t})`
  for (const t of ALLOWED_TABLES) if (!grantTables.includes(t)) return `GRANT sin la tabla ${t}`
  if (!/TO "juantech_preview_ro"$/.test(stmts[0])) return `GRANT a un rol distinto de ${ALLOWED_ROLE}`
  return null
}

/** Devuelve la lista de fallos de un cuerpo `up` (vacia si es valido). */
export function checkUpBody(body) {
  const failures = []
  const fail = (why, stmt) => failures.push(`${why}: ${stmt.replace(/\s+/g, ' ').trim()}`)

  let sqlText = [...body.matchAll(/sql`([\s\S]*?)`/g)].map((m) => m[1]).join(';\n')

  // Se extraen primero los bloques DO $$ ... $$ (contienen ; internos).
  const doBlocks = [...sqlText.matchAll(/DO\s+\$\$[\s\S]*?\$\$\s*;?/gi)].map((m) => m[0])
  sqlText = sqlText.replace(/DO\s+\$\$[\s\S]*?\$\$\s*;?/gi, ';')
  let grantBlocks = 0
  for (const block of doBlocks) {
    const why = doBlockProblem(block.replace(/;\s*$/, ''))
    if (why) fail(`Bloque DO no permitido (${why})`, block)
    else grantBlocks += 1
  }
  if (grantBlocks > 1) failures.push('Mas de un bloque DO con GRANT')

  const statements = sqlText
    .replace(/--[^\n]*/g, '')
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  if (statements.length === 0) failures.push('El cuerpo de up no contiene sentencias SQL')

  const created = new Set()

  for (const stmt of statements) {
    // 1. Palabras prohibidas en cualquier sentencia.
    if (/\bDROP\b/i.test(stmt)) fail('DROP prohibido', stmt)
    if (/\bTRUNCATE\b/i.test(stmt)) fail('TRUNCATE prohibido', stmt)
    if (/\bDELETE\s+FROM\b/i.test(stmt)) fail('DELETE FROM prohibido', stmt)
    if (/\bRENAME\b/i.test(stmt)) fail('RENAME prohibido', stmt)
    if (/ALTER\s+COLUMN/i.test(stmt)) fail('ALTER COLUMN prohibido', stmt)
    if (/\bADD\s+COLUMN\b/i.test(stmt)) fail('ADD COLUMN prohibido (solo tablas nuevas)', stmt)
    if (/^\s*(INSERT|UPDATE)\b/i.test(stmt)) fail('INSERT o UPDATE prohibido', stmt)
    if (/^\s*(GRANT|REVOKE)\b/i.test(stmt)) fail('GRANT o REVOKE fuera del bloque DO guardado', stmt)

    // 2. Cada tabla nombrada en REFERENCES debe estar permitida.
    for (const m of stmt.matchAll(/REFERENCES\s+"public"\."([a-z0-9_]+)"/gi)) {
      if (!isAllowed(m[1])) fail(`REFERENCES a tabla fuera de la lista (${m[1]})`, stmt)
    }

    // 3. Clasificacion por tipo de sentencia.
    let m
    if (/^CREATE\s+TYPE\b/i.test(stmt)) {
      fail('CREATE TYPE prohibido', stmt)
    } else if ((m = stmt.match(/^CREATE\s+TABLE\s+"([a-z0-9_]+)"/i))) {
      if (!isAllowed(m[1])) fail(`CREATE TABLE fuera de la lista (${m[1]})`, stmt)
      else created.add(m[1])
    } else if ((m = stmt.match(/^ALTER\s+TABLE\s+"([a-z0-9_]+)"/i))) {
      const t = m[1]
      if (!isAllowed(t)) {
        fail(`ALTER TABLE sobre tabla ajena (${t})`, stmt)
      } else if (!/^ALTER\s+TABLE\s+"[a-z0-9_]+"\s+ADD\s+CONSTRAINT\s+"[a-z0-9_]+"\s+FOREIGN\s+KEY\b/i.test(stmt)) {
        fail(`ALTER TABLE sobre ${t} solo admite ADD CONSTRAINT FOREIGN KEY`, stmt)
      }
    } else if ((m = stmt.match(/^CREATE\s+(?:UNIQUE\s+)?INDEX\s+"[a-z0-9_]+"\s+ON\s+"([a-z0-9_]+)"/i))) {
      if (!isAllowed(m[1])) fail(`CREATE INDEX fuera de la lista (${m[1]})`, stmt)
    } else {
      fail('Sentencia fuera de la lista', stmt)
    }
  }

  for (const t of ALLOWED_TABLES) {
    if (!created.has(t)) failures.push(`Falta CREATE TABLE de ${t}`)
  }
  return failures
}

function selftest() {
  const wrap = (up) => `export async function up({ db }) {
  await db.execute(sql\`
   ${up}\`)
}

export async function down({ db }) {
  await db.execute(sql\`
   DROP TABLE "legal_pages" CASCADE;\`)
}
`
  const grant = (role = ALLOWED_ROLE, tables = '"legal_pages", "legal_pages_locales"') => `
  DO $$
  BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'juantech_preview_ro') THEN
      GRANT SELECT ON TABLE ${tables} TO "${role}";
    END IF;
  END
  $$;`
  const base = `CREATE TABLE "legal_pages" ("id" serial PRIMARY KEY NOT NULL, "effective_date" timestamp(3) with time zone);
  CREATE TABLE "legal_pages_locales" ("privacy_body" jsonb, "id" serial PRIMARY KEY NOT NULL, "_locale" "_locales" NOT NULL, "_parent_id" integer NOT NULL);
  ALTER TABLE "legal_pages_locales" ADD CONSTRAINT "legal_pages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."legal_pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "legal_pages_locales_locale_parent_id_unique" ON "legal_pages_locales" USING btree ("_locale","_parent_id");`
  const validUp = `${base}\n${grant()}`

  const defective = {
    'tabla extra': `${base}\n  CREATE TABLE "posts_extra" ("id" serial PRIMARY KEY NOT NULL);\n${grant()}`,
    'GRANT a un rol distinto': `${base}\n${grant('otro_rol')}`,
    'GRANT sobre tabla ajena': `${base}\n${grant(ALLOWED_ROLE, '"legal_pages", "legal_pages_locales", "users"')}`,
    'GRANT suelto fuera del bloque DO': `${base}\n  GRANT SELECT ON TABLE "legal_pages" TO "juantech_preview_ro";`,
    'DROP COLUMN': `${validUp};\n  ALTER TABLE "pages" DROP COLUMN "title";`,
    'ADD COLUMN sobre tabla existente': `${validUp};\n  ALTER TABLE "pages" ADD COLUMN "extra" varchar;`,
    'CREATE TYPE': `${validUp};\n  CREATE TYPE "public"."enum_x" AS ENUM('a');`,
    TRUNCATE: `${validUp};\n  TRUNCATE TABLE "pages";`,
    'REFERENCES a tabla ajena': `${base}\n  ALTER TABLE "legal_pages" ADD CONSTRAINT "x_fk" FOREIGN KEY ("id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;\n${grant()}`,
    'falta una tabla': `${base.split('\n').filter((l) => !l.includes('CREATE TABLE "legal_pages_locales"')).join('\n')}\n${grant()}`,
    'bloque DO con otra cosa': `${base}\n  DO $$ BEGIN DELETE FROM "pages"; END $$;`,
  }

  let bad = 0
  const validFailures = checkUpBody(extractUpBody(wrap(validUp)))
  if (validFailures.length > 0) {
    bad++
    console.log('FAIL selftest: el fixture valido produjo fallos')
    for (const f of validFailures) console.log(`  ${f}`)
  } else {
    console.log('PASS selftest: fixture valido sin fallos')
  }
  for (const [name, up] of Object.entries(defective)) {
    const f = checkUpBody(extractUpBody(wrap(up)))
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
    .filter((f) => f.includes('phase56_legal_shadow') && f.endsWith('.ts') && f !== 'index.ts')
    .sort()
  if (files.length === 0) {
    console.log('FAIL: no existe ninguna migracion phase56_legal_shadow en src/migrations')
    process.exit(1)
  }
  const file = files[files.length - 1]
  const base = file.replace(/\.ts$/, '')
  let failed = false

  const body = extractUpBody(readFileSync(join(migrationsDir, file), 'utf8'))
  if (!body) {
    console.log(`FAIL: no se pudo aislar el cuerpo de up en ${file}`)
    process.exit(1)
  }
  const failures = checkUpBody(body)
  if (failures.length > 0) {
    for (const f of failures) console.log(`FAIL ${f}`)
    console.log(`FAIL: ${file} no es aditiva o arrastra esquema ajeno. Detener y consultar con Juan`)
    failed = true
  }

  if (!existsSync(join(migrationsDir, `${base}.json`))) {
    console.log(`FAIL: falta el snapshot ${base}.json`)
    failed = true
  }
  const index = readFileSync(join(migrationsDir, 'index.ts'), 'utf8')
  if (!index.includes(`name: '${base}'`)) {
    console.log(`FAIL: ${base} no esta registrada en src/migrations/index.ts`)
    failed = true
  }

  if (failed) process.exit(1)
  console.log(`PASS: ${file} es aditiva y solo crea las dos tablas del global legal-pages`)
  for (const t of ALLOWED_TABLES) console.log(`  - ${t}`)
  console.log(`PASS: un unico GRANT SELECT guardado a ${ALLOWED_ROLE}, snapshot .json presente y entrada en index.ts`)
}

// Solo se ejecuta como script; al importarla expone extractUpBody y checkUpBody
// sin correr main ni selftest.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--selftest')) selftest()
  else main()
}
