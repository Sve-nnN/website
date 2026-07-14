// Standalone regression check for CaseStudyResultsChart.tsx's
// bucketRowsByMagnitude(). Imports the real exported function (via tsx, no
// React rendering needed) and asserts the 4 documented behavior cases from
// 37-02-PLAN.md Task 1. Run with: npx tsx scripts/verify-chart-bucketing.ts

import { bucketRowsByMagnitude } from '../src/components/CaseStudyResultsChart'

type Case = {
  name: string
  rows: { label: string; before: number; after: number }[]
  assert: (result: ReturnType<typeof bucketRowsByMagnitude>) => void
}

const cases: Case[] = [
  {
    name: 'Same order of magnitude -> single shared axis, no right bucket',
    rows: [
      { label: 'CTR', before: 2, after: 3 },
      { label: 'Position', before: 8, after: 5 },
    ],
    assert: (result) => {
      if (result.hasRightAxis) throw new Error('expected hasRightAxis=false for same-magnitude rows')
      for (const row of result.rows) {
        if (row.beforeRight !== undefined || row.afterRight !== undefined) {
          throw new Error('expected no *Right values when all rows share one magnitude order')
        }
        if (row.beforeLeft === undefined || row.afterLeft === undefined) {
          throw new Error('expected *Left values populated for same-magnitude rows')
        }
      }
    },
  },
  {
    name: 'Wide magnitude gap -> position buckets left, impressions buckets right',
    rows: [
      { label: 'Position', before: 8, after: 5 },
      { label: 'Impressions', before: 30000, after: 45000 },
    ],
    assert: (result) => {
      if (!result.hasRightAxis) throw new Error('expected hasRightAxis=true for wide magnitude gap')
      const position = result.rows.find((r) => r.label === 'Position')
      const impressions = result.rows.find((r) => r.label === 'Impressions')
      if (!position || position.beforeLeft === undefined || position.beforeRight !== undefined) {
        throw new Error('expected Position row bucketed to left only')
      }
      if (!impressions || impressions.beforeRight === undefined || impressions.beforeLeft !== undefined) {
        throw new Error('expected Impressions row bucketed to right only')
      }
    },
  },
  {
    name: 'Unparseable metric rows are skipped upstream, bucketing only sees parsed rows',
    rows: [{ label: 'Clicks', before: 120, after: 340 }],
    assert: (result) => {
      if (result.rows.length !== 1) throw new Error('expected exactly 1 row (unparseable rows never reach bucketing)')
      if (result.hasRightAxis) throw new Error('expected hasRightAxis=false for a single row')
    },
  },
  {
    name: 'magnitude === 0 does not throw (guarded against -Infinity from log10(0))',
    rows: [
      { label: 'Zeroed metric', before: 0, after: 0 },
      { label: 'Impressions', before: 30000, after: 45000 },
    ],
    assert: (result) => {
      if (!result.hasRightAxis) throw new Error('expected hasRightAxis=true (order 0 vs order 4)')
      const zeroed = result.rows.find((r) => r.label === 'Zeroed metric')
      if (!zeroed || zeroed.beforeLeft !== 0 || zeroed.afterLeft !== 0) {
        throw new Error('expected zero-magnitude row bucketed to left as order 0, values preserved as 0')
      }
    },
  },
]

let failures = 0

for (const testCase of cases) {
  try {
    const result = bucketRowsByMagnitude(testCase.rows)
    testCase.assert(result)
    console.log(`PASS: ${testCase.name}`)
  } catch (err) {
    failures += 1
    console.error(`FAIL: ${testCase.name}`)
    console.error(err instanceof Error ? err.message : err)
  }
}

if (failures > 0) {
  console.error(`\n${failures}/${cases.length} case(s) failed`)
  process.exit(1)
}

console.log(`\nAll ${cases.length} cases passed`)
