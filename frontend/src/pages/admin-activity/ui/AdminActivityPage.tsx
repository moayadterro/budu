import { requireRole } from '@/entities/session/server'
import { getTenantName } from '@/entities/tenant/server'
import { AUDIT_ACTIONS, AUDIT_GROUPS, AUDIT_LABELS, type AuditAction } from '@/shared/config/audit'
import { listAudit } from '@/shared/server/audit'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { LocalTime } from '@/shared/ui/local-time'
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from '@/shared/ui/native-select'
import { Pager } from '@/shared/ui/pager'
import { ScreenHead } from '@/shared/ui/screen-head'
import { getT } from '@/shared/i18n/server'

const PAGE = 50
type Search = Promise<{ q?: string; action?: string; failed?: string; page?: string }>

/**
 * Platform admin: everything people did (sign-ins, invites, publishing, grades, payments …) — the
 * real person, not the integration account IOMAD records. Filters live in the address (GET form),
 * so a filtered view can be bookmarked; the server pages it.
 */
export async function AdminActivityPage({ searchParams }: { searchParams: Search }) {
  await requireRole('admin')
  const t = await getT()
  const s = t.audit
  const sp = await searchParams
  const q = (sp.q ?? '').trim().slice(0, 100)
  const action = (AUDIT_ACTIONS as readonly string[]).includes(sp.action ?? '') ? (sp.action as AuditAction) : undefined
  const failedOnly = sp.failed === '1'
  const page = Math.max(0, (Number.parseInt(sp.page ?? '1', 10) || 1) - 1)
  const { total, entries } = await listAudit({ q, action, failedOnly, page, pageSize: PAGE })
  const schools = new Map(
    await Promise.all([...new Set(entries.map((e) => e.companyId).filter((c): c is number => c !== null))].map(async (c) => [c, await getTenantName(c)] as const)),
  )
  const query = new URLSearchParams({ ...(q ? { q } : {}), ...(action ? { action } : {}), ...(failedOnly ? { failed: '1' } : {}) }).toString()
  const role = (r: string | null) => (r && r in t.role ? t.role[r as keyof typeof t.role] : r)

  return (
    <div className="flex max-w-5xl flex-col gap-4">
      <ScreenHead title={s.title} sub={s.sub} />
      <form method="get" className="flex flex-wrap items-center gap-2">
        <Input name="q" defaultValue={q} placeholder={s.search} aria-label={s.search} className="min-w-48 flex-1" />
        <NativeSelect name="action" defaultValue={action ?? ''} aria-label={s.action} className="min-w-48">
          <NativeSelectOption value="">{s.allActions}</NativeSelectOption>
          {AUDIT_GROUPS.map((g) => (
            <NativeSelectOptGroup key={g.name} label={g.name}>
              {g.actions.map((a) => (
                <NativeSelectOption key={a} value={a}>
                  {AUDIT_LABELS[a]}
                </NativeSelectOption>
              ))}
            </NativeSelectOptGroup>
          ))}
        </NativeSelect>
        <label className="flex h-10 items-center gap-2 px-1 text-sm">
          <input type="checkbox" name="failed" value="1" defaultChecked={failedOnly} className="size-4 accent-primary" />
          {s.onlyFailed}
        </label>
        <Button type="submit" variant="outline">
          {s.apply}
        </Button>
      </form>
      <p className="text-xs text-muted-foreground">{s.count(total)}</p>
      <Card className="py-2">
        <CardContent className="flex flex-col px-2 sm:px-4">
          {entries.length === 0 && <p className="p-4 text-sm text-muted-foreground">{s.empty}</p>}
          {entries.map((e) => {
            const details = Object.entries(e.details)
              .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
              .join(' · ')
            return (
              <div key={e.id} className="flex flex-col gap-1 border-b px-1 py-2.5 last:border-0 sm:flex-row sm:items-start sm:gap-4">
                <LocalTime seconds={e.at} className="w-36 flex-none text-xs text-muted-foreground tabular-nums sm:pt-0.5" />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span lang="en" className="font-medium">{AUDIT_LABELS[e.action as AuditAction] ?? e.action}</span>
                    {!e.ok && <Badge variant="destructive">{s.failed}</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {e.userName ? (
                      <>
                        {e.userName} · {role(e.role)}
                        {e.userId !== null && <span dir="ltr"> · #{e.userId}</span>}
                      </>
                    ) : (
                      s.nobody
                    )}
                    {e.companyId !== null && <> · {schools.get(e.companyId) ?? `#${e.companyId}`}</>}
                  </div>
                  {(e.target || details) && (
                    <div dir="ltr" className="truncate text-start font-mono text-xs text-muted-foreground/80 rtl:text-end" title={details}>
                      {[e.target, details].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          <Pager page={page} pageSize={PAGE} total={total} href={`/admin/activity${query ? `?${query}` : ''}`} />
        </CardContent>
      </Card>
    </div>
  )
}
