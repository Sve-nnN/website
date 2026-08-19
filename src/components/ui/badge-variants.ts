import { cva } from "class-variance-authority"

// MAINTAINABILITY (only-export-components): moved out of badge.tsx -- a file
// that exports a component must only export components, or Fast Refresh
// loses local state on every edit. No logic change from the original.
export const badgeVariants = cva(
  // POLISH (35, .pen Badge/*): rounded-sm (4px) matches the .pen's tighter
  // badge corner radius — badges intentionally read sharper than buttons/cards.
  "inline-flex items-center rounded-sm border px-2.5 py-0.5 text-xs font-semibold transition-colors duration-fast ease-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        // POLISH (35): `text-destructive-foreground` is not a real Tailwind
        // utility — tailwind.config.ts only maps `destructive` to a flat
        // `var(--destructive)`, with no `.foreground` sub-key (unlike
        // primary/secondary/muted/accent, which all define one). The class
        // silently compiled to nothing, leaving inherited (dark) text. The
        // .pen's Badge/Default node confirms dark text (#12141C) is the
        // intended look on the destructive red — exactly what the existing
        // `--primary-foreground` token already resolves to (#12141C in both
        // light and dark themes), so reuse it instead of inventing a new
        // `--destructive-foreground` variable.
        destructive:
          "border-transparent bg-destructive text-primary-foreground shadow-sm hover:bg-destructive/80",
        outline: "text-foreground",
        // The chip that survives the navy hero band. `secondary` is navy on
        // navy there — it renders, it is simply invisible — and `default`
        // would spend the ember on a category label, which the One Signal
        // Rule reserves for the page's single decision. This is a tinted
        // outline of the band's own foreground: 1px border at 30%, a 10% wash
        // behind it, paper text at full strength (14.6:1 on #12141C).
        onDark:
          "border-secondary-foreground/30 bg-secondary-foreground/10 text-secondary-foreground hover:bg-secondary-foreground/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
