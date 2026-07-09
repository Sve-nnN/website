import type { AccessArgs } from 'payload'

// TODO: replace `any` with the generated `User` type from `@/payload-types`
// once `payload generate:types` runs (Wave 4) — payload-types.ts does not
// exist yet in this wave.
type isAuthenticated = (args: AccessArgs<any>) => boolean

export const authenticated: isAuthenticated = ({ req: { user } }) => {
  return Boolean(user)
}
