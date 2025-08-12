<script setup lang="ts">
import { computed } from 'vue'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { formatLocalLabel } from '@/utils/time'

type Model = { enabled: boolean; at: string | number | null }
const props = defineProps<{ modelValue: Model }>()
const emit = defineEmits<{ 'update:modelValue': [Model] }>()

const model = computed<Model>({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

function onToggle(v: boolean) {
  model.value = { ...model.value, enabled: v }
}
function onDateChange(v: string | number) {
  model.value = { ...model.value, at: v || null }
}
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-[auto,1fr] sm:items-center">
    <div class="flex items-center gap-3">
      <Switch :checked="model.enabled" @update:model-value="onToggle" id="schedule-switch" />
      <Label for="schedule-switch">Schedule thread</Label>
    </div>

    <div class="grid gap-2">
      <Label for="scheduledAt" class="text-sm text-muted-foreground">Date & time (local)</Label>
      <Input
        id="scheduledAt"
        type="datetime-local"
        :disabled="!model.enabled"
        :value="model.at ?? ''"
        @update:modelValue="onDateChange"
        @input="onDateChange(($event.target as HTMLInputElement).value)"
      />
      <div v-if="model.enabled && model.at" class="text-xs text-muted-foreground">
        Will post at: {{ formatLocalLabel(model.at as string) }}
      </div>
    </div>
  </div>
</template>
