// Konverterer 'YYYY-MM-DDTHH:mm' (fra <input type="datetime-local">) til UTC ISO string
export function toUTCISOString(local: string): string {
  // new Date('YYYY-MM-DDTHH:mm') behandles som lokal tid af JS
  const d = new Date(local)
  if (isNaN(+d)) throw new Error('Invalid local datetime')
  return d.toISOString()
}

// Viser læsebart label i lokal tid (fx "12 Aug 2025, 14:30")
export function formatLocalLabel(local: string): string {
  const d = new Date(local)
  if (isNaN(+d)) return local
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
