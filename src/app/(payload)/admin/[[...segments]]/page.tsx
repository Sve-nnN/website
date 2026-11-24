/* THIS FILE WAS GENERATED FOLLOWING THE OFFICIAL PAYLOAD 3 TEMPLATE. DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import type { Metadata } from 'next'
import config from '@payload-config'
import { generatePageMetadata, RootPage } from '@payloadcms/next/views'
import { notFound } from 'next/navigation'
import { isPreviewReadonly } from '@/lib/preview'
import { importMap } from '../importMap.js'

type Args = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] }>
}

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params, searchParams })

// Fase 53 (WR-03): en el preview de solo lectura el admin responde 404 en runtime,
// aunque el build no haya recibido la bandera y falten los rewrites.
const Page = ({ params, searchParams }: Args) => {
  if (isPreviewReadonly()) notFound()
  return RootPage({ config, params, searchParams, importMap })
}

export default Page
