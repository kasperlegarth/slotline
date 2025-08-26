<script setup lang="ts">
import { ref } from 'vue'

const text = ref('Hello from Slotline 👋')
const mediaIds = ref('') // comma-separated Supabase media UUIDs
const res = ref<any>(null)
const loading = ref(false)
const err = ref<string | null>(null)

async function postNow() {
  loading.value = true
  err.value = null
  try {
    res.value = await $fetch('/api/twitter/tweet', {
      method: 'POST',
      body: { text: text.value, mediaIds: mediaIds.value.split(',').map(s => s.trim()).filter(Boolean), token: localStorage.getItem('twitter_accessToken') }
    })
  } catch (e: any) {
    err.value = e?.data?.message || e?.message || String(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-xl mx-auto p-6 space-y-4">
    <h1 class="text-xl font-semibold">Post Now (dev)</h1>

    <textarea v-model="text" class="w-full border rounded p-2 min-h-[120px]" />
    <input v-model="mediaIds" placeholder="media uuid(s), comma-separated (optional)" class="w-full border rounded p-2" />

    <button class="border rounded px-3 py-2" :disabled="loading" @click="postNow">
      {{ loading ? 'Posting…' : 'Post' }}
    </button>

    <div v-if="err" class="text-red-600 text-sm">{{ err }}</div>
    <pre class="text-xs whitespace-pre-wrap">{{ res }}</pre>
  </div>
</template>
