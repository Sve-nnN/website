/* THIS FILE WAS GENERATED FOLLOWING THE OFFICIAL PAYLOAD 3 TEMPLATE. DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@payload-config'
import '@payloadcms/next/css'
import { REST_DELETE, REST_GET, REST_OPTIONS, REST_PATCH, REST_POST, REST_PUT } from '@payloadcms/next/routes'
import { guardPreviewRoute } from '@/lib/preview-guard'

// Fase 53 (WR-03): en el preview de solo lectura la API responde 404 en runtime.
export const GET = guardPreviewRoute(REST_GET(config))
export const POST = guardPreviewRoute(REST_POST(config))
export const DELETE = guardPreviewRoute(REST_DELETE(config))
export const PATCH = guardPreviewRoute(REST_PATCH(config))
export const PUT = guardPreviewRoute(REST_PUT(config))
export const OPTIONS = guardPreviewRoute(REST_OPTIONS(config))
