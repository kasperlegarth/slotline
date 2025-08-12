export type TweetDraft = {
  id: string
  text: string | number
  images: File[]
  previews: string[]
  fileInputKey: number
}

export type ThreadDraft = {
  tweets: TweetDraft[]
  scheduleEnabled: boolean
  scheduledAt: string | null // local time from <input type="datetime-local">
}
