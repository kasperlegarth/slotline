// server/api/health.get.ts
import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const db = await serverSupabaseServiceRole(event) // ← vigtigt: giv event med!

  // 1) DB ping
  const { error: dbErr } = await db.from('posts').select('id').limit(1)

  // 2) Storage presign (smoke test)
  const path = `health/${crypto.randomUUID()}.txt`
  // @ts-ignore supabase-js v2 har createSignedUploadUrl
  const { error: stErr } = await db.storage
    .from('slotline-media')
    .createSignedUploadUrl(path)

  return {
    ok: !dbErr && !stErr,
    db: !dbErr,
    storagePresign: !stErr,
  }
})
