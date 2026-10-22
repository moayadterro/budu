'use client'

import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import type { ExamTaker } from '@/entities/quiz'
import { cn } from '@/shared/lib/cn'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { ConfirmDialog } from '@/shared/ui/confirm-button'
import { Icon } from '@/shared/ui/icon'
import { Input } from '@/shared/ui/input'
import { Appear } from '@/shared/ui/motion'
import { MoreMenu } from '@/shared/ui/more-menu'
import { Pager } from '@/shared/ui/pager'
import { PersonAvatar } from '@/shared/ui/person-avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { useT } from '@/shared/i18n'
import { addAudienceAction, remindAction, removeFromAudienceAction, resendExamInviteAction } from '../server/actions'
import { CandidateRows } from './CandidateRows'

const PAGE = 20

type Status = 'invited' | 'notStarted' | 'started'

/**
 * Who takes a school exam: the list (with remove), and adding whole classes, chosen students of the
 * school, or candidates by email (new people get an invite link).
 */
export function AudienceEditor({
  quizId,
  audience,
  classes,
  students,
}: {
  quizId: number
  /** everyone given the exam; `started` = has an attempt (results live on the Results page) */
  audience: Array<ExamTaker & { started: boolean }>
  classes: Array<{ id: number; name: string; studentCount: number }>
  /** the school's students not given the exam yet */
  students: Array<{ id: number; name: string; email: string; pictureId: number | null }>
}) {
  const t = useT()
  const s = t.exams.audience
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; error?: boolean; text: string } | null>(null)
  const [pickedClasses, setPickedClasses] = useState<number[]>([])
  const [pickedStudents, setPickedStudents] = useState<number[]>([])
  const [search, setSearch] = useState('')
  // per person on the list: what happened when the invitation was sent again
  const [resent, setResent] = useState<Record<number, 'sent' | 'recent' | 'failed'>>({})
  const [classSearch, setClassSearch] = useState('')
  // the list of people can reach hundreds: search + pages of PAGE
  const [peopleSearch, setPeopleSearch] = useState('')
  const [page, setPage] = useState(0)
  // this list is for chasing people who haven't acted: invitation not accepted → exam not started
  const [show, setShow] = useState<'all' | Status>('all')
  const statusOf = (a: { pending: boolean; started: boolean }): Status => (a.pending ? 'invited' : a.started ? 'started' : 'notStarted')
  const invitedCount = audience.filter((a) => statusOf(a) === 'invited').length
  const notStartedCount = audience.filter((a) => statusOf(a) === 'notStarted').length
  // the filter exists while someone still has to act; when it disappears, show everyone
  const canFilter = invitedCount + notStartedCount > 0
  const filter = canFilter ? show : 'all'
  const people = useMemo(() => {
    const q = peopleSearch.trim().toLowerCase()
    return audience.filter(
      (a) =>
        (filter === 'all' || statusOf(a) === filter) && (!q || a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)),
    )
  }, [peopleSearch, audience, filter])
  const [bulkConfirm, setBulkConfirm] = useState(false)
  const lastPage = Math.max(0, Math.ceil(people.length / PAGE) - 1)
  const shownPeople = people.slice(Math.min(page, lastPage) * PAGE, (Math.min(page, lastPage) + 1) * PAGE)
  // "Class 2" before "Class 10"; only classes with students can be picked
  const sortedClasses = useMemo(() => [...classes].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })), [classes])
  const shownClasses = useMemo(() => {
    const q = classSearch.trim().toLowerCase()
    return q ? sortedClasses.filter((k) => k.name.toLowerCase().includes(q)) : sortedClasses
  }, [classSearch, sortedClasses])
  const pickable = sortedClasses.filter((k) => k.studentCount > 0)
  const allPicked = pickable.length > 0 && pickable.every((k) => pickedClasses.includes(k.id))
  const pickedStudentTotal = classes.filter((k) => pickedClasses.includes(k.id)).reduce((n, k) => n + k.studentCount, 0)
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? students.filter((x) => x.name.toLowerCase().includes(q) || x.email.toLowerCase().includes(q)) : students
  }, [search, students])

  const add = (input: Parameters<typeof addAudienceAction>[1], reset?: () => void) =>
    start(async () => {
      const r = await addAudienceAction(quizId, input)
      if (!r.ok) return setMsg({ ok: false, error: true, text: s.failed })
      setMsg({ ok: r.added > 0, text: s.added(r.added) })
      reset?.()
    })
  // a toast says it's happening and that it went out (the line under the person stays as a record)
  const resend = (a: ExamTaker) => {
    const id = toast.loading(s.resendToast.sending(a.email))
    start(async () => {
      const r = await resendExamInviteAction(quizId, a.id)
      setResent((m) => ({ ...m, [a.id]: r }))
      if (r === 'sent') toast.success(s.resendToast.sent(a.email), { id })
      else if (r === 'recent') toast.info(s.resendResult.recent, { id })
      else toast.error(s.resendResult.failed, { id })
    })
  }
  // remind one person or the whole filtered group (invitation again / "you haven't started")
  const remind = (ids: number[], one?: ExamTaker) => {
    const id = toast.loading(one ? s.remindToast.sendingOne(one.name) : s.remindToast.sending)
    start(async () => {
      const r = await remindAction(quizId, ids)
      if (!r.ok) return void toast.error(s.failed, { id })
      const text = s.remindToast.done(r)
      if (r.invited + r.reminded > 0) toast.success(text, { id })
      else toast.info(text, { id })
    })
  }
  // the result appears right under the button that was pressed (not at the top of the card)
  const feedback = msg && (
    <Appear>
      <p
        role="status"
        className={cn('flex items-start gap-2 text-sm', msg.error ? 'text-destructive' : msg.ok ? 'text-success' : 'text-muted-foreground')}
      >
        <Icon name={msg.ok ? 'tick' : 'alert'} className="mt-0.5 size-4 flex-none" />
        <span className={cn(!msg.error && 'text-foreground/80')}>{msg.text}</span>
      </p>
    </Appear>
  )

  return (
    <div className="flex flex-col gap-5">
      <Tabs defaultValue={classes.length ? 'classes' : 'candidates'} className="gap-3" onValueChange={() => setMsg(null)}>
        <TabsList>
          {classes.length > 0 && <TabsTrigger value="classes">{s.classes}</TabsTrigger>}
          {students.length > 0 && <TabsTrigger value="students">{s.students}</TabsTrigger>}
          <TabsTrigger value="candidates">{s.candidates}</TabsTrigger>
        </TabsList>

        <TabsContent value="classes" className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{s.classesHint}</p>
          {/* a list like the Students tab — works for 3 classes or 30 */}
          {classes.length > 6 && (
            <Input value={classSearch} onChange={(e) => setClassSearch(e.target.value)} placeholder={s.searchClasses} aria-label={s.searchClasses} />
          )}
          <div className="max-h-72 overflow-y-auto rounded-md border">
            {pickable.length > 1 && !classSearch.trim() && (
              <label className="flex min-h-11 cursor-pointer items-center gap-3 border-b bg-muted/30 px-3 py-2 hover:bg-muted/50">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={allPicked}
                  onChange={() => setPickedClasses(allPicked ? [] : pickable.map((k) => k.id))}
                />
                <span className="flex-1 text-sm font-medium">{s.allClasses}</span>
                <span className="text-xs text-muted-foreground">{t.teach.studentCount(pickable.reduce((n, k) => n + k.studentCount, 0))}</span>
              </label>
            )}
            {shownClasses.map((k) => {
              const on = pickedClasses.includes(k.id)
              const empty = k.studentCount === 0
              return (
                <label
                  key={k.id}
                  className={cn(
                    'flex min-h-11 items-center gap-3 border-b px-3 py-2 last:border-0',
                    empty ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-muted/50',
                  )}
                >
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={on}
                    disabled={empty}
                    onChange={() => setPickedClasses((c) => (on ? c.filter((x) => x !== k.id) : [...c, k.id]))}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm">{k.name}</span>
                  <span className="text-xs text-muted-foreground">{empty ? s.emptyClass : t.teach.studentCount(k.studentCount)}</span>
                </label>
              )
            })}
            {shownClasses.length === 0 && <p className="p-3 text-sm text-muted-foreground">{s.noClassMatch}</p>}
          </div>
          {pickedClasses.length > 0 && <p className="-mt-1 text-xs text-muted-foreground">{s.selected(t.teach.studentCount(pickedStudentTotal))}</p>}
          <Button className="self-start" disabled={pending || !pickedClasses.length} onClick={() => add({ classIds: pickedClasses }, () => setPickedClasses([]))}>
            {s.add}
          </Button>
          {feedback}
        </TabsContent>

        <TabsContent value="students" className="flex flex-col gap-3">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={s.search} aria-label={s.search} />
          <div className="max-h-64 overflow-y-auto rounded-md border">
            {shown.map((x) => {
              const on = pickedStudents.includes(x.id)
              return (
                <label key={x.id} className="flex cursor-pointer items-center gap-3 border-b px-3 py-2 last:border-0 hover:bg-muted/50">
                  <input type="checkbox" className="size-4 accent-primary" checked={on} onChange={() => setPickedStudents((c) => (on ? c.filter((y) => y !== x.id) : [...c, x.id]))} />
                  <PersonAvatar person={x} className="size-7" />
                  <span className="min-w-0 flex-1 truncate text-sm">{x.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{x.email}</span>
                </label>
              )
            })}
            {shown.length === 0 && <p className="p-3 text-sm text-muted-foreground">{s.noMatch}</p>}
          </div>
          <Button className="self-start" disabled={pending || !pickedStudents.length} onClick={() => add({ studentIds: pickedStudents }, () => setPickedStudents([]))}>
            {s.addCount(pickedStudents.length)}
          </Button>
          {feedback}
        </TabsContent>

        <TabsContent value="candidates" className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{s.candidatesHint}</p>
          <CandidateRows quizId={quizId} />
        </TabsContent>
      </Tabs>

      <div>
        <h3 className="text-sm font-semibold">{s.listTitle}</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          {audience.length ? s.listSummary(audience.length, invitedCount, notStartedCount) : s.empty}
        </p>
        {/* the same small tabs as the card's Classes / Students / Candidates, not a big control */}
        {canFilter && (
          <Tabs
            value={show}
            onValueChange={(v) => {
              setShow(v as typeof show)
              setPage(0)
            }}
            className="mb-2"
          >
            <TabsList aria-label={s.filterLabel}>
              <TabsTrigger value="all">{s.filter.all}</TabsTrigger>
              <TabsTrigger value="invited">{s.filter.invited}</TabsTrigger>
              <TabsTrigger value="notStarted">{s.filter.notStarted}</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
        {/* a filtered group can be reminded in one go (asks first: it emails everyone in it) */}
        {(filter === 'invited' || filter === 'notStarted') && people.length > 0 && (
          <>
            <Button type="button" variant="outline" size="sm" className="mb-2" disabled={pending} onClick={() => setBulkConfirm(true)}>
              <Icon name="send" />
              {filter === 'invited' ? s.bulk.invited : s.bulk.notStarted}
            </Button>
            <ConfirmDialog
              open={bulkConfirm}
              onOpenChange={setBulkConfirm}
              tone="primary"
              icon="send"
              label={s.bulk.send}
              confirmLabel={filter === 'invited' ? s.bulk.invitedTitle(people.length) : s.bulk.notStartedTitle(people.length)}
              description={s.bulk.desc}
              onConfirm={() => remind(people.map((a) => a.id))}
            />
          </>
        )}
        {audience.length > 10 && (
          <Input
            value={peopleSearch}
            onChange={(e) => {
              setPeopleSearch(e.target.value)
              setPage(0)
            }}
            placeholder={s.searchPeople}
            aria-label={s.searchPeople}
            className="mb-2"
          />
        )}
        {audience.length > 0 && people.length === 0 && <p className="py-2 text-sm text-muted-foreground">{s.noPeopleMatch}</p>}
        <div className="flex flex-col gap-1">
          {shownPeople.map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-md px-1 py-1.5 hover:bg-muted/50">
              <PersonAvatar person={a} className="size-8" />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="truncate text-sm font-medium">{a.name}</div>
                <div className="truncate text-xs text-muted-foreground">{a.email}</div>
                {resent[a.id] && (
                  <Appear>
                    <div className={cn('flex items-center gap-1 text-xs', resent[a.id] === 'failed' ? 'text-destructive' : resent[a.id] === 'recent' ? 'text-muted-foreground' : 'text-success')}>
                      <Icon name={resent[a.id] === 'sent' ? 'tick' : 'alert'} className="size-3.5" />
                      {s.resendResult[resent[a.id]]}
                    </div>
                  </Appear>
                )}
              </div>
              {/* stacked on phones so the email keeps its width */}
              <div className="flex flex-none flex-col items-end gap-1 sm:flex-row sm:items-center">
                {!a.member && <Badge variant="info">{s.candidate}</Badge>}
                <Badge variant={statusOf(a) === 'started' ? 'outline' : 'secondary'}>{s.status[statusOf(a)]}</Badge>
              </div>
              <MoreMenu
                label={t.actionsFor(a.name)}
                actions={
                  statusOf(a) === 'invited'
                    ? [{ label: s.resend, icon: 'send', onSelect: () => resend(a), disabled: pending }]
                    : statusOf(a) === 'notStarted'
                      ? [{ label: s.remindOne, icon: 'clock', onSelect: () => remind([a.id], a), disabled: pending }]
                      : []
                }
                danger={{
                  label: s.remove,
                  icon: 'close',
                  confirmLabel: t.confirm.audienceTitle(a.name),
                  description: t.confirm.audienceDesc,
                  onConfirm: () => start(() => removeFromAudienceAction(quizId, a.id)),
                }}
              />
            </div>
          ))}
        </div>
        <Pager page={Math.min(page, lastPage)} pageSize={PAGE} total={people.length} onPage={setPage} />
      </div>
    </div>
  )
}
