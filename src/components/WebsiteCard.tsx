import Link from 'next/link'

import type { Website } from '@/payload-types'

import { Card, CardContent } from '@/components/ui/card'

export function WebsiteCard({ website }: { website: Website }) {
  const client = typeof website.client === 'object' ? website.client : null

  return (
    <Link href={`/websites/${website.slug}`} className="group block">
      <Card>
        <CardContent className="p-6">
          {client && <p className="text-label text-muted-foreground">{client.name}</p>}
          <h3 className="font-heading text-heading mt-1">{website.title}</h3>
          {website.industry && <p className="mt-1 text-body text-muted-foreground">{website.industry}</p>}
          {website.lighthouse?.performance != null && (
            <p className="mt-4 font-heading text-heading font-semibold text-primary-text">
              {`${website.lighthouse.performance} Performance`}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
