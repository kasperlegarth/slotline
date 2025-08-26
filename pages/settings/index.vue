<script setup lang="ts">
  async function connectX() {
    try {
      const res = await fetch('/api/twitter/auth-link');
      const data = await res.json();
      if (data.url && data.codeVerifier && data.state) {
        localStorage.setItem('twitter_codeVerifier', data.codeVerifier);
        localStorage.setItem('twitter_state', data.state);

        console.log('LocalStorage after set:', {
          codeVerifier: localStorage.getItem('twitter_codeVerifier'),
          state: localStorage.getItem('twitter_state')
        })
        
        window.location.href = data.url;
      } else {
        alert('Kunne ikke starte Twitter auth.');
      }
    } catch (e) {
      alert('Fejl ved Twitter auth.');
    }
  }
</script>

<template>
  <div class="p-8 max-w-xl mx-auto space-y-4">
  <h1 class="text-2xl font-semibold">Integrations</h1>
  <div class="text-sm text-muted-foreground">Når du har godkendt på Twitter, bliver du sendt tilbage til callback-siden, som håndterer forbindelsen.</div>
    <div class="border rounded-xl p-4 flex items-center justify-between">
      <div>
        <div class="font-medium">X (Twitter)</div>
        <div class="text-sm text-muted-foreground">Post directly to your connected account.</div>
      </div>
      <button class="px-3 py-2 rounded-md border" @click="connectX">Connect</button>
    </div>
  </div>
</template>
