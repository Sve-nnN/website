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
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
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
    <header className="sticky top-0 z-50 bg-secondary text-secondary-foreground shadow-md border-b border-border/20 transition-shadow duration-base ease-standard">
      <Container className="flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2">
          {logo?.url ? (
            <Image src={logo.url} alt={logo.alt ?? 'Logo'} width={40} height={40} />
          ) : (
            <span className="font-heading text-heading">Juan Carlos Angulo</span>
          )}
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <NavigationMenu>
            <NavigationMenuList>
              {header.navItems?.map((item, i) => (
                <NavigationMenuItem key={item.id ?? i}>
                  <NavigationMenuLink asChild>
                    <CMSLink
                      {...item.link}
                      className="relative pb-1 border-b-2 border-transparent hover:border-primary hover:text-primary focus-visible:border-primary focus-visible:text-primary transition-colors duration-fast ease-out text-body"
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
            <Button variant="outline" size="icon" aria-label="Menu" className="size-10">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle className="sr-only">Navigation menu</SheetTitle>
            <nav className="flex flex-col mt-8">
              <div className="flex flex-col gap-1">
                {header.navItems?.map((item, i) => (
                  <CMSLink
                    key={item.id ?? i}
                    {...item.link}
                    className="font-heading rounded-md px-3 py-3 min-h-11 flex items-center border-b-2 border-transparent hover:border-primary hover:bg-muted focus-visible:border-primary focus-visible:bg-muted transition-colors duration-fast ease-out text-body"
                  />
                ))}
              </div>

              <Separator className="opacity-30 my-6" />

              <div className="flex flex-col gap-4 px-3">
                <LocaleSwitcher currentLocale={locale} />
                {header.ctaButton?.label && (
                  <Button asChild>
                    <Link href={header.ctaButton.href ?? '/contact'}>{header.ctaButton.label}</Link>
                  </Button>
                )}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </Container>
    </header>
  )
}
