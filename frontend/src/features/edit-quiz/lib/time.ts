/** unix seconds → value for <input type="datetime-local"> in the browser's time zone ('' = none). */
export function toLocalInput(seconds: number | null) {
  if (!seconds) return ''
  const d = new Date(seconds * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** <input type="datetime-local"> value → unix seconds (browser time zone), or '' when empty. */
export const fromLocalInput = (v: string) => (v ? String(Math.floor(new Date(v).getTime() / 1000)) : '')
