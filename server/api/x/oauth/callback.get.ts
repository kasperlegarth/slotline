import { serverSupabaseServiceRole } from '#supabase/server'

async function exchangeCode(code: string, verifier: string) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.X_REDIRECT_URI!,
    client_id: process.env.X_CLIENT_ID!,
    code_verifier: verifier
  })

  const headers: Record<string,string> = { 'Content-Type':'application/x-www-form-urlencoded' }
  if (process.env.X_CLIENT_SECRET) {
    // OK for confidential apps; for public apps udelades denne header
    const basic = btoa(`${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`)
    headers.Authorization = `Basic ${basic}`
  }

  const resp = await fetch('https://api.x.com/2/oauth2/token', { method:'POST', headers, body })
  if (!resp.ok) throw new Error(await resp.text())
  return resp.json() as Promise<{
    token_type: 'bearer'
    access_token: string
    refresh_token?: string
    expires_in?: number
    scope?: string
  }>
}

export default defineEventHandler( async (event) => {
  const db = await serverSupabaseServiceRole(event)
  const q = getQuery(event)
  const code = String(q.code||'')
  const state = String(q.state||'')
  const cookieState = getCookie(event,'x_oauth_state')
  const verifier = getCookie(event,'x_oauth_verifier')
  if (!code || !state || state !== cookieState || !verifier) {
    throw createError({ statusCode:400, statusMessage:'Invalid OAuth state' })
  }

  const tok = await exchangeCode(code, verifier)

  // whoami (valgfrit) for handle
  let handle: string | null = null
  try {
    const me = await fetch('https://api.x.com/2/users/me', {
      headers: { Authorization: `Bearer ${tok.access_token}` }
    }).then(r => r.ok ? r.json() : null)
    handle = me?.data?.username ?? null
  } catch {}

  const expires_at = tok.expires_in ? new Date(Date.now() + tok.expires_in*1000).toISOString() : null

  const { error } = await db.from('accounts').upsert({
    platform: 'x',
    handle,
    access_token: tok.access_token,
    refresh_token: tok.refresh_token ?? null,
    expires_at,
    scope: tok.scope ?? null,
    updated_at: new Date().toISOString()
  }, { onConflict: 'platform' })
  if (error) throw createError({ statusCode:500, statusMessage:error.message })

  deleteCookie(event, 'x_oauth_state'); deleteCookie(event,'x_oauth_verifier')
  return sendRedirect(event, '/settings/integrations?x=connected', 302)
})
