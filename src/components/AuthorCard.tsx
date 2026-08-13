import { getLocale } from 'next-intl/server'

import { Link } from '@/i18n/navigation'

import type { Author } from '@/payload-types'

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Prose } from '@/components/Prose'
import { SocialIcon, socialLabels } from '@/components/SocialIcon'

/**
 * Expanded E-E-A-T card — CONTEXT.md's explicit competitive differentiator
 * (CONT-02). Renders every available Authors field conditionally per-field;
 * never omits the section entirely just because one field is sparse.
 */
export async function AuthorCard({
  author,
  asPageHeading = false,
}: {
  author: Author
  asPageHeading?: boolean
}) {
  const avatar = typeof author.avatar === 'object' ? author.avatar : null
  const locale = await getLocale()

  const yearsLabel =
    author.yearsExperience != null
      ? locale === 'es'
        ? `${author.yearsExperience}+ años de experiencia`
        : `${author.yearsExperience}+ years of experience`
      : null

  return (
    <Card className="p-8">
      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          {avatar?.url && <AvatarImage src={avatar.url} alt={avatar.alt ?? author.name} />}
          <AvatarFallback>{author.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          {asPageHeading ? (
            <h1 className="font-heading text-heading">
              <Link href={`/authors/${author.slug}`} className="hover:text-primary">
                {author.name}
              </Link>
            </h1>
          ) : (
            <Link href={`/authors/${author.slug}`} className="font-heading text-heading hover:text-primary">
              {author.name}
            </Link>
          )}
          {author.jobTitle && <p className="text-body text-muted-foreground">{author.jobTitle}</p>}
        </div>
      </div>

      {author.bio && (
        <div className="mt-4">
          <Prose>
            <p>{author.bio}</p>
          </Prose>
        </div>
      )}

      {author.credentials && author.credentials.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {author.credentials.map((c, i) => (
            <Badge key={c.id ?? i} variant="secondary">
              {c.label}
            </Badge>
          ))}
        </div>
      )}

      {yearsLabel && (
        <p className="mt-4 font-heading text-heading font-semibold tracking-tight text-primary">{yearsLabel}</p>
      )}

      {author.socialLinks && author.socialLinks.length > 0 && (
        <div className="mt-4 flex gap-3">
          {/* POLISH: measured 20x20px on production — under WCAG 2.2 AA's
              24x24 target minimum (2.5.8) for an isolated control. The icon
              keeps its 20px optical size inside a 40px target. Icons and
              labels now come from the shared SocialIcon module, so this row
              shows the same brand marks the footer does instead of the old
              chain-link/angle-bracket stand-ins. */}
          {author.socialLinks.map((social, i) => (
            <a
              key={social.id ?? i}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={socialLabels[social.platform] ?? social.platform}
              className="inline-flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors duration-fast ease-out hover:text-primary-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:shadow-focus"
            >
              <SocialIcon platform={social.platform} className="size-5" />
            </a>
          ))}
        </div>
      )}
    </Card>
  )
}
