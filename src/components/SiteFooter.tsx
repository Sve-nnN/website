import Link from 'next/link'
import { getPayload } from 'payload'
import { Link2, Code2, AtSign, Globe } from 'lucide-react'

import config from '@/payload.config'
import { Container } from '@/components/Container'

// lucide-react ships no brand icons (Linkedin/Github/X removed) — same
// generic substitutes used in ContactFormBlock's icon map (05-04).
const socialIconMap = {
  linkedin: Link2,
  github: Code2,
  x: AtSign,
  website: Globe,
}

export async function SiteFooter({ locale }: { locale: string }) {
  const payload = await getPayload({ config })

  const footer = await payload.findGlobal({
    slug: 'footer',
    depth: 1,
    locale: locale as 'en' | 'es',
  })

  return (
    <footer className="bg-secondary text-secondary-foreground mt-24">
      <Container className="py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {footer.columns?.map((column, i) => (
            <div key={column.id ?? i}>
              {column.title && <h3 className="text-label mb-3">{column.title}</h3>}
              <ul className="space-y-2">
                {column.links?.map((item, j) => (
                  <li key={item.id ?? j}>
                    <Link href={item.link.url ?? '#'} className="text-body opacity-90 hover:opacity-100">
                      {item.link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
          <div className="flex gap-4">
            {footer.socialLinks?.map((social, i) => {
              const Icon = socialIconMap[social.platform] ?? Globe
              return (
                <a
                  key={social.id ?? i}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.platform}
                  className="opacity-80 hover:opacity-100"
                >
                  <Icon className="size-5" />
                </a>
              )
            })}
          </div>

          <div className="flex gap-4 text-label opacity-80">
            {footer.legalLinks?.map((legal, i) => (
              <Link key={legal.id ?? i} href={legal.href}>
                {legal.label}
              </Link>
            ))}
          </div>
        </div>

        {footer.copyrightText && (
          <p className="mt-6 text-label opacity-70">{footer.copyrightText}</p>
        )}
      </Container>
    </footer>
  )
}
