#!/usr/bin/env node
// Prechequeo local de la migracion phase55_case_lessons (plan 55-06, tarea 1).
//
// Solo lectura de archivos del repo: sin red, sin base de datos, sin variables
// de entorno de conexion. Prepara a Juan antes de aplicar la migracion:
//
//   1. Localiza la migracion phase55_case_lessons y corre la guardia de
//      55-migration-additive.mjs (checkUpBody / extractUpBody).
//   2. Imprime las tablas que crea el cuerpo de `up` y exige que sean
//      exactamente las cuatro permitidas.
//   3. Comprueba que la migracion figure en src/migrations/index.ts y que su
//      .json de snapshot exista.
//   4. Confirma que ninguna otra migracion sin aplicar aparecio despues de
//      20261108_043335_phase54_shadow_content (la entrada anterior en index.ts).
//   5. Imprime la orden exacta que Juan correra, sin credenciales.
//
// Uso:
//   node scripts/verify/55-pre-migrate-check.mjs            revisa el repo
//   node scripts/verify/55-pre-migrate-check.mjs --selftest fixtures propios

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkUpBody, extractUpBody } from './55-migration-additive.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const migrationsDir = join(here, '..', '..', 'src', 'migrations')

const EXPECTED_TABLES = [
  'case_studies_lessons',
  'case_studies_lessons_locales',
  '_case_studies_v_version_lessons',
  '_case_studies_v_version_lessons_locales',
]
const MIGRATION_KEY = 'phase55_case_lessons'
const PREVIOUS_ENTRY = '20261108_043335_phase54_shadow_content'

/** Tablas que crea el cuerpo de `up`, en orden de aparicion. */
export function createdTables(upBody) {
  const sqlText = [...upBody.matchAll(/sql`([\s\S]*?)`/g)].map((m) => m[1]).join(';\n')
  return [...sqlText.matchAll(/CREATE\s+TABLE\s+"([a-z0-9_]+)"/gi)].map((m) => m[1])
}

/** Nombres de migracion registrados en index.ts, en orden. */
export function registeredNames(indexSource) {
  return [...indexSource.matchAll(/name:\s*'([^']+)'/g)].map((m) => m[1])
}

/**
 * Evalua el repo. `files` son los nombres de src/migrations, `readFile` lee uno
 * por nombre. Devuelve { failures, tables, migrationName }.
 */
export function evaluate({ files, indexSource, readFile }) {
  const failures = []
  const migrationFiles = files.filter((f) => f.includes(MIGRATION_KEY) && f.endsWith('.ts')).sort()
  if (migrationFiles.length === 0) {
    return { failures: [`no existe ninguna migracion ${MIGRATION_KEY} en src/migrations`], tables: [], migrationName: null }
  }
  if (migrationFiles.length > 1) {
    failures.push(`hay ${migrationFiles.length} migraciones ${MIGRATION_KEY}: ${migrationFiles.join(', ')}`)
  }
  const file = migrationFiles[migrationFiles.length - 1]
  const migrationName = file.replace(/\.ts$/, '')

  // 1. Guardia aditiva.
  const upBody = extractUpBody(readFile(file))
  let tables = []
  if (!upBody) {
    failures.push(`no se pudo aislar el cuerpo de up en ${file}`)
  } else {
    for (const f of checkUpBody(upBody)) failures.push(`guardia aditiva: ${f}`)

    // 2. Exactamente las cuatro tablas.
    tables = createdTables(upBody)
    const sortedGot = [...tables].sort()
    const sortedWant = [...EXPECTED_TABLES].sort()
    if (tables.length !== EXPECTED_TABLES.length || sortedGot.join('|') !== sortedWant.join('|')) {
      failures.push(`up crea ${tables.length} tabla(s) (${tables.join(', ') || 'ninguna'}); se esperaban exactamente: ${EXPECTED_TABLES.join(', ')}`)
    }
  }

  // 3. Registro en index.ts y snapshot.
  const registered = registeredNames(indexSource)
  if (!registered.includes(migrationName)) {
    failures.push(`${migrationName} no figura en src/migrations/index.ts`)
  }
  if (!files.includes(`${migrationName}.json`)) {
    failures.push(`falta el snapshot ${migrationName}.json`)
  }

  // 4. Nada mas despues de la entrada anterior.
  const prevIdx = registered.indexOf(PREVIOUS_ENTRY)
  if (prevIdx === -1) {
    failures.push(`la entrada anterior ${PREVIOUS_ENTRY} no figura en index.ts`)
  } else {
    const after = registered.slice(prevIdx + 1)
    const extra = after.filter((n) => n !== migrationName)
    if (extra.length > 0) {
      failures.push(`migraciones sin aplicar distintas de ${MIGRATION_KEY} despues de ${PREVIOUS_ENTRY}: ${extra.join(', ')}`)
    }
  }
  // Archivos .ts sin registrar en index.ts (migraciones que payload no vería, o
  // que apareceran despues): cualquier archivo posterior a la entrada anterior
  // debe ser la migracion de la fase 55.
  const onDisk = files
    .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
    .map((f) => f.replace(/\.ts$/, ''))
    .sort()
  const laterOnDisk = onDisk.filter((n) => n > PREVIOUS_ENTRY && n !== migrationName)
  if (laterOnDisk.length > 0) {
    failures.push(`archivos de migracion posteriores a ${PREVIOUS_ENTRY} distintos de ${MIGRATION_KEY}: ${laterOnDisk.join(', ')}`)
  }

  return { failures, tables, migrationName }
}

function selftest() {
  const sqlWrap = (up) => `export async function up({ db }) {
  await db.execute(sql\`
   ${up}\`)
}

export async function down({ db }) {
  await db.execute(sql\`
   DROP TABLE "case_studies_lessons" CASCADE;\`)
}
`
  const validUp = `CREATE TABLE "case_studies_lessons" ("_order" integer NOT NULL, "_parent_id" integer NOT NULL, "id" varchar PRIMARY KEY NOT NULL);
  CREATE TABLE "case_studies_lessons_locales" ("title" varchar, "id" serial PRIMARY KEY NOT NULL, "_locale" "_locales" NOT NULL, "_parent_id" varchar NOT NULL);
  CREATE TABLE "_case_studies_v_version_lessons" ("_order" integer NOT NULL, "_parent_id" integer NOT NULL, "id" serial PRIMARY KEY NOT NULL);
  CREATE TABLE "_case_studies_v_version_lessons_locales" ("title" varchar, "id" serial PRIMARY KEY NOT NULL, "_locale" "_locales" NOT NULL, "_parent_id" integer NOT NULL);
  ALTER TABLE "case_studies_lessons" ADD CONSTRAINT "case_studies_lessons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "case_studies_lessons_order_idx" ON "case_studies_lessons" USING btree ("_order");`

  const MIG = `20261109_044123_${MIGRATION_KEY}`
  const baseFiles = [`${PREVIOUS_ENTRY}.ts`, `${PREVIOUS_ENTRY}.json`, `${MIG}.ts`, `${MIG}.json`, 'index.ts']
  const baseIndex = `{ name: '${PREVIOUS_ENTRY}' },\n{ name: '${MIG}' },`

  const run = (over = {}) => {
    const up = over.up ?? validUp
    const files = over.files ?? baseFiles
    const indexSource = over.indexSource ?? baseIndex
    return evaluate({
      files,
      indexSource,
      readFile: (f) => (f.endsWith(`${MIGRATION_KEY}.ts`) ? sqlWrap(up) : ''),
    })
  }

  let bad = 0
  const good = run()
  if (good.failures.length === 0 && good.tables.length === 4) {
    console.log('PASS selftest: fixture valido sin fallos y con cuatro tablas')
  } else {
    bad++
    console.log('FAIL selftest: el fixture valido produjo fallos')
    for (const f of good.failures) console.log(`  ${f}`)
  }

  const defective = {
    'tabla extra en up': { up: `${validUp};\n  CREATE TABLE "posts_extra" ("id" serial PRIMARY KEY NOT NULL);` },
    'falta una tabla': { up: validUp.split('\n').filter((l) => !l.includes('CREATE TABLE "_case_studies_v_version_lessons_locales"')).join('\n') },
    'DROP COLUMN en up': { up: `${validUp};\n  ALTER TABLE "case_studies" DROP COLUMN "conclusion";` },
    'sin registrar en index.ts': { indexSource: `{ name: '${PREVIOUS_ENTRY}' },` },
    'sin snapshot json': { files: baseFiles.filter((f) => f !== `${MIG}.json`) },
    'otra migracion registrada despues': {
      indexSource: `${baseIndex}\n{ name: '20261110_000000_otra' },`,
      files: [...baseFiles, '20261110_000000_otra.ts'],
    },
    'otra migracion en disco sin registrar': { files: [...baseFiles, '20261110_000000_otra.ts'] },
  }
  for (const [name, over] of Object.entries(defective)) {
    const r = run(over)
    if (r.failures.length === 0) {
      bad++
      console.log(`FAIL selftest: el defectuoso "${name}" no produjo ningun fallo`)
    } else {
      console.log(`PASS selftest: "${name}" detectado (${r.failures.length} fallo/s)`)
    }
  }
  process.exit(bad > 0 ? 1 : 0)
}

function main() {
  const files = readdirSync(migrationsDir)
  const indexSource = readFileSync(join(migrationsDir, 'index.ts'), 'utf8')
  const { failures, tables, migrationName } = evaluate({
    files,
    indexSource,
    readFile: (f) => readFileSync(join(migrationsDir, f), 'utf8'),
  })

  if (failures.length > 0) {
    for (const f of failures) console.log(`FAIL ${f}`)
    console.log('FAIL: el prechequeo rechazo la migracion. No la apliques; consulta con Juan')
    process.exit(1)
  }

  console.log(`PASS: ${migrationName} supera la guardia aditiva`)
  console.log(`Tablas que crea up (${tables.length}):`)
  for (const t of tables) console.log(`  - ${t}`)
  console.log(`PASS: registrada en src/migrations/index.ts y con snapshot ${migrationName}.json`)
  console.log(`PASS: ninguna otra migracion sin aplicar despues de ${PREVIOUS_ENTRY}`)
  console.log('')
  console.log('Ordenes que correra Juan (sin credenciales, desde la raiz del repo):')
  console.log('  Terminal A: ./scripts/db/tunnel.sh')
  console.log('  Terminal B: export DATABASE_URI=<tunel, usuario dueño> PAYLOAD_SECRET=migrate-only NEXT_PUBLIC_SERVER_URL=https://juan-tech.com')
  console.log('              node -e "const u=new URL(process.env.DATABASE_URI);console.log(u.hostname,u.port,u.pathname)"   # debe imprimir 127.0.0.1 15432 /juantech')
  console.log('              node_modules/.bin/tsx scripts/db/04-which-database.ts')
  console.log('              node_modules/.bin/payload migrate   # debe listar solo ' + migrationName)
  console.log('              node_modules/.bin/tsx scripts/db/24-phase55-verify-schema.ts')
}

if (process.argv.includes('--selftest')) selftest()
else main()
