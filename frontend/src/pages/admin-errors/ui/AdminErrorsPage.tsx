import { requireRole } from '@/entities/session/server'
import { listErrors } from '@/shared/server/audit'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent } from '@/shared/ui/card'
import { LocalTime } from '@/shared/ui/local-time'
import { Pager } from '@/shared/ui/pager'
import { ScreenHead } from '@/shared/ui/screen-head'
import { getT } from '@/shared/i18n/server'

const PAGE = 30

/**
 * Platform admin: every distinct error (server and browser), most recent first, with how often it
 * happened, where, for whom, and the stack. In production each one is also emailed (ALERT_EMAIL).
 */
export async function AdminErrorsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireRole('admin')
  const t = await getT()
  const s = t.errorsAdmin
  const page = Math.max(0, (Number.parseInt((await searchParams).page ?? '1', 10) || 1) - 1)
  const { total, entries } = await listErrors({ page, pageSize: PAGE })

  return (
    <div className="flex max-w-5xl flex-col gap-4">
      <ScreenHead title={s.title} sub={s.sub} />
      <p className="text-xs text-muted-foreground">{s.count(total)}</p>
      <Card className="py-2">
        <CardContent className="flex flex-col px-2 sm:px-4">
          {entries.length === 0 && <p className="p-4 text-sm text-muted-foreground">{s.empty}</p>}
          {entries.map((e) => (
            <details key={e.fingerprint} className="group border-b px-1 py-3 last:border-0">
              <summary className="flex cursor-pointer list-none flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span dir="ltr" className="min-w-0 break-words font-mono text-sm font-medium">{e.message}</span>
                  <Badge variant={e.source === 'browser' ? 'info' : 'secondary'}>{e.source === 'browser' ? s.browser : s.server}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  <span dir="ltr">{e.place}</span>
                  {e.page && (
                    <>
                      {' · '}
                      <span dir="ltr">{e.page}</span>
                    </>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {s.times(e.count)} · {s.last} <LocalTime seconds={e.lastAt} />
                  {e.count > 1 && (
                    <>
                      {' · '}
                      {s.first} <LocalTime seconds={e.firstAt} />
                    </>
                  )}
                  {e.userName && <> · {e.userName}</>}
                </div>
              </summary>
              {/* everything we know about the latest occurrence */}
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-md border p-3 text-xs">
                <dt className="text-muted-foreground">{s.user}</dt>
                <dd>
                  {e.userName ? `${e.userName} · ${e.userRole && e.userRole in t.role ? t.role[e.userRole as keyof typeof t.role] : (e.userRole ?? '')}` : s.nobody}
                  {e.userId !== null && <span dir="ltr"> · #{e.userId}</span>}
                  {e.companyId !== null && <span dir="ltr"> · {s.school} #{e.companyId}</span>}
                </dd>
                <dt className="text-muted-foreground">{s.page}</dt>
                <dd dir="ltr" className="text-start font-mono break-all rtl:text-end">{e.page ?? '—'}</dd>
                <dt className="text-muted-foreground">{s.browser}</dt>
                <dd dir="ltr" className="text-start font-mono break-all rtl:text-end">{e.userAgent ?? '—'}</dd>
                {Object.entries(e.details).map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt dir="ltr" className="font-mono text-muted-foreground">{k}</dt>
                    <dd dir="ltr" className="text-start font-mono break-all whitespace-pre-wrap rtl:text-end">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</dd>
                  </div>
                ))}
                <dt className="text-muted-foreground">{s.emailed}</dt>
                <dd>{e.emailedAt ? <LocalTime seconds={e.emailedAt} /> : s.notEmailed}</dd>
              </dl>
              {e.stack && (
                <pre dir="ltr" className="mt-2 max-h-80 overflow-auto rounded-md bg-muted p-3 text-start font-mono text-xs leading-relaxed whitespace-pre-wrap">
                  {e.stack}
                </pre>
              )}
            </details>
          ))}
          <Pager page={page} pageSize={PAGE} total={total} href="/admin/errors" />
        </CardContent>
      </Card>
    </div>
  )
}
