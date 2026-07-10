import Link from 'next/link'

import type { CaseStudy } from '@/payload-types'

export function CaseStudyCard({ caseStudy }: { caseStudy: CaseStudy }) {
  const client = typeof caseStudy.client === 'object' ? caseStudy.client : null

  return (
    <Link
      href={`/case-studies/${caseStudy.slug}`}
      className="group block rounded-lg border border-border overflow-hidden bg-card hover:shadow-md transition-shadow p-6"
    >
      {client && <p className="text-label text-muted-foreground">{client.name}</p>}
      <h3 className="font-display text-heading mt-1">{caseStudy.title}</h3>
      {caseStudy.sector && <p className="mt-1 text-body text-muted-foreground">{caseStudy.sector}</p>}
      {caseStudy.heroMetric && (
        <p className="mt-4 font-display text-heading font-semibold text-primary">
          {caseStudy.heroMetric}
        </p>
      )}
    </Link>
  )
}
