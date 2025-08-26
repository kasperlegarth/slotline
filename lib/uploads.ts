export type PresignIn = { name: string; mime: string; size: number }
export type PresignedOut = { id: string; path: string; url: string }
export type UploadedMedia = { id: string; path: string; mime: string; size: number }

export async function presignMedia(files: File[]): Promise<PresignedOut[]> {
  const payload: { files: PresignIn[] } = {
    files: files.map(f => ({ name: f.name, mime: f.type || 'application/octet-stream', size: f.size }))
  }
  const res = await fetch('/api/media.presign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  if (!res.ok) throw new Error('Presign failed')
  const json = await res.json()
  return json.uploads as PresignedOut[]
}

export async function putToSignedUrls(files: File[], presigned: PresignedOut[]): Promise<UploadedMedia[]> {
  if (files.length !== presigned.length) throw new Error('Mismatch files/presigned')
  const out: UploadedMedia[] = []
  for (let i = 0; i < files.length; i++) {
    const f = files[i]
    const p = presigned[i]
    const put = await fetch(p.url, { method: 'PUT', headers: { 'Content-Type': f.type || 'application/octet-stream' }, body: f })
    if (!put.ok) throw new Error('Upload failed: ' + (await put.text()))
    out.push({ id: p.id, path: p.path, mime: f.type || 'application/octet-stream', size: f.size })
  }
  return out
}

/**
 * Flad ud alle billeder fra tweets i rækkefølge, presign+upload, og map tilbage til tweets.
 * Returnerer tweets payload: [{ text, media: UploadedMedia[] }]
 */
export async function buildTweetsWithUploadedMedia(tweets: { text: string; images: File[] }[]) {
  // Flatten
  const allFiles: File[] = []
  const indexSpans: { start: number; count: number }[] = []
  for (const t of tweets) {
    const start = allFiles.length
    allFiles.push(...t.images)
    indexSpans.push({ start, count: t.images.length })
  }

  let uploaded: UploadedMedia[] = []
  if (allFiles.length) {
    const presigned = await presignMedia(allFiles)
    uploaded = await putToSignedUrls(allFiles, presigned)
  }

  // Map back
  const tweetsOut = tweets.map((t, idx) => {
    const span = indexSpans[idx]
    const media = uploaded.slice(span?.start, span.start + span.count)
    return { text: t.text, media }
  })

  return tweetsOut
}

export async function createPost(payload: {
  kind: 'draft' | 'queue',
  scheduleEnabled: boolean,
  scheduledAtUTC: string | null,
  platform: 'x',
  tweets: { text: string, media: UploadedMedia[] }[]
}) {
  const res = await fetch('/api/posts.create', {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error(await res.text())
  return await res.json()
}
