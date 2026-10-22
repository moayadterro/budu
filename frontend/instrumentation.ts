import type { Instrumentation } from 'next'

/** Not problems: the visitor left before the page finished streaming. */
const NOISE = /destination stream closed early|aborted|ECONNRESET/i

/**
 * Next calls this for every error the code didn't catch (a page, a server action, a route
 * handler): saved in the error log and, in production, emailed (`reportError`).
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  if (error instanceof Error && NOISE.test(error.message)) return
  const { reportError } = await import('@/shared/server/errors')
  const where = `${context.routeType} ${context.routePath}`
  reportError(`unhandled: ${where}`, error, {
    page: request.path.split('?')[0],
    details: {
      method: request.method,
      kind: context.routeType, // render | action | route | proxy
      ...('renderSource' in context && context.renderSource ? { renderSource: context.renderSource } : {}),
      ...((error as { digest?: string }).digest ? { digest: (error as { digest?: string }).digest } : {}),
    },
  })
}
