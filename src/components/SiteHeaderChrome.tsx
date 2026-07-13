'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

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
import { routing } from '@/i18n/routing'
import { cn } from '@/lib/utils'

type HeaderLink = {
  type?: 'reference' | 'custom' | null
  newTab?: boolean | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reference?: { value: number | { slug?: string | null }; relationTo?: string } | null | any
  url?: string | null
  label?: string | null
}

type NavItem = {
  id?: string | null
  link?: HeaderLink | null
}

type CtaButton = {
  label?: string | null
  href?: string | null
} | null

type Logo = {
  url?: string | null
  alt?: string | null
} | null

const SCROLL_THRESHOLD = 8

/** Strips a known locale prefix and any trailing slash, so route comparisons
 * are locale-agnostic and slash-agnostic (e.g. `/en/services/` -> `/services`). */
function normalizePath(path: string): string {
  const stripped = routing.locales.reduce(
    (acc, locale) => (acc.startsWith(`/${locale}`) ? acc.slice(`/${locale}`.length) || '/' : acc),
    path,
  )
  if (stripped.length > 1 && stripped.endsWith('/')) {
    return stripped.slice(0, -1)
  }
  return stripped
}

/**
 * Client chrome for SiteHeader — owns scroll-state (background/blur/shadow
 * shift past 8px) and active-route matching (usePathname), both of which
 * require the client boundary. SiteHeader itself stays an async Server
 * Component (Local API fetch); this component only renders already-resolved
 * props, mirroring the split already established by LocaleSwitcher.tsx.
 */
export function SiteHeaderChrome({
  navItems,
  ctaButton,
  logo,
  locale,
}: {
  navItems: NavItem[]
  ctaButton: CtaButton
  logo: Logo
  locale: string
}) {
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > SCROLL_THRESHOLD)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const currentPath = normalizePath(pathname)

  const isActive = (item: NavItem) => {
    const url = item.link?.url
    if (!url) return false
    return normalizePath(url) === currentPath
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-50 text-secondary-foreground border-b border-border/20 transition-[background-color,box-shadow] duration-base ease-standard',
        scrolled ? 'bg-secondary/95 backdrop-blur-sm shadow-lg' : 'bg-secondary shadow-md',
      )}
    >
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
              {navItems.map((item, i) => {
                const active = isActive(item)
                return (
                  <NavigationMenuItem key={item.id ?? i}>
                    <NavigationMenuLink asChild>
                      <CMSLink
                        {...item.link}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'relative pb-1 border-b-2 border-transparent hover:border-primary hover:text-primary focus-visible:border-primary focus-visible:text-primary transition-colors duration-fast ease-out text-body',
                          active && 'border-primary text-primary',
                        )}
                      />
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                )
              })}
            </NavigationMenuList>
          </NavigationMenu>

          <LocaleSwitcher currentLocale={locale} />

          {ctaButton?.label && (
            <Button asChild>
              <Link href={ctaButton.href ?? '/contact'}>{ctaButton.label}</Link>
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
                {navItems.map((item, i) => {
                  const active = isActive(item)
                  return (
                    <CMSLink
                      key={item.id ?? i}
                      {...item.link}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'font-heading rounded-md px-3 py-3 min-h-11 flex items-center border-b-2 border-transparent hover:border-primary hover:bg-muted focus-visible:border-primary focus-visible:bg-muted transition-colors duration-fast ease-out text-body',
                        active && 'border-primary text-primary',
                      )}
                    />
                  )
                })}
              </div>

              <Separator className="opacity-30 my-6" />

              <div className="flex flex-col gap-4 px-3">
                <LocaleSwitcher currentLocale={locale} />
                {ctaButton?.label && (
                  <Button asChild>
                    <Link href={ctaButton.href ?? '/contact'}>{ctaButton.label}</Link>
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
