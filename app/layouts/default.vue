<script setup lang="ts">
// @ts-ignore
import { useState } from '#app';
import { toggleDarkMode } from '@/lib/theme';
import { Toaster } from '@/components/ui/sonner'
import 'vue-sonner/style.css' 

const nav = [
  { to: '/', label: 'Dashboard', icon: '🏠' },
  { to: '/posts', label: 'Posts', icon: '📝' },
  { to: '/calendar', label: 'Calendar', icon: '📅' },
  { to: '/queue', label: 'Queue', icon: '📤' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
]

const sidebarOpen = useState('sidebarOpen', () => true)
</script>

<template>
  <div class="flex min-h-dvh bg-background text-foreground">
    <aside v-if="sidebarOpen" class="w-64 border-r border-border p-4 hidden md:block">
      <h1 class="text-lg font-semibold mb-4">Slotline</h1>
      <nav class="space-y-1">
        <NuxtLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-muted/60 data-[active=true]:bg-muted"
          :data-active="$route.path === item.to"
        >
          <span>{{ item.icon }}</span><span>{{ item.label }}</span>
        </NuxtLink>
      </nav>
    </aside>

    <div class="flex-1 flex flex-col">
      <header class="border-b border-border px-4 py-2 flex items-center gap-2">
        <button class="md:hidden rounded-xl px-3 py-2 hover:bg-muted" @click="sidebarOpen = !sidebarOpen">☰</button>
        <div class="ml-auto flex items-center gap-2">
          <button class="rounded-xl px-3 py-2 hover:bg-muted" @click="toggleDarkMode()">🌓</button>
        </div>
      </header>
      <main class="p-4">
        <slot />
      </main>
    </div>
    <Toaster />
  </div>
</template>
