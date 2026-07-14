import { cva } from "class-variance-authority"

// MAINTAINABILITY (only-export-components): moved out of button.tsx -- a
// file that exports a component must only export components, or Fast
// Refresh loses local state on every edit. No logic change from the original.
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,background-color,box-shadow,transform] duration-fast ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:shadow-focus disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md",
        // POLISH (35): see badge-variants.ts for the full rationale —
        // `text-destructive-foreground` isn't a real Tailwind utility here
        // (no `.foreground` sub-key defined for `destructive` in
        // tailwind.config.ts), so it rendered as inherited text. The .pen's
        // Button/Destructive node confirms dark text (#12141C) is intended,
        // which is exactly the existing `--primary-foreground` token.
        destructive:
          "bg-destructive text-primary-foreground shadow-sm hover:bg-destructive/90 hover:shadow-md",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
