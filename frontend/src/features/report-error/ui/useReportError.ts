'use client'

import { useEffect } from 'react'
import { reportClientError } from '../server/actions'

/** Report an error boundary's error to the server once (for the error log and the alert email). */
export function useReportError(error: Error & { digest?: string }) {
  useEffect(() => {
    void reportClientError({ message: error.message, stack: error.stack, digest: error.digest, page: window.location.pathname }).catch(() => {})
  }, [error])
}
