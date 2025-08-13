// Nuxt server route: returnerer pre-signed upload-URLs til Supabase Storage
// Forudsætning: bucket "slotline-media" findes. Sørg for at policies tillader createSignedUploadUrl
import { z } from 'zod'
import { serverSupabaseServiceRole } from '#supabase/server'

const BodySchema = z.object({
  files: z.array(z.object({
    name: z.string().min(1),
    mime: z.string().min(1),
    size: z.number().nonnegative()
  })).min(1)
})

export default defineEventHandler(async (event) => {
  const db = await serverSupabaseServiceRole(event)
  const body = await readBody(event)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload' })
  }

  const uploads: { id: string; path: string; url: string }[] = []
  for (const f of parsed.data.files) {
    const id = crypto.randomUUID()
    const safeName = f.name.replace(/[^\w.\-]/g, '_')
    const path = `media/${id}-${safeName}`

    // Kræver supabase-js v2.43+ (createSignedUploadUrl)
    // NB: kræver at RLS/policies tillader presign, ellers brug service key i en server-side client.
    // @ts-ignore - type findes i v2
    const { data, error } = await db.storage.from('slotline-media').createSignedUploadUrl(path)
    if (error) throw createError({ statusCode: 500, statusMessage: error.message })

    uploads.push({ id, path, url: data.signedUrl })
  }

  return { uploads }
})
