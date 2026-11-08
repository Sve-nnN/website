/* THIS FILE WAS GENERATED FOLLOWING THE OFFICIAL PAYLOAD 3 TEMPLATE. DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@payload-config'
import { GRAPHQL_PLAYGROUND_GET } from '@payloadcms/next/routes'
import { guardPreviewRoute } from '@/lib/preview-guard'

// Fase 53 (WR-03): en el preview de solo lectura el playground responde 404 en runtime.
export const GET = guardPreviewRoute(GRAPHQL_PLAYGROUND_GET(config))
