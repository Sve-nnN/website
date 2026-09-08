#!/usr/bin/env node
/**
 * Sube el PDF generado por `scripts/generate-lead-magnet-pdf.ts` a Cloudinary
 * como recurso privado (`resource_type:'raw', type:'authenticated'` — MAIL-03:
 * nunca `'upload'`, que es público por defecto) y crea o actualiza (idempotente
 * — busca primero por `slug`+`locale`) el doc `lead-magnets` correspondiente.
 *
 * Usage:
 *   node --env-file=.env node_modules/.bin/tsx scripts/upload-lead-magnet.ts es
 *   node --env-file=.env node_modules/.bin/tsx scripts/upload-lead-magnet.ts en
 *
 * Corre después de `generate-lead-magnet-pdf.ts` para el mismo locale — lee
 * el PDF del mismo path fijo que ese script escribió.
 */
import { v2 as cloudinary } from 'cloudinary'
import { getPayload } from 'payload'

import config from '../src/payload.config'
import { leadMagnetPdfPath } from './generate-lead-magnet-pdf'

// Script standalone: no hay garantía de que `src/lib/cloudinary-adapter.ts`
// ya haya corrido en este proceso antes de subir. Se configura acá de forma
// explícita, sin depender del efecto de módulo de otro archivo.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

const SLUG = 'seo-audit-checklist'

const TITLE = {
  es: 'Checklist de auditoría SEO técnica (ES)',
  en: 'Technical SEO Audit Checklist (EN)',
}

const FILE_NAME = {
  es: 'checklist-auditoria-seo-tecnica.pdf',
  en: 'technical-seo-audit-checklist.pdf',
}

async function main() {
  const locale = process.argv[2]

  if (locale !== 'es' && locale !== 'en') {
    console.error('Uso: tsx scripts/upload-lead-magnet.ts <es|en>')
    process.exit(1)
  }

  const filePath = leadMagnetPdfPath(locale)
  const publicId = `lead-magnets/${SLUG}-${locale}`

  console.log(`Subiendo ${filePath} a Cloudinary como ${publicId} (raw/authenticated)...`)

  const uploadResult = await cloudinary.uploader.upload(filePath, {
    resource_type: 'raw',
    type: 'authenticated',
    public_id: publicId,
    overwrite: true,
  })

  console.log(`Subido: ${uploadResult.public_id} (${uploadResult.bytes} bytes)`)

  const payload = await getPayload({ config })

  const { docs: existing } = await payload.find({
    collection: 'lead-magnets',
    where: { and: [{ slug: { equals: SLUG } }, { locale: { equals: locale } }] },
    limit: 1,
  })

  const data = {
    title: TITLE[locale],
    slug: SLUG,
    locale,
    cloudinaryPublicId: uploadResult.public_id,
    fileName: FILE_NAME[locale],
  } as const

  if (existing[0]) {
    await payload.update({ collection: 'lead-magnets', id: existing[0].id, data })
    console.log(`Doc lead-magnets actualizado (id=${existing[0].id}).`)
  } else {
    const created = await payload.create({ collection: 'lead-magnets', data })
    console.log(`Doc lead-magnets creado (id=${created.id}).`)
  }

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
