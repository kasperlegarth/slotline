import { serverSupabaseServiceRole } from '#supabase/server'

// --- token helper: refresh hvis nødvendigt ---
async function ensureUserToken(db: any) {
  const { data: acct, error } = await db.from('accounts').select('*').eq('platform','x').single()
  if (error || !acct) throw createError({ statusCode:400, statusMessage:'X account not connected' })

  const soon = Date.now() + 60_000
  const expTs = acct.expires_at ? Date.parse(acct.expires_at) : null
  if (expTs && expTs > soon) return acct // stadig gyldig

  if (!acct.refresh_token) return acct

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: acct.refresh_token,
    client_id: process.env.X_CLIENT_ID!
  })
  const headers: Record<string,string> = { 'Content-Type': 'application/x-www-form-urlencoded' }
  if (process.env.X_CLIENT_SECRET) {
    const basic = btoa(`${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`)
    headers.Authorization = `Basic ${basic}`
  }

  const resp = await fetch('https://api.x.com/2/oauth2/token', { method:'POST', headers, body })
  if (!resp.ok) throw createError({ statusCode:500, statusMessage:`refresh failed: ${await resp.text()}` })
  const tok = await resp.json() as { access_token:string; refresh_token?:string; expires_in?:number }

  const expires_at = tok.expires_in ? new Date(Date.now() + tok.expires_in*1000).toISOString() : null
  const { data: updated } = await db.from('accounts').update({
    access_token: tok.access_token,
    refresh_token: tok.refresh_token ?? acct.refresh_token,
    expires_at,
    updated_at: new Date().toISOString()
  }).eq('id', acct.id).select('*').single()

  return updated || { ...acct, access_token: tok.access_token, expires_at }
}

// --- v2 media upload (INIT/APPEND/FINALIZE) fra Supabase Storage URL ---
async function uploadMediaV2FromSignedUrl(signedUrl: string, mime: string, accessToken: string): Promise<string> {
  const bin = await fetch(signedUrl).then(r => r.arrayBuffer())
  const total = bin.byteLength

  // INIT
  const initForm = new FormData()
  initForm.set('command','INIT')
  initForm.set('media_type', mime)
  initForm.set('total_bytes', String(total))
  // (valgfrit) initForm.set('media_category','tweet_image') // images/video afhænger af dit input

  let resp = await fetch('https://api.x.com/2/media/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: initForm
  })
  if (!resp.ok) throw new Error(`INIT failed: ${await resp.text()}`)
  const init = await resp.json() as { data: { id: string } }
  const mediaId = init.data.id

  // APPEND chunks á 4MB
  const chunkSize = 4 * 1024 * 1024
  const buf = new Uint8Array(bin)
  let segment = 0
  for (let off = 0; off < total; off += chunkSize) {
    const slice = buf.slice(off, Math.min(off + chunkSize, total))
    const form = new FormData()
    form.set('command', 'APPEND')
    form.set('media_id', mediaId)
    form.set('segment_index', String(segment++))
    form.set('media', new Blob([slice], { type: mime }), 'chunk')

    resp = await fetch('https://api.x.com/2/media/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form
    })
    if (!resp.ok) throw new Error(`APPEND failed: ${await resp.text()}`)
  }

  // FINALIZE
  const finForm = new FormData()
  finForm.set('command','FINALIZE')
  finForm.set('media_id', mediaId)

  resp = await fetch('https://api.x.com/2/media/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: finForm
  })
  if (!resp.ok) throw new Error(`FINALIZE failed: ${await resp.text()}`)
  const fin = await resp.json()

  // Poll STATUS hvis processing_info findes (video/GIF)
  const hasProcessing = fin?.data?.processing_info?.state && fin.data.processing_info.state !== 'succeeded'
  if (hasProcessing) {
    for (let i=0;i<20;i++) {
      await new Promise(r => setTimeout(r, 1500))
      const st = await fetch(`https://api.x.com/2/media/upload?command=STATUS&media_id=${mediaId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      }).then(r => r.json())
      const state = st?.data?.processing_info?.state
      if (state === 'succeeded') break
      if (state === 'failed') throw new Error('Media processing failed')
    }
  }

  return mediaId
}

export default defineEventHandler(async (event) => {
  const db = await serverSupabaseServiceRole(event)
  const body = await readBody(event) as { text: string; mediaIds?: string[] }
  if (!body?.text || typeof body.text !== 'string') {
    throw createError({ statusCode:400, statusMessage:'text required' })
  }

  const acct = await ensureUserToken(db)

  // Upload evt. billeder fra vores egen storage -> X media_id’er
  let media_ids: string[] = []
  if (Array.isArray(body.mediaIds) && body.mediaIds.length) {
    // slå vores media rækker op
    const { data: rows, error } = await db.from('media')
      .select('id, bucket_path, mime')
      .in('id', body.mediaIds)
    if (error) throw createError({ statusCode:500, statusMessage:error.message })

    type MediaRow = { id: string; bucket_path: string; mime: string };
    for (const m of (rows as MediaRow[]) || []) {
      const { data: s, error: es } = await db.storage.from('slotline-media').createSignedUrl(m.bucket_path, 120);
      if (es || !s?.signedUrl) throw createError({ statusCode:500, statusMessage: es?.message || 'sign failed' });
      const mid = await uploadMediaV2FromSignedUrl(s.signedUrl, m.mime, acct.access_token);
      media_ids.push(mid);
    }
  }

  // POST /2/tweets
  const resp = await fetch('https://api.x.com/2/tweets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${acct.access_token}`, 'Content-Type':'application/json' },
    body: JSON.stringify(media_ids.length ? { text: body.text, media: { media_ids } } : { text: body.text })
  })
  if (!resp.ok) {
    return { ok:false, error: await resp.text() }
  }
  const json = await resp.json()
  return { ok: true, tweet: json.data }
})
