<script setup lang="ts">
import type { TweetDraft } from '@/types/slotline'
defineProps<{
  tweets: TweetDraft[]
  scheduledLabel?: string
  maxChars: number
  maxImages: number
}>()
</script>

<template>
  <div class="p-4 space-y-4">
    <div v-if="scheduledLabel" class="text-xs text-muted-foreground">{{ scheduledLabel }}</div>

    <div v-for="(tweet, index) in tweets" :key="tweet.id" class="flex gap-3">
      <!-- Avatar -->
      <div class="shrink-0">
        <div class="h-10 w-10 rounded-full bg-muted border" />
      </div>

      <!-- Body -->
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 text-sm">
          <span class="font-semibold truncate">OddBeasts</span>
          <span class="text-muted-foreground truncate">@OddBeasts</span>
          <span class="text-muted-foreground">·</span>
          <span class="text-muted-foreground text-xs">preview</span>
        </div>

        <div class="mt-1 whitespace-pre-wrap break-words">
          {{ tweet.text || '—' }}
        </div>

        <div v-if="tweet.previews.length" class="mt-3 grid gap-2"
             :class="{
               'grid-cols-1': tweet.previews.length === 1,
               'grid-cols-2': tweet.previews.length === 2,
               'grid-cols-2 sm:grid-cols-2': tweet.previews.length >= 3
             }">
          <img
            v-for="(preview, imgIndex) in tweet.previews"
            :key="`pimg-${index}-${imgIndex}`"
            :src="preview"
            class="w-full h-56 object-cover rounded-xl border"
            alt="Preview"
          />
        </div>

        <div class="mt-2 text-xs text-muted-foreground">
          {{ typeof tweet.text === 'string' ? tweet.text.length : String(tweet.text).length }}/{{ maxChars }} • {{ tweet.images.length }}/{{ maxImages }} images
        </div>

        <div v-if="index < tweets.length - 1" class="mt-4 border-b" />
      </div>
    </div>
  </div>
</template>
