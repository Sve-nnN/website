'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import type { CaseStudy } from '@/payload-types'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

type Metric = NonNullable<NonNullable<CaseStudy['results']>['metrics']>[number]

/**
 * Extracts the leading numeric value from a free-text metric string so it
 * can be plotted, e.g. "12,485" -> 12485, "$41K" -> 41000, "88" -> 88,
 * "3,782ms" -> 3782 (unit suffixes like "ms"/"%" don't scale the number,
 * only bare "k"/"m" magnitude suffixes do). Returns null when nothing
 * numeric can be found (e.g. "—"), so the caller can skip that metric.
 */
function parseLeadingNumber(raw: string | null | undefined): number | null {
  if (!raw) return null
  const match = raw.match(/-?\d{1,3}(?:,\d{3})*(?:\.\d+)?|-?\d+(?:\.\d+)?/)
  if (!match || match.index === undefined) return null

  const num = Number.parseFloat(match[0].replace(/,/g, ''))
  if (Number.isNaN(num)) return null

  const rest = raw.slice(match.index + match[0].length).trim().toLowerCase()
  if (rest.startsWith('ms') || rest.startsWith('%')) return num
  if (rest.startsWith('k')) return num * 1_000
  if (rest.startsWith('m')) return num * 1_000_000
  return num
}

type ParsedRow = {
  label: string
  before: number
  after: number
}

type ChartRow = {
  label: string
  beforeLeft?: number
  afterLeft?: number
  beforeRight?: number
  afterRight?: number
}

function buildChartRows(metrics: Metric[]): ParsedRow[] {
  const rows: ParsedRow[] = []
  for (const metric of metrics) {
    const before = parseLeadingNumber(metric.before)
    const after = parseLeadingNumber(metric.after)
    if (before === null || after === null) continue
    rows.push({ label: metric.label, before, after })
  }
  return rows
}

/**
 * Buckets already-parsed rows by order-of-magnitude so wildly different
 * scales (e.g. position ~8 vs impressions ~30,000) don't get plotted on the
 * same linear Y-axis where the small-scale metric becomes invisible.
 *
 * Algorithm (37-UI-SPEC.md Fix 2, authoritative):
 * 1. magnitude = max(|before|, |after|) per row, order = floor(log10(magnitude))
 *    (magnitude === 0 guarded to order 0, avoids -Infinity from log10(0)).
 * 2. Collect distinct orders across all rows, sorted ascending.
 * 3. If only 1 distinct order -> every row buckets `left`, no right axis.
 * 4. If 2+ distinct orders -> split at the largest gap between consecutive
 *    orders; orders at/below the split -> `left`, above -> `right`.
 */
export function bucketRowsByMagnitude(
  rows: ParsedRow[],
): { rows: ChartRow[]; hasRightAxis: boolean } {
  const orderOf = (row: ParsedRow): number => {
    const magnitude = Math.max(Math.abs(row.before), Math.abs(row.after))
    if (magnitude === 0) return 0
    return Math.floor(Math.log10(magnitude))
  }

  const orders = rows.map(orderOf)
  const distinctOrders = Array.from(new Set(orders)).sort((a, b) => a - b)

  let splitOrder = Number.POSITIVE_INFINITY // every order <= splitOrder -> left
  if (distinctOrders.length > 1) {
    let largestGap = -Infinity
    let gapSplit = distinctOrders[0]
    for (let i = 1; i < distinctOrders.length; i++) {
      const gap = distinctOrders[i] - distinctOrders[i - 1]
      if (gap > largestGap) {
        largestGap = gap
        gapSplit = distinctOrders[i - 1]
      }
    }
    splitOrder = gapSplit
  }

  const hasRightAxis = distinctOrders.length > 1

  const chartRows: ChartRow[] = rows.map((row, i) => {
    const isLeft = orders[i] <= splitOrder
    return isLeft
      ? { label: row.label, beforeLeft: row.before, afterLeft: row.after }
      : { label: row.label, beforeRight: row.before, afterRight: row.after }
  })

  return { rows: chartRows, hasRightAxis }
}

const chartConfig = {
  beforeLeft: {
    label: 'Before',
    color: 'var(--chart-2)',
  },
  afterLeft: {
    label: 'After',
    color: 'var(--chart-1)',
  },
  beforeRight: {
    label: 'Before',
    color: 'var(--chart-2)',
  },
  afterRight: {
    label: 'After',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

export function CaseStudyResultsChart({
  metrics,
  copy,
}: {
  metrics: Metric[] | null | undefined
  copy: { before: string; after: string }
}) {
  const parsedRows = buildChartRows(metrics ?? [])

  if (parsedRows.length === 0) {
    return null
  }

  const { rows, hasRightAxis } = bucketRowsByMagnitude(parsedRows)

  const config: ChartConfig = {
    ...chartConfig,
    beforeLeft: { ...chartConfig.beforeLeft, label: copy.before },
    afterLeft: { ...chartConfig.afterLeft, label: copy.after },
    beforeRight: { ...chartConfig.beforeRight, label: copy.before },
    afterRight: { ...chartConfig.afterRight, label: copy.after },
  }

  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full sm:h-72">
      <BarChart data={rows} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="4 4" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 11 }}
          interval={0}
          height={40}
        />
        <YAxis
          yAxisId="left"
          orientation="left"
          tickLine={false}
          axisLine={false}
          width={40}
          tick={{ fontSize: 11 }}
        />
        {hasRightAxis && (
          <YAxis
            yAxisId="right"
            orientation="right"
            tickLine={false}
            axisLine={false}
            width={40}
            tick={{ fontSize: 11 }}
          />
        )}
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="beforeLeft" yAxisId="left" fill="var(--color-beforeLeft)" radius={4} />
        <Bar dataKey="afterLeft" yAxisId="left" fill="var(--color-afterLeft)" radius={4} />
        {hasRightAxis && (
          <>
            <Bar dataKey="beforeRight" yAxisId="right" fill="var(--color-beforeRight)" radius={4} />
            <Bar dataKey="afterRight" yAxisId="right" fill="var(--color-afterRight)" radius={4} />
          </>
        )}
      </BarChart>
    </ChartContainer>
  )
}
