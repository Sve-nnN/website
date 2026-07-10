import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { Link2, Code2, AtSign, Globe } from 'lucide-react'

import type { Author } from '@/payload-types'

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Prose } from '@/components/Prose'

// Same generic icon substitutes as SiteFooter/ContactFormBlock — lucide-react
// ships no brand icons.
const socialIconMap = {
  linkedin: Link2,
  github: Code2,
  x: AtSign,
  website: Globe,
}

/**
 * Expanded E-E-A-T card — CONTEXT.md's explicit competitive differentiator
 * (CONT-02). Renders every available Authors field conditionally per-field;
 * never omits the section entirely just because one field is sparse.
 */
export async function AuthorCard({ author }: { author: Author }) {
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
          <Link href={`/authors/${author.slug}`} className="font-heading text-heading hover:text-primary">
            {author.name}
          </Link>
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
            <Badge key={i} variant="secondary">
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
          {author.socialLinks.map((social, i) => {
            const Icon = socialIconMap[social.platform] ?? Globe
            return (
              <a
                key={i}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.platform}
                className="text-muted-foreground transition-colors duration-fast hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:shadow-focus"
              >
                <Icon className="size-5" />
              </a>
            )
          })}
        </div>
      )}
    </Card>
  )
}
