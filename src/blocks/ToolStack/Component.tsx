import type { ToolStackBlock as ToolStackBlockProps } from '@/payload-types'

import { Container } from '@/components/Container'
import { Prose } from '@/components/Prose'
import { AffiliateDisclosureFrame } from '@/components/AffiliateDisclosureFrame'
import { ToolCard } from '@/components/ToolCard'

/**
 * Server component de la página `/stack`. Task 1 (tracer) de 48-01-PLAN.md
 * prueba la arquitectura completa con UN solo tool real (DinoRANK) — el
 * componente ya soporta N grupos/tools sin cambios futuros. Gear/callouts
 * quedan como TODO explícitos: Task 2 de este mismo plan los agrega.
 */
export async function ToolStackComponent({
  intro,
  categoryGroups,
  // gearIntro, gearItems, elegiriaHoy, noCommissionPick: wireados en Task 2.
  locale,
}: ToolStackBlockProps & { locale?: 'es' | 'en' }) {
  return (
    <Container className="py-16">
      {intro && (
        <Prose>
          <p>{intro}</p>
        </Prose>
      )}

      {/* SIEMPRE hasAmazonLinks=true en /stack — el Gear siempre está presente. */}
      <div className="mt-8">
        <AffiliateDisclosureFrame hasAmazonLinks locale={locale} />
      </div>

      {(categoryGroups ?? []).map((group, i) => {
        const tools = group.tools ?? []
        if (tools.length === 0) return null

        return (
          <div key={group.id ?? i} className="mt-12">
            <h2 className="font-heading text-heading">{group.heading}</h2>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              {tools.map((tool, j) => (
                <ToolCard key={tool.id ?? j} tool={tool} locale={locale} />
              ))}
            </div>
          </div>
        )
      })}

      {/* TODO (Task 2 de este mismo plan, 48-01-PLAN.md): Gear grid
          (GearCard) a partir de gearItems. */}

      {/* TODO (Task 2 de este mismo plan, 48-01-PLAN.md): StackHighlightCallout
          instancia 1 ("elegiría hoy") a partir de elegiriaHoy. */}

      {/* TODO (Task 2 de este mismo plan, 48-01-PLAN.md): StackHighlightCallout
          instancia 2 (no-commission pick) a partir de noCommissionPick
          resuelto, con badge + gscHref cuando program === 'google-search-console'. */}
    </Container>
  )
}
