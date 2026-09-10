import type { Access } from 'payload'

export const authenticatedOrActive: Access = ({ req: { user } }) => {
  if (user) return true
  return { active: { equals: true } }
}
