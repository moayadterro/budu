'use client'

import { useMemo, useState, useTransition } from 'react'
import type { ExamTaker } from '@/entities/quiz'
import { cn } from '@/shared/lib/cn'
import { Alert } from '@/shared/ui/alert'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Icon } from '@/shared/ui/icon'
import { Input } from '@/shared/ui/input'
import { PersonAvatar } from '@/shared/ui/person-avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { Textarea } from '@/shared/ui/textarea'
import { useT } from '@/shared/i18n'
import { addAudienceAction, removeFromAudienceAction, type Candidate } from '../server/actions'

/** "Anna Petrova, anna@mail.ru" | "anna@mail.ru" per line → candidates (bad lines are counted, not lost). */
function parseCandidates(text: string): { candidates: Candidate[]; bad: number } {
  let bad = 0
  const candidates: Candidate[] = []
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    const email = line.match(/[^\s,;<>]+@[^\s,;<>]+\.[^\s,;<>]+/)?.[0]
    if (!email) {
      bad++
      continue
    }
    const name = line.replace(email, '').replace(/[<>,;]/g, ' ').trim().split(/\s+/).filter(Boolean)
    candidates.push({ firstName: name[0] ?? '', lastName: name.slice(1).join(' '), email })
  }
  return { candidates, bad }
}

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
  audience: ExamTaker[]
  classes: Array<{ id: number; name: string; studentCount: number }>
  /** the school's students not given the exam yet */
  students: Array<{ id: number; name: string; email: string; pictureId: number | null }>
}) {
  const t = useT()
  const s = t.exams.audience
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [pickedClasses, setPickedClasses] = useState<number[]>([])
  const [pickedStudents, setPickedStudents] = useState<number[]>([])
  const [search, setSearch] = useState('')
  const [paste, setPaste] = useState('')
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? students.filter((x) => x.name.toLowerCase().includes(q) || x.email.toLowerCase().includes(q)) : students
  }, [search, students])

  const add = (input: Parameters<typeof addAudienceAction>[1], extraBad = 0, reset?: () => void) =>
    start(async () => {
      const r = await addAudienceAction(quizId, input)
      if (!r.ok) return setMsg({ ok: false, text: s.failed })
      setMsg({ ok: true, text: s.result(r.added, r.invited, r.skipped + extraBad) })
      reset?.()
    })
  const chip = (on: boolean) =>
    cn('h-9 rounded-md border px-3 text-sm font-medium transition-colors', on ? 'border-primary bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')

  return (
    <div className="flex flex-col gap-5">
      {msg && <Alert variant={msg.ok ? 'success' : 'destructive'}>{msg.text}</Alert>}

      <Tabs defaultValue={classes.length ? 'classes' : 'candidates'} className="gap-3">
        <TabsList>
          {classes.length > 0 && <TabsTrigger value="classes">{s.classes}</TabsTrigger>}
          {students.length > 0 && <TabsTrigger value="students">{s.students}</TabsTrigger>}
          <TabsTrigger value="candidates">{s.candidates}</TabsTrigger>
        </TabsList>

        <TabsContent value="classes" className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{s.classesHint}</p>
          <div className="flex flex-wrap gap-2">
            {classes.map((k) => {
              const on = pickedClasses.includes(k.id)
              return (
                <button key={k.id} type="button" aria-pressed={on} className={chip(on)} onClick={() => setPickedClasses((c) => (on ? c.filter((x) => x !== k.id) : [...c, k.id]))}>
                  {k.name} <span className="opacity-70">· {k.studentCount}</span>
                </button>
              )
            })}
          </div>
          <Button className="self-start" disabled={pending || !pickedClasses.length} onClick={() => add({ classIds: pickedClasses }, 0, () => setPickedClasses([]))}>
            {s.add}
          </Button>
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
          <Button className="self-start" disabled={pending || !pickedStudents.length} onClick={() => add({ studentIds: pickedStudents }, 0, () => setPickedStudents([]))}>
            {s.addCount(pickedStudents.length)}
          </Button>
        </TabsContent>

        <TabsContent value="candidates" className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{s.candidatesHint}</p>
          <Textarea rows={6} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={s.candidatesPh} aria-label={s.candidates} className="font-mono text-sm" />
          <Button
            className="self-start"
            disabled={pending || !paste.trim()}
            onClick={() => {
              const { candidates, bad } = parseCandidates(paste)
              add({ candidates }, bad, () => setPaste(''))
            }}
          >
            <Icon name="send" />
            {s.invite}
          </Button>
        </TabsContent>
      </Tabs>

      <div>
        <h3 className="mb-2 text-sm font-semibold">{s.list(audience.length)}</h3>
        {audience.length === 0 && <p className="text-sm text-muted-foreground">{s.empty}</p>}
        <div className="flex flex-col gap-1">
          {audience.map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-md px-1 py-1.5 hover:bg-muted/50">
              <PersonAvatar person={a} className="size-8" />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="truncate text-sm font-medium">{a.name}</div>
                <div className="truncate text-xs text-muted-foreground">{a.email}</div>
              </div>
              {!a.member && <Badge variant="info">{s.candidate}</Badge>}
              {a.pending && <Badge variant="secondary">{s.notActivated}</Badge>}
              <Button variant="ghost" size="icon-sm" disabled={pending} onClick={() => start(() => removeFromAudienceAction(quizId, a.id))} aria-label={s.remove} title={s.remove}>
                <Icon name="close" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
