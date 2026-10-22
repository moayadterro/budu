'use server'

import { reportError } from '@/shared/server/errors'

const MAX_LEN = { message: 1000, stack: 6000, page: 300 }

/**
 * A crash in the browser (the "something went wrong" screen): reported like a server error,
 * marked as coming from the browser. Input is untrusted: cut to size, never rendered as HTML.
 */
export async function reportClientError(input: { message?: string; stack?: string; digest?: string; page?: string }) {
  // an error with a digest happened on the server and is already in the log (onRequestError)
  if (input?.digest) return
  const message = String(input?.message ?? 'unknown').slice(0, MAX_LEN.message)
  const e = new Error(message)
  e.name = 'BrowserError'
  e.stack = `${e.name}: ${message}\n${String(input?.stack ?? '').slice(0, MAX_LEN.stack)}`
  reportError('browser crash', e, { source: 'browser', page: String(input?.page ?? '').slice(0, MAX_LEN.page) || undefined })
}
