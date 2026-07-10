import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    // Intentionally no shadow/motion-token surface: animate-pulse is a
    // tailwindcss-animate keyframe utility, not part of the --motion-*
    // transition-duration family, and this primitive has no bare `shadow`.
    <div
      className={cn("animate-pulse rounded-md bg-primary/10", className)}
      {...props}
    />
  )
}

export { Skeleton }
