export function useObjectUrls() {
  const urls = new Set<string>()
  const create = (file: File) => {
    const u = URL.createObjectURL(file)
    urls.add(u)
    return u
  }
  const revoke = (u: string) => {
    if (urls.has(u)) {
      URL.revokeObjectURL(u)
      urls.delete(u)
    }
  }
  const revokeAll = () => {
    urls.forEach((u) => URL.revokeObjectURL(u))
    urls.clear()
  }
  return { create, revoke, revokeAll }
}
