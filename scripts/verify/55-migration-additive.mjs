#!/usr/bin/env node
// Guardia de migracion aditiva de la fase 55 (T-55-09).
//
// Localiza la migracion mas reciente de src/migrations cuyo nombre contiene
// `phase55_case_lessons`, aisla el cuerpo de `up` y exige que sea solo aditivo
// y que toque unicamente las cuatro tablas del campo lessons de CaseStudies:
//
//   - case_studies_lessons
//   - case_studies_lessons_locales
//   - _case_studies_v_version_lessons
//   - _case_studies_v_version_lessons_locales
//
// Permitido: CREATE TABLE de esas cuatro, ALTER TABLE ... ADD CONSTRAINT de
// llaves foraneas de esas cuatro (REFERENCES a ellas, a case_studies y a
// _case_studies_v) y CREATE [UNIQUE] INDEX sobre ellas. Cualquier otra cosa
// imprime FAIL con el texto de la sentencia: es senal de deriva del snapshot o
// de una operacion destructiva, y detiene el plan para decision de Juan (no se
// edita el SQL a mano). El cuerpo de `down` contiene DROP por diseno y no se
// revisa.
//
// Uso:
//   node scripts/verify/55-migration-additive.mjs            revisa la migracion
//   node scripts/verify/55-migration-additive.mjs --selftest fixtures propios

import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const migrationsDir = join(here, '..', '..', 'src', 'migrations')

const ALLOWED_TABLES = [
  'case_studies_lessons',
  'case_studies_lessons_locales',
  '_case_studies_v_version_lessons',
  '_case_studies_v_version_lessons_locales',
]
const REFERENCE_TARGETS = [...ALLOWED_TABLES, 'case_studies', '_case_studies_v']

const isAllowed = (t) => ALLOWED_TABLES.includes(t)

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

  const sqlText = [...body.matchAll(/sql`([\s\S]*?)`/g)].map((m) => m[1]).join(';\n')
  const statements = sqlText
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !/^--/.test(s))

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

    // 2. Cada tabla nombrada en REFERENCES debe estar permitida.
    for (const m of stmt.matchAll(/REFERENCES\s+"public"\."([a-z0-9_]+)"/gi)) {
      if (!REFERENCE_TARGETS.includes(m[1])) {
        fail(`REFERENCES a tabla fuera de la lista (${m[1]})`, stmt)
      }
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
   DROP TABLE "case_studies_lessons" CASCADE;\`)
}
`
  const validUp = `CREATE TABLE "case_studies_lessons" ("_order" integer NOT NULL, "_parent_id" integer NOT NULL, "id" varchar PRIMARY KEY NOT NULL);
  CREATE TABLE "case_studies_lessons_locales" ("title" varchar, "body" varchar, "id" serial PRIMARY KEY NOT NULL, "_locale" "_locales" NOT NULL, "_parent_id" varchar NOT NULL);
  CREATE TABLE "_case_studies_v_version_lessons" ("_order" integer NOT NULL, "_parent_id" integer NOT NULL, "id" serial PRIMARY KEY NOT NULL, "_uuid" varchar);
  CREATE TABLE "_case_studies_v_version_lessons_locales" ("title" varchar, "body" varchar, "id" serial PRIMARY KEY NOT NULL, "_locale" "_locales" NOT NULL, "_parent_id" integer NOT NULL);
  ALTER TABLE "case_studies_lessons" ADD CONSTRAINT "case_studies_lessons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_lessons_locales" ADD CONSTRAINT "case_studies_lessons_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies_lessons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_version_lessons" ADD CONSTRAINT "_case_studies_v_version_lessons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_version_lessons_locales" ADD CONSTRAINT "_case_studies_v_version_lessons_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v_version_lessons"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "case_studies_lessons_order_idx" ON "case_studies_lessons" USING btree ("_order");
  CREATE UNIQUE INDEX "case_studies_lessons_locales_locale_parent_id_unique" ON "case_studies_lessons_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_case_studies_v_version_lessons_order_idx" ON "_case_studies_v_version_lessons" USING btree ("_order");`

  const defective = {
    'DROP COLUMN': `${validUp};
  ALTER TABLE "case_studies" DROP COLUMN "conclusion";`,
    'ADD COLUMN sobre case_studies': `${validUp};
  ALTER TABLE "case_studies" ADD COLUMN "extra" varchar;`,
    'CREATE TYPE': `${validUp};
  CREATE TYPE "public"."enum_case_studies_kind" AS ENUM('a', 'b');`,
    'tabla ajena': `${validUp};
  CREATE TABLE "posts_extra" ("id" serial PRIMARY KEY NOT NULL);`,
    TRUNCATE: `${validUp};
  TRUNCATE TABLE "case_studies";`,
    'REFERENCES a tabla ajena': `${validUp};
  ALTER TABLE "case_studies_lessons" ADD CONSTRAINT "x_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;`,
    'falta una tabla': validUp.split('\n').filter((l) => !l.includes('CREATE TABLE "_case_studies_v_version_lessons_locales"')).join('\n'),
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
    .filter((f) => f.includes('phase55_case_lessons') && f.endsWith('.ts'))
    .sort()
  if (files.length === 0) {
    console.log('FAIL: no existe ninguna migracion phase55_case_lessons en src/migrations')
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
  console.log(`PASS: ${file} es aditiva y solo crea las cuatro tablas de lessons`)
}

if (process.argv.includes('--selftest')) selftest()
else main()
