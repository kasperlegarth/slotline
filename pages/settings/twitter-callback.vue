<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const status = ref<'loading'|'success'|'error'>('loading')
const errorMsg = ref('')

onMounted(async () => {
  const code = route.query.code as string
  const state = route.query.state as string
  const codeVerifier = localStorage.getItem('twitter_codeVerifier')
  const localState = localStorage.getItem('twitter_state')

  if (!code || !state || !codeVerifier || state !== localState) {
    status.value = 'error'
    errorMsg.value = 'Missing or invalid callback data.'
    return
  }

  try {
    // Kald backend, som bruger getAccessToken
    const res = await fetch(`/api/twitter/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}&codeVerifier=${encodeURIComponent(codeVerifier)}`)
    const data = await res.json()
    if (data.accessToken) {
      status.value = 'success'
      localStorage.setItem('twitter_accessToken', data.accessToken)
      if (data.refreshToken) localStorage.setItem('twitter_refreshToken', data.refreshToken)
      localStorage.removeItem('twitter_codeVerifier')
      localStorage.removeItem('twitter_state')
      setTimeout(() => router.push('/settings/integrations?x=connected'), 1500)
    } else {
      status.value = 'error'
      errorMsg.value = data.error || 'Unknown error.'
    }
  } catch (e) {
    status.value = 'error'
    errorMsg.value = 'Network or server error.'
  }
})
</script>

<template>
  <div class="p-8 max-w-xl mx-auto space-y-4">
    <h1 class="text-2xl font-semibold">Twitter Callback</h1>
    <div v-if="status === 'loading'">Connecting to Twitter...</div>
    <div v-else-if="status === 'success'" class="text-green-600">Twitter account connected! Redirecting...</div>
    <div v-else class="text-red-600">Error: {{ errorMsg }}</div>
  </div>
</template>
