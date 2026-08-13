'use client'

import { useSyncExternalStore } from 'react'
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

/**
 * POLISH: the scrolled state was tracked with `useState` + a `useEffect`
 * scroll listener, and measured on production it never engaged — after
 * scrolling 600px the header's class list still carried the idle value, so
 * the whole mechanism was inert. `useSyncExternalStore` is the same fix this
 * codebase already applied in HeroGrainGradient for an equivalent problem: it
 * reads the real value during render (with an explicit server snapshot)
 * rather than depending on an effect having run and a state update having
 * landed.
 */
function subscribeToScroll(callback: () => void) {
  window.addEventListener('scroll', callback, { passive: true })
  window.addEventListener('resize', callback, { passive: true })
  return () => {
    window.removeEventListener('scroll', callback)
    window.removeEventListener('resize', callback)
  }
}

function getScrolledSnapshot() {
  return window.scrollY > SCROLL_THRESHOLD
}

function getServerScrolledSnapshot() {
  return false
}

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
  const scrolled = useSyncExternalStore(
    subscribeToScroll,
    getScrolledSnapshot,
    getServerScrolledSnapshot,
  )
  const pathname = usePathname()

  const currentPath = normalizePath(pathname)

  const isActive = (item: NavItem) => {
    const url = item.link?.url
    if (!url) return false
    return normalizePath(url) === currentPath
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-50 text-secondary-foreground transition-[border-color,box-shadow] duration-base ease-standard',
        // FIX (live bug reported by Juan, 2026-07-13): `bg-secondary/95` -
        // Tailwind's opacity slash-modifier doesn't work against a CSS
        // custom property defined as a plain hex string (`--secondary:
        // #12141C`), so the generated color was invalid and the header
        // rendered fully transparent past the scroll threshold, leaving
        // white nav text with nothing behind it. Solid bg-secondary (same
        // as the idle state) at both scroll states — the shadow/blur still
        // differentiate the scrolled state.
        // POLISH: both states used to be `bg-secondary` with only shadow-md vs
        // shadow-lg between them — a difference nobody can see on a navy band,
        // for a state that never engaged anyway. The header now sits flat and
        // borderless while the page is at rest and gains a hairline plus a
        // real shadow once content scrolls under it, which is what the
        // system's own rule asks for: depth is a response, not decoration.
        'bg-secondary',
        scrolled
          ? 'border-b border-border/20 shadow-lg'
          : 'border-b border-transparent shadow-none',
      )}
    >
      <Container className="flex items-center justify-between py-4">
        {/* FIX (26-REVIEW WR-04): was hardcoded to `/` regardless of locale — on
            EN pages that's the ES home, not `/en`. */}
        <Link href={locale === 'en' ? '/en' : '/'} className="flex items-center gap-2">
          {logo?.url ? (
            <Image src={logo.url} alt={logo.alt ?? 'Logo'} width={40} height={40} />
          ) : (
            <span className="font-heading text-heading">Juan Carlos Angulo</span>
          )}
        </Link>

        {/* POLISH: the landmark had no accessible name, and the page exposes
            more than one nav (this, the breadcrumb trail, the footer), so a
            screen-reader user got an unlabelled list of "navigation" regions. */}
        <nav
          aria-label={locale === 'en' ? 'Main' : 'Principal'}
          className="hidden md:flex items-center gap-8"
        >
          <NavigationMenu>
            {/* POLISH: NavigationMenuList's own default is `space-x-1`, i.e. 4px
                between items — measured 4px on production. With Khand's
                condensed letterforms "Casos de éxito Autores Contacto" read as
                one run-on string instead of four destinations. 24px separates
                them without stretching the group past the CTA. */}
            <NavigationMenuList className="space-x-0 gap-6">
              {navItems.map((item, i) => {
                const active = isActive(item)
                return (
                  <NavigationMenuItem key={item.id ?? i}>
                    <NavigationMenuLink asChild>
                      <CMSLink
                        {...item.link}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          // FIX (26-REVIEW WR-01): CMSLink's own default (no-`appearance`)
                          // branch unconditionally applies `text-primary` — without an
                          // explicit text-color class here for BOTH states, twMerge has
                          // nothing to dedupe against and every nav item renders ember
                          // regardless of `active`, making this toggle a no-op.
                          'relative pb-1 border-b-2 border-transparent no-underline text-secondary-foreground hover:border-primary hover:text-primary focus-visible:border-primary focus-visible:text-primary transition-colors duration-fast ease-out text-body',
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
            <SheetTitle className="sr-only">
              {locale === 'en' ? 'Navigation menu' : 'Menú de navegación'}
            </SheetTitle>
            <nav
              aria-label={locale === 'en' ? 'Main' : 'Principal'}
              className="flex flex-col mt-8"
            >
              <div className="flex flex-col gap-1">
                {navItems.map((item, i) => {
                  const active = isActive(item)
                  return (
                    <CMSLink
                      key={item.id ?? i}
                      {...item.link}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        // FIX (26-REVIEW WR-01): see desktop nav comment above — same
                        // twMerge-dedup requirement applies to the mobile Sheet nav.
                        // POLISH: the active state was a 2px bottom border on a
                        // 6px-rounded row with a background — the straight rule
                        // cut across the rounded corners. In a stacked sheet a
                        // filled row already reads as "you are here", so the
                        // state is carried by surface and text colour instead.
                        // `primary-text` (4.61:1), not `primary` (3.15:1),
                        // because this sits on the light sheet surface.
                        'font-heading rounded-md px-3 py-3 min-h-11 flex items-center no-underline text-foreground hover:bg-muted focus-visible:outline-none focus-visible:bg-muted focus-visible:ring-1 focus-visible:ring-ring focus-visible:shadow-focus transition-colors duration-fast ease-out text-body',
                        active && 'bg-muted text-primary-text font-semibold',
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
