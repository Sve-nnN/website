import Link from 'next/link'

import type { CaseStudyCardData } from '@/lib/cache'

import { Card, CardContent } from '@/components/ui/card'

export function CaseStudyCard({ caseStudy }: { caseStudy: CaseStudyCardData }) {
  const client = typeof caseStudy.client === 'object' ? caseStudy.client : null

  return (
    // POLISH: the grid item (this link) stretched to the row height but the
    // Card inside did not follow — measured 300/290/266px inside three 300px
    // links on the first row, so the bottom edges never lined up. Also adds
    // the focus ring: these cards were keyboard-focusable with no visible
    // indication at all (`outline: none`, `box-shadow: none` when focused).
    <Link
      href={`/case-studies/${caseStudy.slug}`}
      className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:shadow-focus"
    >
      <Card className="h-full">
        <CardContent className="p-6">
          {client && <p className="text-label text-muted-foreground">{client.name}</p>}
          <h3 className="font-heading text-heading mt-1">{caseStudy.title}</h3>
          {caseStudy.sector && <p className="mt-1 text-body text-muted-foreground">{caseStudy.sector}</p>}
          {caseStudy.heroMetric && (
            <p className="mt-4 font-heading text-heading font-semibold text-primary-text">
              {caseStudy.heroMetric}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
