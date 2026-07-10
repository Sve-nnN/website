import type { ElementType, HTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface ContainerProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode
  className?: string
  as?: ElementType
}

/**
 * Shared max-width/padding wrapper used by every page section, per
 * 05-UI-SPEC.md spacing scale (md=16px / lg=24px horizontal padding).
 */
export function Container({ children, className, as: Tag = 'div', ...props }: ContainerProps) {
  return (
    <Tag className={cn('mx-auto w-full max-w-6xl px-4 md:px-6', className)} {...props}>
      {children}
    </Tag>
  )
}
