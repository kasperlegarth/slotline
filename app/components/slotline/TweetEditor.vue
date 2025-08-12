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
  modelValue: TweetDraft
  index: number
  limits: { maxChars: number; maxImages: number }
  createObjectUrl: (f: File) => string
  revokeObjectUrl: (u: string) => void
}>()

const emit = defineEmits<{
  'update:modelValue': [TweetDraft]
  'remove': []
}>()

const tweet = computed<TweetDraft>({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

function onText(v: string | number) {
  tweet.value = { ...tweet.value, text: v }
}

function bumpFileKey() {
  tweet.value = { ...tweet.value, fileInputKey: tweet.value.fileInputKey + 1 }
}

function onFilesSelected(e: Event) {
  const input = e.target as HTMLInputElement | null
  if (!input?.files) return
  const selected = Array.from(input.files)
  const max = props.limits.maxImages
  const current = tweet.value.images.length
  if (current + selected.length > max) {
    alert(`You can only upload up to ${max} images per tweet.`)
    bumpFileKey()
    return
  }
  const nextImages = [...tweet.value.images]
  const nextPreviews = [...tweet.value.previews]
  selected.forEach(f => {
    const url = props.createObjectUrl(f)
    nextImages.push(f)
    nextPreviews.push(url)
  })
  tweet.value = { ...tweet.value, images: nextImages, previews: nextPreviews }
  bumpFileKey()
}

function removeImage(imgIndex: number) {
  const urls = [...tweet.value.previews]
  const imgs = [...tweet.value.images]
  const [removed] = urls.splice(imgIndex, 1)
  imgs.splice(imgIndex, 1)
  if (removed) props.revokeObjectUrl(removed)
  tweet.value = { ...tweet.value, images: imgs, previews: urls }
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
        :model-value="tweet.text"
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
        :key="tweet.fileInputKey"
        :id="`tweet-images-${index}`"
        type="file"
        accept="image/*"
        multiple
        @change="(e: Event) => onFilesSelected(e)"
      />
      <div class="text-xs text-muted-foreground">Up to {{ limits.maxImages }} images. JPG/PNG/WebP recommended.</div>

      <div v-if="tweet.previews.length" class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div
          v-for="(preview, imgIndex) in tweet.previews"
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
    <div class="text-xs text-muted-foreground">{{ tweet.images.length }} / {{ limits.maxImages }} images</div>
    <div class="text-xs text-muted-foreground">{{ countGraphemes(tweet.text) }}/{{ limits.maxChars }}</div>
  </CardFooter>
</template>
