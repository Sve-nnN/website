import Image from 'next/image'
import Link from 'next/link'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { Container } from '@/components/Container'
import { CMSLink } from '@/components/CMSLink'
import { Button } from '@/components/ui/button'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu } from 'lucide-react'
import { LocaleSwitcher } from '@/components/LocaleSwitcher'

export async function SiteHeader({ locale }: { locale: string }) {
  const payload = await getPayload({ config })

  const header = await payload.findGlobal({
    slug: 'header',
    depth: 1,
    locale: locale as 'en' | 'es',
  })

  const logo = typeof header.logo === 'object' ? header.logo : null

  return (
    <header className="sticky top-0 z-50 bg-secondary text-secondary-foreground shadow-md transition-shadow duration-base ease-standard">
      <Container className="flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2">
          {logo?.url ? (
            <Image src={logo.url} alt={logo.alt ?? 'Logo'} width={40} height={40} />
          ) : (
            <span className="font-display text-heading">Juan Carlos Angulo</span>
          )}
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <NavigationMenu>
            <NavigationMenuList>
              {header.navItems?.map((item, i) => (
                <NavigationMenuItem key={item.id ?? i}>
                  <NavigationMenuLink asChild>
                    <CMSLink
                      {...item.link}
                      className="relative pb-1 border-b-2 border-transparent hover:border-primary focus-visible:border-primary transition-colors duration-fast ease-out text-body"
                    />
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          <LocaleSwitcher currentLocale={locale} />

          {header.ctaButton?.label && (
            <Button asChild>
              <Link href={header.ctaButton.href ?? '/contact'}>{header.ctaButton.label}</Link>
            </Button>
          )}
        </nav>

        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="outline" size="icon" aria-label="Menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <nav className="flex flex-col gap-4 mt-8">
              {header.navItems?.map((item, i) => (
                <CMSLink
                  key={item.id ?? i}
                  {...item.link}
                  className="relative pb-1 w-fit border-b-2 border-transparent hover:border-primary focus-visible:border-primary transition-colors duration-fast ease-out text-body"
                />
              ))}
              <LocaleSwitcher currentLocale={locale} />
              {header.ctaButton?.label && (
                <Button asChild>
                  <Link href={header.ctaButton.href ?? '/contact'}>{header.ctaButton.label}</Link>
                </Button>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </Container>
    </header>
  )
}
