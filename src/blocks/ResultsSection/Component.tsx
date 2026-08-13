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

  // POLISH: on the `primary` background the stats were `text-primary` — ember
  // on ember, i.e. invisible. That variant already sets
  // `text-primary-foreground` on the section, so the numbers just inherit it
  // there; on the light variants they take the AA-safe ember (4.61:1, where
  // plain `--primary` is 3.15:1).
  const onEmber = backgroundColor === 'primary'

  return (
    <section className={cn('py-16', backgroundMap[backgroundColor ?? 'gray'])}>
      <Container>
        <h2 className="font-heading text-heading">{title}</h2>
        {description && <p className="mt-2 text-body max-w-2xl">{description}</p>}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-12">
          {stats?.map((stat, i) => (
            <div key={stat.id ?? i}>
              {/* KPI numbers reuse Display size at Heading weight, in the accent color, per UI-SPEC.
                  POLISH: the face is Khand, not Array. Array is the h1 voice —
                  a stat is a label with a number, not a title — and Array ships
                  only weight 400, so asking it for 600 made the browser
                  synthesise the bold. Khand has a real 600. Same correction
                  already applied to the case study KPI cards. */}
              <p
                className={cn(
                  'font-heading text-display font-semibold tracking-tight tabular-nums',
                  !onEmber && 'text-primary-text',
                )}
              >
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
