<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import SchedulingPanel from '@/components/slotline/SchedulingPanel.vue'
import TweetEditor from '@/components/slotline/TweetEditor.vue'
import ThreadPreview from '@/components/slotline/ThreadPreview.vue'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { useObjectUrls } from '@/composables/useObjectUrls'
import { countGraphemes } from '@/composables/useGraphemes'
import { toUTCISOString, formatLocalLabel } from '@/utils/time'
import { ThreadSchema } from '@/schemas/thread'
import type { TweetDraft } from '@/types/slotline'

const MAX_TWEETS = 10
const MAX_IMAGES = 4
const MAX_CHARS = 280

// thread state
const tweets = ref<TweetDraft[]>([
  { id: crypto.randomUUID(), text: '', images: [], previews: [], fileInputKey: 0 }
])

// scheduling state
const schedule = ref<{ enabled: boolean; at: string | null }>({ enabled: false, at: null })

// ui mode
const mode = ref<'editor' | 'preview'>('editor')

// objectURL manager (fælles set, så vi kan rydde alt ét sted)
const { create, revoke, revokeAll } = useObjectUrls()

const totalCharCount = computed(() =>
  tweets.value.reduce((acc, t) => acc + countGraphemes(t.text), 0)
)

function addTweet() {
  if (tweets.value.length >= MAX_TWEETS) return
  tweets.value.push({ id: crypto.randomUUID(), text: '', images: [], previews: [], fileInputKey: 0 })
}

function updateTweet(index: number, v: TweetDraft) {
  tweets.value[index] = v
}

function removeTweet(index: number) {
  // revoke alle previews for den tweet
  tweets.value[index]?.previews.forEach(u => revoke(u))
  tweets.value.splice(index, 1)
  if (tweets.value.length === 0) {
    tweets.value.push({ id: crypto.randomUUID(), text: '', images: [], previews: [], fileInputKey: 0 })
  }
}

onUnmounted(() => {
  revokeAll()
})

function scheduledLabel() {
  if (!schedule.value.enabled || !schedule.value.at) return 'Draft (unscheduled)'
  return 'Scheduled • ' + formatLocalLabel(schedule.value.at)
}

// simple validering med zod (samme schema som backend kan bruge)
function validateThread() {
  const data = {
    tweets: tweets.value.map(t => ({ text: t.text, images: t.images })),
    scheduleEnabled: schedule.value.enabled,
    scheduledAt: schedule.value.at
  }
  const res = ThreadSchema.safeParse(data)
  return res
}

// Submit stubs (klar til at koble på Supabase)
async function save(kind: 'draft' | 'queue') {
  const res = validateThread()
  if (!res.success) {
    console.warn(res.error.flatten())
    alert('Please fix validation issues (text length, images, schedule).')
    return
  }

  const payload = {
    kind,
    scheduleEnabled: schedule.value.enabled,
    scheduledAtUTC: schedule.value.enabled && schedule.value.at
      ? toUTCISOString(schedule.value.at)
      : null,
    tweets: tweets.value.map(t => ({
      text: t.text,
      imagesCount: t.images.length
      // NOTE: Ved rigtig submit -> upload filer til storage og gem refs
    }))
  }

  console.log('SAVE', payload)
  alert(`Saved as ${kind.toUpperCase()} ✅`)
}
</script>

<template>
  <div class="mx-auto max-w-4xl p-6 space-y-6">
    <header class="space-y-1">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-semibold tracking-tight">New Thread</h1>
        <div class="flex items-center gap-2">
          <Button :variant="mode==='editor' ? 'default':'outline'" size="sm" @click="mode='editor'">Editor</Button>
          <Button :variant="mode==='preview' ? 'default':'outline'" size="sm" @click="mode='preview'">Preview</Button>
        </div>
      </div>
      <p class="text-sm text-muted-foreground">
        Compose tweets.
      </p>
      <div class="text-xs text-muted-foreground">
        Total characters: {{ totalCharCount }} • {{ scheduledLabel() }}
      </div>
    </header>

    <Card>
      <CardHeader class="pb-3">
        <CardTitle class="text-base">Scheduling</CardTitle>
      </CardHeader>
      <CardContent>
        <SchedulingPanel v-model="schedule" />
      </CardContent>
      <CardFooter class="text-xs text-muted-foreground">
        If scheduled, the entire thread posts at the chosen time.
      </CardFooter>
    </Card>

    <div v-if="mode==='editor'" class="space-y-4">
      <Card
        v-for="(tweet, index) in tweets"
        :key="tweet.id"
        class="border rounded-2xl"
      >
        <TweetEditor v-if="tweets[index]"
          :tweet="tweets[index]"
          :index="index"
          :limits="{ maxChars: MAX_CHARS, maxImages: MAX_IMAGES }"
          :createObjectUrl="create"
          :revokeObjectUrl="revoke"
          @remove="() => removeTweet(index)"
          @update="(v, idx) => updateTweet(idx, v)"
        />
      </Card>

      <div class="flex items-center justify-between gap-3">
        <Button type="button" variant="secondary" @click="addTweet" :disabled="tweets.length >= MAX_TWEETS">
          Add Tweet
        </Button>
        <div class="flex items-center gap-2">
          <Button type="button" variant="outline" @click="save('draft')">Save Draft</Button>
          <Button type="button" @click="save('queue')">Save to Queue</Button>
        </div>
      </div>
    </div>

    <div v-else>
      <Card class="border rounded-2xl">
        <ThreadPreview :tweets="tweets" :scheduledLabel="scheduledLabel()" :maxChars="MAX_CHARS" :maxImages="MAX_IMAGES" />
        <div class="p-4 flex justify-end gap-2">
          <Button type="button" variant="outline" @click="mode='editor'">Back to Editor</Button>
          <Button type="button" variant="outline" @click="save('draft')">Save Draft</Button>
          <Button type="button" @click="save('queue')">Save to Queue</Button>
        </div>
      </Card>
    </div>
  </div>
</template>
