/** Read FormData fields safely (server actions get untrusted input). */
export const formText = (form: FormData, key: string) => {
  const v = form.get(key)
  return typeof v === 'string' ? v.trim() : ''
}

/** A positive integer id, or 0 if missing/invalid. */
export const formId = (form: FormData, key: string) => {
  const n = Number(formText(form, key))
  return Number.isSafeInteger(n) && n > 0 ? n : 0
}

/** A non-empty uploaded file, or null. */
export const formFile = (form: FormData, key: string) => {
  const v = form.get(key)
  return v instanceof File && v.size > 0 ? v : null
}
