import Link from 'next/link'

import type { Author } from '@/payload-types'

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

/**
 * Compact byline for post/case-study cards and headers: avatar, name,
 * jobTitle, and (when present) one credential badge as a trust signal.
 * For the full E-E-A-T set see AuthorCard.
 */
export function AuthorByline({ author }: { author: Author }) {
  const avatar = typeof author.avatar === 'object' ? author.avatar : null
  const firstCredential = author.credentials?.[0]

  return (
    <div className="flex items-center gap-3">
      <Avatar>
        {avatar?.url && <AvatarImage src={avatar.url} alt={avatar.alt ?? author.name} />}
        <AvatarFallback>{author.name.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div>
        <Link href={`/authors/${author.slug}`} className="text-label hover:text-primary">
          {author.name}
        </Link>
        {author.jobTitle && <p className="text-label text-muted-foreground">{author.jobTitle}</p>}
      </div>
      {firstCredential && <Badge variant="secondary">{firstCredential.label}</Badge>}
    </div>
  )
}
