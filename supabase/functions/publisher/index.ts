// deno-lint-ignore-file no-explicit-any
// Supabase Edge Function: henter pending jobs og poster tråde til X
// ENV kræves:
//  - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (edge runtime)
//  - X_CLIENT_ID / X_CLIENT_SECRET (eller et long-lived access token)
//  - X_BASE_URL (valgfri; default https://api.x.com/2 ... når I er klar)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

type PostItem = { id: string; idx: number; text: string; media_ids: string[] }
type MediaRow = { id: string; bucket_path: string; mime: string; size_bytes: number }

export default async function handler(req: Request) {
  try {
    // 1) Find jobs klar til kørsel
    const { data: jobs, error: ej } = await supabase
      .from('publish_jobs')
      .select('id, post_id, run_at, status, attempts')
      .eq('status','pending')
      .lte('run_at', new Date().toISOString())
      .limit(5)
    if (ej) throw ej
    if (!jobs?.length) return new Response('No jobs', { status: 200 })

    for (const job of jobs) {
      try {
        await supabase.from('publish_jobs').update({ status:'running' }).eq('id', job.id)

        const { data: post, error: ep } = await supabase.from('posts').select('*').eq('id', job.post_id).single()
        if (ep) throw ep

        const { data: items, error: ei } = await supabase
          .from('post_items')
          .select('id, idx, text, media_ids')
          .eq('post_id', job.post_id)
          .order('idx', { ascending: true })
        if (ei) throw ei

        // Hent media rows
        const allMediaIds = Array.from(new Set(items.flatMap((i: PostItem) => i.media_ids)))
        let mediaMap = new Map<string, MediaRow>()
        if (allMediaIds.length) {
          const { data: mediaRows, error: em } = await supabase.from('media').select('*').in('id', allMediaIds)
          if (em) throw em
          mediaMap = new Map(mediaRows!.map((m: MediaRow) => [m.id, m]))
        }

        // Hent OAuth konto (forenklet: én konto)
        const { data: acct, error: ea } = await supabase.from('accounts').select('*').eq('platform','x').limit(1).single()
        if (ea) throw ea

        // 2) Upload media til X (chunked) + post tråd
        const uploadedMediaKeysPerItem: string[][] = []
        for (const item of items as PostItem[]) {
          const keys: string[] = []
          for (const mid of item.media_ids) {
            const m = mediaMap.get(mid)
            if (!m) continue
            // Få signed download-url til storage-filen:
            const { data: signed, error: es } = await supabase.storage
              .from('slotline-media')
              .createSignedUrl(m.bucket_path, 60)
            if (es) throw es

            // TODO: Implementér upload til X og få "media_key" tilbage
            const mediaKey = await uploadMediaToX(signed!.signedUrl, m.mime, acct)
            keys.push(mediaKey)
          }
          uploadedMediaKeysPerItem.push(keys)
        }

        // Post første tweet
        let replyId: string | null = null
        for (let i = 0; i < items.length; i++) {
          const item = items[i] as PostItem
          const mediaKeys = uploadedMediaKeysPerItem[i]
          const tweetId = await postTweetToX({ text: item.text, mediaKeys, inReplyTo: replyId }, acct)
          replyId = tweetId
        }

        await supabase.from('posts').update({ status:'published', published_at: new Date().toISOString() }).eq('id', job.post_id)
        await supabase.from('publish_jobs').update({ status:'done' }).eq('id', job.id)
      } catch (err: any) {
        await supabase.from('publish_jobs').update({ status:'error', last_error: String(err?.message || err), attempts: (job.attempts ?? 0) + 1 }).eq('id', job.id)
      }
    }

    return new Response('OK', { status: 200 })
  } catch (err: any) {
    return new Response('ERR ' + String(err?.message || err), { status: 500 })
  }
}

// ---------- X API stubs (implementér rigtigt når I har tokens) ----------
async function uploadMediaToX(signedUrl: string, mime: string, acct: any): Promise<string> {
  // Hent binær fra Storage
  const bin = await fetch(signedUrl).then(r => r.arrayBuffer())

  // TODO: Kald X’s chunked media upload endpoint med acct.access_token
  // Returnér media_key fra X
  // Placeholder:
  await new Promise(r => setTimeout(r, 50))
  return 'media_key_placeholder'
}

async function postTweetToX(opts: { text: string; mediaKeys: string[]; inReplyTo: string | null }, acct: any): Promise<string> {
  // TODO: Kald X POST tweet API, brug opts.inReplyTo til thread
  // Returnér tweet_id
  await new Promise(r => setTimeout(r, 50))
  return crypto.randomUUID()
}

Deno.serve(handler)
