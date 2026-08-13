import type { CaseStudy } from '@/payload-types'

type Metric = NonNullable<NonNullable<CaseStudy['results']>['metrics']>[number]

/**
 * Extracts the leading numeric value from a free-text metric string so it
 * can be plotted, e.g. "12,485" -> 12485, "$41K" -> 41000, "88" -> 88,
 * "3,782ms" -> 3782 (unit suffixes like "ms"/"%" don't scale the number,
 * only bare "k"/"m" magnitude suffixes do). Returns null when nothing
 * numeric can be found (e.g. "—"), so the caller can skip that metric.
 */
export function parseLeadingNumber(raw: string | null | undefined): number | null {
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

/**
 * Percentage change from `before` to `after`, rounded to a whole number.
 * Returns null when the baseline is zero (no meaningful ratio) so the caller
 * can omit the delta rather than print an infinity.
 */
export function percentChange(before: number, after: number): number | null {
  if (before === 0) return null
  return Math.round(((after - before) / Math.abs(before)) * 100)
}

type Row = {
  label: string
  beforeRaw: string
  afterRaw: string
  before: number
  after: number
}

function buildRows(metrics: Metric[]): Row[] {
  const rows: Row[] = []
  for (const metric of metrics) {
    const before = parseLeadingNumber(metric.before)
    const after = parseLeadingNumber(metric.after)
    if (before === null || after === null) continue
    rows.push({
      label: metric.label,
      beforeRaw: metric.before ?? String(before),
      afterRaw: metric.after ?? String(after),
      before,
      after,
    })
  }
  return rows
}

/**
 * Before/after comparison, one self-scaled pair of bars per metric.
 *
 * REWRITE: the previous version plotted every metric as grouped recharts bars
 * across a shared (and, when magnitudes differed, dual) Y axis. Measured on
 * production, that chart did not represent its data at all — bars rendered
 * between 0px and 5px tall inside a 232px plot area, where traffic
 * (82,000 -> 138,000) should have filled almost the full height. The four
 * partial series (`beforeLeft`/`afterLeft`/`beforeRight`/`afterRight`, each
 * `undefined` on the rows belonging to the other axis) fed the axes a domain
 * the bars were not drawn against.
 *
 * Rather than repair a dual-axis grouped chart — which is hard to read even
 * when it works, since nothing tells the reader which bar belongs to which
 * axis — each metric now gets its own scale. Three independent before/after
 * comparisons are what the content actually is, so the mixed-scale problem
 * stops existing instead of being mitigated.
 *
 * No recharts, no client component: two divs and a width percentage render
 * this correctly on the server, which also drops a heavy charting bundle from
 * a page whose whole argument is technical performance. Every value is real
 * text in the DOM, so screen readers and search engines read the comparison
 * without needing the bars; the bars themselves are decorative.
 */
export function CaseStudyResultsChart({
  metrics,
  copy,
}: {
  metrics: Metric[] | null | undefined
  copy: { before: string; after: string }
}) {
  const rows = buildRows(metrics ?? [])

  if (rows.length === 0) {
    return null
  }

  return (
    <ul className="space-y-8">
      {rows.map((row, i) => {
        // Each metric owns its scale: the larger of the two values is the
        // full-width bar, so a 4.2s -> 1.6s improvement is as readable as an
        // 82K -> 138K one. A floor of 2% keeps a near-zero value from
        // rendering as an invisible sliver.
        const peak = Math.max(row.before, row.after, 0)
        const widthOf = (value: number) =>
          peak === 0 ? 0 : Math.max(2, Math.round((value / peak) * 100))
        const delta = percentChange(row.before, row.after)

        return (
          <li key={row.label + i}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="text-label uppercase tracking-wide text-muted-foreground">
                {row.label}
              </p>
              {delta !== null && (
                // Deliberately uncoloured: whether a drop is good depends on
                // the metric (a lower LCP is a win, lower traffic is not), and
                // nothing in the data says which. The number states the change
                // and lets the surrounding copy carry the meaning.
                <p className="text-label text-muted-foreground tabular-nums">
                  {delta > 0 ? '+' : ''}
                  {delta}%
                </p>
              )}
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-label text-muted-foreground">{copy.before}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-sm bg-muted" aria-hidden="true">
                  {/* Solid, not tinted: at 40% opacity this bar measured
                      ~1.6:1 against its own track and read as empty rail.
                      Solid `muted-foreground` is ~3.9:1 on `muted`, which
                      clears the 3:1 floor for a non-text graphic. */}
                  <div
                    className="h-full rounded-sm bg-muted-foreground"
                    style={{ width: `${widthOf(row.before)}%` }}
                  />
                </div>
                <span className="w-20 shrink-0 text-right text-body tabular-nums text-muted-foreground">
                  {row.beforeRaw}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-label text-muted-foreground">{copy.after}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-sm bg-muted" aria-hidden="true">
                  <div
                    className="h-full rounded-sm bg-primary"
                    style={{ width: `${widthOf(row.after)}%` }}
                  />
                </div>
                <span className="w-20 shrink-0 text-right font-heading text-body font-semibold tabular-nums text-primary-text">
                  {row.afterRaw}
                </span>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
