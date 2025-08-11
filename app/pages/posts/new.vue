<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useForm, useField } from 'vee-validate'
import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const MAX_CHARS = 280
const MAX_IMAGES = 4

// Zod schema for et tweet
const tweetSchema = z.object({
  text: z.string().min(1, 'Content is required').max(MAX_CHARS, `Max ${MAX_CHARS} characters`),
  images: z.array(z.instanceof(File)).max(MAX_IMAGES, `Max ${MAX_IMAGES} images`)
})

// Hele form-schemaet uden notes
const schema = z.object({
  tweets: z.array(tweetSchema).min(1, 'Thread must have at least 1 tweet'),
  scheduledAt: z.string().optional(),
  status: z.enum(['draft', 'queued', 'scheduled']).optional()
})

const { handleSubmit, setFieldValue } = useForm({
  validationSchema: toTypedSchema(schema),
  initialValues: {
    tweets: [{ text: '', images: [] }],
    status: 'draft'
  }
})

const scheduledAt = useField<string>('scheduledAt')

// Tweets state
const tweets = ref([{ text: '', images: [] as File[], previews: [] as string[] }])

function addTweet() {
  tweets.value.push({ text: '', images: [], previews: [] })
}

function removeTweet(index: number) {
  tweets.value[index].previews.forEach(url => URL.revokeObjectURL(url))
  tweets.value.splice(index, 1)
}

function onFilesSelected(e: Event, tweetIndex: number) {
  const target = e.target as HTMLInputElement
  if (!target.files) return

  const selected = Array.from(target.files)
  const total = tweets.value[tweetIndex].images.length + selected.length

  if (total > MAX_IMAGES) {
    alert(`You can only upload up to ${MAX_IMAGES} images per tweet.`)
    return
  }

  selected.forEach(file => {
    const previewUrl = URL.createObjectURL(file)
    tweets.value[tweetIndex].images.push(file)
    tweets.value[tweetIndex].previews.push(previewUrl)
  })

  if (target && target.type === 'file') {
    target.value = ''
  }
}

function removeImage(tweetIndex: number, imageIndex: number) {
  URL.revokeObjectURL(tweets.value[tweetIndex].previews[imageIndex])
  tweets.value[tweetIndex].images.splice(imageIndex, 1)
  tweets.value[tweetIndex].previews.splice(imageIndex, 1)
}

onUnmounted(() => {
  tweets.value.forEach(t => t.previews.forEach(url => URL.revokeObjectURL(url)))
})

function save(status: 'draft' | 'queued' | 'scheduled') {
  setFieldValue('status', status)
  handleSubmit(() => {
    console.log('Saving thread:', { tweets: tweets.value, status })
    // TODO: Upload images til Supabase og gem som draft/queue
  })()
}
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-6">
    

    <div class="grid grid-cols-2 gap-8">
        <div class="space-y-6">
            <h1 class="text-2xl font-semibold mb-3">New Post (Thread)</h1>
             <!-- Tweet editors -->
    <div class="space-y-6">
      <div v-for="(tweet, index) in tweets" :key="index" class="p-4 border border-border rounded-lg">
        <div class="flex justify-between items-center mb-2">
          <h2 class="font-medium">Tweet {{ index + 1 }}</h2>
          <button
            v-if="tweets.length > 1"
            type="button"
            class="text-sm text-danger"
            @click="removeTweet(index)"
          >
            Remove
          </button>
        </div>

        <!-- Text -->
        <Textarea
          v-model="tweet.text"
          placeholder="Tweet content..."
          class="mb-1"
        />
        <div class="flex justify-end text-sm"
             :class="tweet.text.length > MAX_CHARS ? 'text-danger' : 'text-muted-foreground'">
          {{ tweet.text.length }}/{{ MAX_CHARS }}
        </div>

        <!-- Images -->
        <div class="mt-3">
          <Input
            type="file"
            accept="image/*"
            multiple
            @change="onFilesSelected($event, index)"
          />
          <ClientOnly>
            <div v-if="tweet.previews.length" class="mt-3 grid grid-cols-2 gap-2">
              <div
                v-for="(preview, imgIndex) in tweet.previews"
                :key="imgIndex"
                class="relative border border-border rounded-lg overflow-hidden"
              >
                <img :src="preview" class="object-cover w-full h-32" />
                <button
                  type="button"
                  class="absolute top-1 right-1 bg-black/50 text-white text-xs px-2 py-1 rounded"
                  @click="removeImage(index, imgIndex)"
                >
                  ✕
                </button>
              </div>
            </div>
          </ClientOnly>
        </div>
      </div>

      <!-- Add tweet -->
      <Button type="button" @click="addTweet" class="mt-2">+ Add Tweet</Button>
    </div>

    <!-- Schedule -->
    <div>
      <label class="font-medium">Schedule</label>
      <Input type="datetime-local" v-model="scheduledAt.value.value" />
    </div>

    <!-- Actions -->
    <div class="flex gap-2">
      <Button type="button" variant="outline" @click="save('draft')">Save as Draft</Button>
      <Button type="button" @click="save('queued')">Add to Queue</Button>
    </div>
        </div>
        <!-- Preview -->
    <div>
      <h2 class="text-xl font-semibold mb-4">Thread Preview</h2>
      <div v-for="(tweet, index) in tweets" :key="'prev' + index" class="mb-6 border border-border rounded-lg p-4 bg-card">
        <p class="whitespace-pre-wrap">{{ tweet.text || '...' }}</p>
        <div v-if="tweet.previews.length" class="mt-4 grid grid-cols-2 gap-2">
            <ClientOnly>
              <img v-for="(preview, imgIndex) in tweet.previews" :key="imgIndex" :src="preview" class="rounded-lg object-cover w-full h-32" />
            </ClientOnly>
        </div>
      </div>
    </div>
    </div>
   

    
  </div>
</template>
