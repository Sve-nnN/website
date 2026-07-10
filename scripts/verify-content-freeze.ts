/**
 * Diffs two content-freeze snapshots (produced by
 * scripts/content-freeze-snapshot.ts) and reports any drift: new ids
 * published, ids with a changed updatedAt (edited), or ids removed, between
 * the "before" and "after" snapshot.
 *
 * Run with:
 *   node --env-file=.env node_modules/.bin/tsx scripts/verify-content-freeze.ts \
 *     --before <path to freeze snapshot> --after <path to pre-golive snapshot>
 */
import fs from 'fs'

type SnapshotDoc = { id: unknown; slug: unknown; updatedAt: unknown }
type Snapshot = {
  tag: string
  takenAt: string
  collections: Record<string, { count: number; docs: SnapshotDoc[] }>
}

function getArg(name: string): string {
  const args = process.argv.slice(2)
  const idx = args.indexOf(name)
  if (idx === -1 || !args[idx + 1]) {
    console.error(`Usage: verify-content-freeze.ts --before <path> --after <path>`)
    process.exit(1)
  }
  return args[idx + 1]
}

function loadSnapshot(filePath: string): Snapshot {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

function main() {
  const beforePath = getArg('--before')
  const afterPath = getArg('--after')

  const before = loadSnapshot(beforePath)
  const after = loadSnapshot(afterPath)

  console.log(`Comparing before="${before.tag}" (${before.takenAt}) vs after="${after.tag}" (${after.takenAt})\n`)

  let anyDrift = false
  const collectionNames = new Set([
    ...Object.keys(before.collections),
    ...Object.keys(after.collections),
  ])

  for (const collection of collectionNames) {
    const beforeDocs = before.collections[collection]?.docs ?? []
    const afterDocs = after.collections[collection]?.docs ?? []

    const beforeMap = new Map(beforeDocs.map((d) => [String(d.id), d]))
    const afterMap = new Map(afterDocs.map((d) => [String(d.id), d]))

    const added: string[] = []
    const edited: string[] = []
    const removed: string[] = []

    for (const [id, afterDoc] of afterMap) {
      const beforeDoc = beforeMap.get(id)
      if (!beforeDoc) {
        added.push(id)
      } else if (String(beforeDoc.updatedAt) !== String(afterDoc.updatedAt)) {
        edited.push(id)
      }
    }

    for (const id of beforeMap.keys()) {
      if (!afterMap.has(id)) removed.push(id)
    }

    if (added.length || edited.length || removed.length) {
      anyDrift = true
      console.log(`DRIFT in "${collection}":`)
      if (added.length) console.log(`  added (published during freeze): ${added.join(', ')}`)
      if (edited.length) console.log(`  edited (updatedAt changed during freeze): ${edited.join(', ')}`)
      if (removed.length) console.log(`  removed: ${removed.join(', ')}`)
    }
  }

  if (anyDrift) {
    console.error('\nDRIFT DETECTED — freeze did not hold. Investigate before proceeding with go-live.')
    process.exit(1)
  }

  console.log('NO DRIFT — freeze held')
  process.exit(0)
}

main()
