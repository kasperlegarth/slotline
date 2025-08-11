<script setup lang="ts">
  import { toggleDarkMode } from '@/lib/theme';
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <div class="container-px py-10">
      <div class="rounded-2xl border border-border bg-card p-6">
        <h1 class="text-2xl font-semibold">Tailwind + Tokens OK ✅</h1>
        <p class="mt-2 text-muted-foreground">
          Primary knap herunder bør være teal (#12B886).
        </p>
        <button class="mt-4 rounded-xl bg-foreground px-4 py-2 text-background hover:opacity-90" @click="toggleDarkMode()">
          Toggle theme
        </button>
      </div>
    </div>
  </div>
</template>
