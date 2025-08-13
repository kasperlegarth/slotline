// Nuxt server route: opretter post + items, registrerer media, og planlægger publish_job
import { z } from 'zod'
import { serverSupabaseServiceRole } from '#supabase/server'

const MediaSchema = z.object({
  id: z.string().uuid(),
  path: z.string().min(1),
  mime: z.string().min(1),
  size: z.number().nonnegative()
})

const BodySchema = z.object({
  kind: z.enum(['draft','queue']),
  scheduleEnabled: z.boolean(),
  scheduledAtUTC: z.string().nullable().optional(),
  platform: z.literal('x').default('x'),
  tweets: z.array(z.object({
    text: z.string().min(1),
    media: z.array(MediaSchema).default([])
  })).min(1)
})

export default defineEventHandler(async (event) => {
  const db = await serverSupabaseServiceRole(event)
  const body = await readBody(event)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload' })
  }

  const status =
    parsed.data.kind === 'draft'
      ? 'draft'
      : (parsed.data.scheduleEnabled && parsed.data.scheduledAtUTC ? 'scheduled' : 'queued')

  // Insert post
  const { data: post, error: e1 } = await db
    .from('posts')
    .insert({
      status,
      scheduled_at: parsed.data.scheduleEnabled ? parsed.data.scheduledAtUTC : null,
      platform: parsed.data.platform
    })
    .select('*')
    .single()
  if (e1) throw createError({ statusCode: 500, statusMessage: e1.message })

  // Register media (dedupe pr. id)
  const mediaMap = new Map<string, z.infer<typeof MediaSchema>>()
  parsed.data.tweets.forEach(t => t.media.forEach(m => { if (!mediaMap.has(m.id)) mediaMap.set(m.id, m) }))
  const mediaToInsert = Array.from(mediaMap.values()).map(m => ({
    id: m.id,
    bucket_path: m.path,
    mime: m.mime,
    size_bytes: m.size
  }))
  if (mediaToInsert.length) {
    const { error: e2 } = await db.from('media').insert(mediaToInsert)
    if (e2 && !e2.message.includes('duplicate key')) {
      // Ignorér duplicates hvis den allerede findes; ellers fejl
      throw createError({ statusCode: 500, statusMessage: e2.message })
    }
  }

  // Insert post_items
  const items = parsed.data.tweets.map((t, idx) => ({
    post_id: post.id,
    idx,
    text: t.text,
    media_ids: t.media.map(m => m.id)
  }))
  const { error: e3 } = await db.from('post_items').insert(items)
  if (e3) throw createError({ statusCode: 500, statusMessage: e3.message })

  // Create publish_job (kør nu hvis queued; ellers ved scheduled_at)
  const runAt = post.scheduled_at ?? new Date().toISOString()
  const { error: e4 } = await db.from('publish_jobs').insert({
    post_id: post.id,
    run_at: runAt,
    status: 'pending'
  })
  if (e4) throw createError({ statusCode: 500, statusMessage: e4.message })

  return { ok: true, postId: post.id }
})
