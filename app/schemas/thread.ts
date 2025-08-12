import { z } from 'zod'

const FileSchema = import.meta.client ? z.instanceof(File) : z.any()

export const TweetSchema = z.object({
  text: z.string().max(280, 'Max 280 characters'),
  images: z.array(FileSchema).max(4, 'Max 4 images')
})

export const ThreadSchema = z.object({
  tweets: z.array(TweetSchema).min(1, 'Add at least one tweet').max(10, 'Max 10 tweets'),
  scheduleEnabled: z.boolean().default(false),
  scheduledAt: z.string().nullable().optional()
}).superRefine((val, ctx) => {
  if (val.scheduleEnabled) {
    if (!val.scheduledAt) {
      ctx.addIssue({ path: ['scheduledAt'], code: z.ZodIssueCode.custom, message: 'Pick a date & time' })
    } else {
      const dt = new Date(val.scheduledAt)
      if (isNaN(+dt)) {
        ctx.addIssue({ path: ['scheduledAt'], code: z.ZodIssueCode.custom, message: 'Invalid datetime' })
      } else {
        const now = Date.now()
        if (dt.getTime() < now + 2 * 60 * 1000) {
          ctx.addIssue({ path: ['scheduledAt'], code: z.ZodIssueCode.custom, message: 'Time must be at least 2 minutes ahead' })
        }
      }
    }
  }
})
