import { serverSupabaseServiceRole } from '#supabase/server'
export default defineEventHandler(async (event) => {
  const db = await serverSupabaseServiceRole(event)
  const { data } = await db.from('accounts').select('platform, handle, scope, expires_at, updated_at').eq('platform','x').maybeSingle()
  return { connected: !!data, account: data || null }
})
