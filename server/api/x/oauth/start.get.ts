// OAuth 2.0 PKCE start – sender bruger til x.com/i/oauth2/authorize
const AUTHZ = 'https://x.com/i/oauth2/authorize'

function b64url(buf: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')
}
async function genVerifierAndChallenge() {
  const r = crypto.getRandomValues(new Uint8Array(32))
  const verifier = b64url(r.buffer)
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  const challenge = b64url(digest)
  return { verifier, challenge }
}

export default defineEventHandler(async (event) => {
  const { verifier, challenge } = await genVerifierAndChallenge()
  const state = crypto.randomUUID()

  setCookie(event, 'x_oauth_state', state, { httpOnly:true, sameSite:'lax', path:'/' })
  setCookie(event, 'x_oauth_verifier', verifier, { httpOnly:true, sameSite:'lax', path:'/' })

  const url = new URL(AUTHZ)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', process.env.X_CLIENT_ID!)
  url.searchParams.set('redirect_uri', process.env.X_REDIRECT_URI!)
  url.searchParams.set('scope', (process.env.X_SCOPES||'').split(/\s+/).join(' '))
  url.searchParams.set('state', state)
  url.searchParams.set('code_challenge', challenge)
  url.searchParams.set('code_challenge_method', 'S256')

  return sendRedirect(event, url.toString(), 302)
})
