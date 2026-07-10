import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import type { RemapTable } from './types'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const REMAP_TABLE_PATH = path.resolve(dirname, '../data/remap-table.json')

export function loadRemapTable(): RemapTable {
  if (!fs.existsSync(REMAP_TABLE_PATH)) {
    return {}
  }
  const raw = fs.readFileSync(REMAP_TABLE_PATH, 'utf-8')
  if (!raw.trim()) return {}
  return JSON.parse(raw) as RemapTable
}

export function saveRemapTable(table: RemapTable): void {
  fs.mkdirSync(path.dirname(REMAP_TABLE_PATH), { recursive: true })
  fs.writeFileSync(REMAP_TABLE_PATH, JSON.stringify(table, null, 2))
}

export function setMapping(
  table: RemapTable,
  collection: string,
  oldId: string,
  newId: string | number,
): void {
  if (!table[collection]) {
    table[collection] = {}
  }
  table[collection][oldId] = newId
}

export function getMapping(
  table: RemapTable,
  collection: string,
  oldId: string,
): string | number | undefined {
  return table[collection]?.[oldId]
}
