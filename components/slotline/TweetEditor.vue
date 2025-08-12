<script setup lang="ts">
import { computed } from 'vue'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import type { TweetDraft } from '@/types/slotline'
import { countGraphemes } from '@/composables/useGraphemes'

const props = defineProps<{
  tweet: TweetDraft
  index: number
  limits: { maxChars: number; maxImages: number }
  createObjectUrl: (f: File) => string
  revokeObjectUrl: (u: string) => void
}>()

const emit = defineEmits<{
  update: [TweetDraft, number]
  remove: []
}>()

function updateTweet(partial: Partial<TweetDraft>) {
  emit('update', { ...props.tweet, ...partial }, props.index)
}

function onText(v: string | number) {
  updateTweet({ text: v as string })
}

function bumpFileKey() {
  updateTweet({ fileInputKey: props.tweet.fileInputKey + 1 })
}

function onFilesSelected(e: Event) {
  const input = e.target as HTMLInputElement | null
  if (!input?.files) return
  const selected = Array.from(input.files)
  const max = props.limits.maxImages
  const current = props.tweet.images.length
  if (current + selected.length > max) {
    alert(`You can only upload up to ${max} images per tweet.`)
    return
  }
  const nextImages = [...props.tweet.images]
  const nextPreviews = [...props.tweet.previews]
  selected.forEach(f => {
    const url = props.createObjectUrl(f)
    nextImages.push(f)
    nextPreviews.push(url)
  })
  updateTweet({ images: nextImages, previews: nextPreviews })
}

function removeImage(imgIndex: number) {
  const urls = [...props.tweet.previews]
  const imgs = [...props.tweet.images]
  const [removed] = urls.splice(imgIndex, 1)
  imgs.splice(imgIndex, 1)
  if (removed) props.revokeObjectUrl(removed)
  updateTweet({ images: imgs, previews: urls })
}
</script>

<template>
  <CardHeader class="pb-2">
    <div class="flex items-center justify-between">
      <CardTitle class="text-base font-semibold">
        Tweet {{ index + 1 }}
      </CardTitle>
      <Button type="button" variant="ghost" size="sm" class="text-destructive hover:text-destructive" @click="$emit('remove')">
        Remove
      </Button>
    </div>
  </CardHeader>

  <CardContent class="space-y-4">
    <div class="space-y-2">
      <Label :for="`tweet-text-${index}`">Text</Label>
      <Textarea
        :id="`tweet-text-${index}`"
        :maxlength="limits.maxChars"
        :model-value="props.tweet.text"
        @update:modelValue="onText"
        placeholder="What's the odd beast today?"
        class="min-h-[110px] resize-y"
      />
      <div class="flex justify-end text-xs text-muted-foreground">
        {{ countGraphemes(tweet.text) }}/{{ limits.maxChars }}
      </div>
    </div>

    <div class="space-y-2">
      <Label :for="`tweet-images-${index}`">Images (optional)</Label>
      <Input
        :key="props.tweet.fileInputKey"
        :id="`tweet-images-${index}`"
        type="file"
        accept="image/*"
        multiple
        @change="onFilesSelected"
      />
      <div class="text-xs text-muted-foreground">Up to {{ limits.maxImages }} images. JPG/PNG/WebP recommended.</div>

      <div v-if="props.tweet.previews.length" class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div
          v-for="(preview, imgIndex) in props.tweet.previews"
          :key="`img-${index}-${imgIndex}`"
          class="group relative rounded-lg overflow-hidden border"
        >
          <img :src="preview" alt="Image preview" class="block h-32 w-full object-cover" />
          <button
            type="button"
            class="absolute top-2 right-2 rounded-md bg-background/80 backdrop-blur px-2 py-1 text-xs border opacity-0 group-hover:opacity-100 transition"
            @click="removeImage(imgIndex)"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  </CardContent>

  <CardFooter class="justify-between">
  <div class="text-xs text-muted-foreground">{{ props.tweet.images.length }} / {{ limits.maxImages }} images</div>
  <div class="text-xs text-muted-foreground">{{ countGraphemes(props.tweet.text) }}/{{ limits.maxChars }}</div>
  </CardFooter>
</template>
