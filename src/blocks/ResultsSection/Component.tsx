import type { ResultsSectionBlock as ResultsSectionBlockProps } from '@/payload-types'

import { Container } from '@/components/Container'
import { cn } from '@/lib/utils'

const backgroundMap: Record<string, string> = {
  gray: 'bg-muted',
  white: 'bg-background',
  primary: 'bg-primary text-primary-foreground',
}

export function ResultsSectionComponent(props: ResultsSectionBlockProps) {
  const { title, description, stats, backgroundColor } = props

  return (
    <section className={cn('py-16', backgroundMap[backgroundColor ?? 'gray'])}>
      <Container>
        <h2 className="font-heading text-heading">{title}</h2>
        {description && <p className="mt-2 text-body max-w-2xl">{description}</p>}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-12">
          {stats?.map((stat, i) => (
            <div key={i}>
              {/* KPI numbers reuse Display size at Heading weight, in the accent color, per UI-SPEC */}
              <p className="text-display font-display font-semibold text-primary tracking-tight tabular-nums">
                {stat.value}
              </p>
              <p className="mt-1 text-label uppercase tracking-wide opacity-70">{stat.label}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
