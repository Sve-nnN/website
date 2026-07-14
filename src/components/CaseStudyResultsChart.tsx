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

type ChartRow = {
  label: string
  before: number
  after: number
}

function buildChartRows(metrics: Metric[]): ChartRow[] {
  const rows: ChartRow[] = []
  for (const metric of metrics) {
    const before = parseLeadingNumber(metric.before)
    const after = parseLeadingNumber(metric.after)
    if (before === null || after === null) continue
    rows.push({ label: metric.label, before, after })
  }
  return rows
}

const chartConfig = {
  before: {
    label: 'Before',
    color: 'var(--chart-2)',
  },
  after: {
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
  const rows = buildChartRows(metrics ?? [])

  if (rows.length === 0) {
    return null
  }

  const config: ChartConfig = {
    ...chartConfig,
    before: { ...chartConfig.before, label: copy.before },
    after: { ...chartConfig.after, label: copy.after },
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
        <YAxis tickLine={false} axisLine={false} width={40} tick={{ fontSize: 11 }} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="before" fill="var(--color-before)" radius={4} />
        <Bar dataKey="after" fill="var(--color-after)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
