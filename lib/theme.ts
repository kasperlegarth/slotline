export function toggleDarkMode() {
  const el = document.documentElement
  el.classList.toggle('dark')
}
export function setSystemMode() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  document.documentElement.classList.toggle('dark', prefersDark)
}
