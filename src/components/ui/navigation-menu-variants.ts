import { cva } from "class-variance-authority"

// MAINTAINABILITY (only-export-components): moved out of navigation-menu.tsx
// -- a file that exports components must only export components, or Fast
// Refresh loses local state on every edit. No logic change from the original.
export const navigationMenuTriggerStyle = cva(
  "group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-[color,background-color] duration-fast ease-out hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=open]:text-accent-foreground data-[state=open]:bg-accent/50 data-[state=open]:hover:bg-accent data-[state=open]:focus:bg-accent"
)
