import Link from 'next/link'

import type { CaseStudy } from '@/payload-types'

import { Card, CardContent } from '@/components/ui/card'

export function CaseStudyCard({ caseStudy }: { caseStudy: CaseStudy }) {
  const client = typeof caseStudy.client === 'object' ? caseStudy.client : null

  return (
    <Link href={`/case-studies/${caseStudy.slug}`} className="group block">
      <Card>
        <CardContent className="p-6">
          {client && <p className="text-label text-muted-foreground">{client.name}</p>}
          <h3 className="font-heading text-heading mt-1">{caseStudy.title}</h3>
          {caseStudy.sector && <p className="mt-1 text-body text-muted-foreground">{caseStudy.sector}</p>}
          {caseStudy.heroMetric && (
            <p className="mt-4 font-heading text-heading font-semibold text-primary">
              {caseStudy.heroMetric}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
