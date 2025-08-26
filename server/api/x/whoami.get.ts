import { serverSupabaseServiceRole } from '#supabase/server'
export default defineEventHandler(async (event) => {
  const db = await serverSupabaseServiceRole(event)
  const { data: acct, error } = await db.from('accounts').select('*').eq('platform','x').single()
  if (error || !acct) throw createError({ statusCode: 400, statusMessage: 'Not connected' })
  const r = await fetch('https://api.x.com/2/users/me', {
    headers: { Authorization: `Bearer ${acct.access_token}` }
  })
  const text = await r.text()
  setResponseStatus(event, r.status)
  return { ok: r.ok, status: r.status, body: text, scope: acct.scope }
})
