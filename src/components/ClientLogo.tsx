'use client'

import { useState } from 'react'
import Image from 'next/image'

/**
 * A client logo that degrades to its own name instead of a broken image icon.
 *
 * WHY — five of the twenty-eight logos in this collection currently 404 at
 * Cloudinary (Miami Herald, Holafly, Arianna Lupi, Florida Top Roofs,
 * Aprendoclub): the records point at asset paths that no longer exist in the
 * account. Re-uploading the files is the actual fix and only Juan can do it,
 * since the artwork is not in this repo.
 *
 * But the wall should never have depended on every remote asset resolving
 * forever. A missing logo used to render as the browser's broken-image glyph
 * with the alt text spilling out of a 48px cell, which on the home page of
 * someone selling technical rigour is the worst possible failure. Falling back
 * to the client's name set in the site's own type reads as deliberate, keeps
 * the grid aligned, and still credits the client.
 */
export function ClientLogo({
  src,
  alt,
  name,
  featured = false,
}: {
  src: string
  alt: string
  name: string
  featured?: boolean
}) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    // The fallback has to carry the same weight as the cell it replaces.
    // Miami Herald is a featured client with no working logo, and at the
    // default body size it read smaller than the logos beside it — the wall
    // said "this one matters less", which is the opposite of what marking it
    // featured means.
    return (
      <span
        className={`font-heading leading-tight text-center text-muted-foreground ${
          featured ? 'text-heading' : 'text-body'
        }`}
      >
        {name}
      </span>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={160}
      height={48}
      onError={() => setFailed(true)}
      className="max-h-full w-auto max-w-full object-contain grayscale opacity-70 transition-all duration-base ease-standard hover:opacity-100 hover:grayscale-0"
    />
  )
}
