<script setup lang="ts">
function connectX(){ window.location.href='/api/x/oauth/start' }
</script>

<template>
  <div class="p-8 max-w-xl mx-auto space-y-4">
    <h1 class="text-2xl font-semibold">Integrations</h1>
    <div class="border rounded-xl p-4 flex items-center justify-between">
      <div>
        <div class="font-medium">X (Twitter)</div>
        <div class="text-sm text-muted-foreground">Post directly to your connected account.</div>
      </div>
      <button class="px-3 py-2 rounded-md border" @click="connectX">Connect</button>
    </div>
  </div>
</template>
