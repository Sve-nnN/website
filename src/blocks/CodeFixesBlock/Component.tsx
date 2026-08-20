import { ArrowUpRight } from 'lucide-react'

import type { CodeFixesBlock as CodeFixesBlockProps } from '@/payload-types'

import { Container } from '@/components/Container'
import { GrainTexture } from '@/components/GrainTexture'

/**
 * Renders the home page's focal block: real fixes from this public repo,
 * each one as symptom → cause → the actual code → the commit that proves it.
 * See `config.ts` for why this block exists and why the code may only ever be
 * the code that is really in the linked commit.
 *
 * Layout note: these are NOT cards. A row of equal boxes is what the whole
 * category already does with its four feature tiles, and it would flatten
 * three pieces of evidence into decoration. Each fix runs full width in a
 * vertical sequence, separated by a hairline, with the code given the room
 * it needs to be read rather than glanced at. No section numbers either —
 * the order of these fixes carries no meaning the reader needs.
 */
export function CodeFixesBlockComponent(props: CodeFixesBlockProps) {
  const { title, intro, repoUrl, repoLabel, fixes } = props

  if (!fixes || fixes.length === 0) return null

  return (
    <section className="relative overflow-hidden bg-secondary text-secondary-foreground py-12 md:py-16">
      <GrainTexture />
      <Container className="relative z-10">
        <h2 className="font-heading text-heading tracking-tight text-balance">{title}</h2>

        {intro && (
          <p className="mt-4 max-w-[65ch] text-body text-secondary-foreground/85">{intro}</p>
        )}

        {repoUrl && (
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 rounded-sm font-mono text-sm text-secondary-foreground/80 underline-offset-4 transition-colors duration-fast ease-out hover:text-secondary-foreground hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:shadow-focus"
          >
            {repoLabel ?? repoUrl.replace(/^https?:\/\/(www\.)?/, '')}
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>
        )}

        <div className="mt-10 flex flex-col gap-10 md:mt-14 md:gap-14">
          {fixes.map((fix, i) => (
            <article
              key={fix.id ?? `${fix.filePath}-${fix.commitSha}`}
              className={
                i > 0 ? 'border-t border-secondary-foreground/15 pt-10 md:pt-14' : undefined
              }
            >
              <h3 className="font-heading text-heading tracking-tight text-balance max-w-[42ch]">
                {fix.symptom}
              </h3>

              {fix.cause && (
                <p className="mt-3 max-w-[65ch] text-body text-secondary-foreground/80">
                  {fix.cause}
                </p>
              )}

              <figure className="mt-6">
                {/* The file path is the credibility detail: a real path from a
                    real repository, not "example.ts". Monospace here is not a
                    costume for "technical" — it is a file path and a code
                    listing, which is what monospace is for. */}
                <figcaption className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-t-lg border border-secondary-foreground/15 bg-secondary-foreground/[0.06] px-4 py-2">
                  <span className="font-mono text-sm text-secondary-foreground/80 break-all">
                    {fix.filePath}
                  </span>
                  {fix.language && (
                    <span className="font-mono text-sm uppercase text-secondary-foreground/55">
                      {fix.language}
                    </span>
                  )}
                </figcaption>
                {/* `tabIndex` because a scrollable region has to be reachable
                    by keyboard: on a phone this listing scrolls sideways, and
                    without focus a keyboard user cannot pan it. */}
                <pre
                  tabIndex={0}
                  className="overflow-x-auto rounded-b-lg border border-t-0 border-secondary-foreground/15 bg-secondary-foreground/[0.03] p-4 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:shadow-focus"
                >
                  <code className="font-mono text-sm leading-relaxed">{fix.code}</code>
                </pre>
              </figure>

              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                {fix.commitUrl && (
                  <a
                    href={fix.commitUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-sm font-mono text-sm text-secondary-foreground/70 underline-offset-4 transition-colors duration-fast ease-out hover:text-secondary-foreground hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:shadow-focus"
                  >
                    {fix.commitSha ?? 'commit'}
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </a>
                )}
                {/* The ember lands here and nowhere else in this block: one
                    signal per fix, on the thing that changed. */}
                {fix.outcome && (
                  <p className="font-heading text-heading tracking-tight tabular-nums text-primary">
                    {fix.outcome}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  )
}
