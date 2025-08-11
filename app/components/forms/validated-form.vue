<script setup lang="ts">
import { useForm, useField } from 'vee-validate'
import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'

// zod schema – ret til efter behov
const schema = z.object({
  title: z.string().min(3, 'Min. 3 chars'),
  scheduledAt: z.string().nonempty('Pick a date/time'),
})

const form = useForm({
  validationSchema: toTypedSchema(schema),
  initialValues: {
    title: '',
    scheduledAt: '',
  },
})

const { value: title, errorMessage: titleError } = useField<string>('title')
const { value: scheduledAt, errorMessage: dtError } = useField<string>('scheduledAt')

function onSubmit(values: any) {
  // Emit til parent eller call API
  // emit('submit', values)
  console.log('submit', values)
}
</script>

<template>
  <form @submit.prevent="form.handleSubmit(onSubmit)" class="space-y-4">
    <div class="grid gap-2">
      <label class="text-sm font-medium">Title</label>
      <input
        v-model="title"
        type="text"
        class="h-10 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        placeholder="Hook for thread…"
      />
      <p v-if="titleError" class="text-sm text-danger">{{ titleError }}</p>
    </div>

    <div class="grid gap-2">
      <label class="text-sm font-medium">Scheduled at</label>
      <input
        v-model="scheduledAt"
        type="datetime-local"
        class="h-10 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      <p v-if="dtError" class="text-sm text-danger">{{ dtError }}</p>
    </div>

    <button type="submit" class="mt-2 rounded-xl bg-primary px-4 py-2 text-white hover:opacity-90">
      Save draft
    </button>
  </form>
</template>
