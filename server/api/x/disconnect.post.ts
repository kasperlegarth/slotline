// server/api/x/disconnect.post.ts
import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const db = await serverSupabaseServiceRole(event)
  const { error } = await db.from('accounts').delete().eq('platform', 'x')
  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
  return { ok: true }
})
