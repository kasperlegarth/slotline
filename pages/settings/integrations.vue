<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute, useRouter } from '#app'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'

const route = useRoute()
const router = useRouter()
const justConnected = computed(() => route.query.x === 'connected')

const { data, refresh, pending } = await useFetch('/api/x/account', {
  default: () => ({ connected: false, account: null })
})

function connectX() {
  window.location.href = '/api/x/oauth/start'
}

async function disconnectX() {
  if (!confirm('Disconnect X from Slotline?')) return
  await $fetch('/api/x/disconnect', { method: 'POST' })
  await refresh()
  // fjern evt. query param
  router.replace({ path: route.path, query: {} })
}

async function postTest() {
  const res = await $fetch('/api/x/post-now', {
    method: 'POST',
    body: { text: `Slotline test ✅ ${new Date().toLocaleString()}` }
  })
  if (res?.ok) alert(`Posted tweet id: ${res.tweet.id}`)
  else alert(`Failed: ${res?.error || 'unknown error'}`)
}

onMounted(() => {
  if (justConnected.value) {
    // auto-hide success banner ved at rydde query param efter 2 sek.
    setTimeout(() => {
      const q = { ...route.query }
      delete q.x
      router.replace({ path: route.path, query: q })
    }, 2000)
  }
})
</script>

<template>
  <div class="p-8 max-w-2xl mx-auto space-y-4">
    <h1 class="text-2xl font-semibold">Integrations</h1>

    <div
      v-if="justConnected"
      class="rounded-lg border border-green-200 bg-green-50 text-green-900 px-4 py-3"
    >
      Connected to X successfully ✅
    </div>

    <Card>
      <CardHeader>
        <CardTitle>X (Twitter)</CardTitle>
      </CardHeader>
      <CardContent class="space-y-2">
        <div v-if="pending" class="text-sm text-muted-foreground">Loading status…</div>

        <template v-else>
          <div v-if="data?.connected" class="space-y-1">
            <div class="text-sm">
              Status:
              <span class="rounded bg-green-100 text-green-800 px-2 py-0.5 text-xs align-middle">
                Connected
              </span>
            </div>
            <div class="text-sm text-muted-foreground">
              {{ data.account?.handle ? `@${data.account.handle}` : 'Account connected' }}
            </div>
          </div>

          <div v-else class="text-sm">
            Status:
            <span class="rounded bg-amber-100 text-amber-800 px-2 py-0.5 text-xs align-middle">
              Not connected
            </span>
          </div>
        </template>
      </CardContent>
      <CardFooter class="flex gap-2">
        <Button v-if="!data?.connected" @click="connectX">Connect</Button>
        <template v-else>
          <Button variant="outline" @click="postTest">Post test tweet</Button>
          <Button variant="outline" @click="connectX">Reconnect</Button>
          <Button variant="destructive" @click="disconnectX">Disconnect</Button>
        </template>
      </CardFooter>
    </Card>
  </div>
</template>
