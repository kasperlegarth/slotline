<script setup lang="ts">
import { ref } from 'vue'
import { useNuxtApp } from 'nuxt/app';
const text = ref('Hello from Slotline 👋')
const mediaIds = ref<string>('') // kommaseparerede interne media.id fra din DB, eller tom
const res = ref<any>(null)

async function postNow(){
  const mids = mediaIds.value.split(',').map(s=>s.trim()).filter(Boolean)
  const { $fetch } = useNuxtApp();
  const fetcher = $fetch as typeof import('ofetch').$fetch;
  res.value = await fetcher('/api/x/post-now', { method: 'POST', body: { text: text.value, mediaIds: mids } })
}
</script>

<template>
  <div class="max-w-xl mx-auto p-6 space-y-4">
    <h1 class="text-xl font-semibold">Post Now (dev)</h1>
    <textarea v-model="text" class="w-full border rounded p-2 min-h-[120px]" />
    <input v-model="mediaIds" placeholder="media uuid(s), comma-separated (optional)" class="w-full border rounded p-2" />
    <button class="border rounded px-3 py-2" @click="postNow">Post</button>
    <pre class="text-xs whitespace-pre-wrap">{{ res }}</pre>
  </div>
</template>
