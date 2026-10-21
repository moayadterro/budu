import Link from 'next/link'
import { notFound } from 'next/navigation'
import { homeworkFileUrl, HomeworkStatusBadge, type HomeworkFile } from '@/entities/homework'
import { getMyHomework } from '@/entities/homework/server'
import { requireRole } from '@/entities/session/server'
import { SubmitHomeworkForm } from '@/features/submit-homework'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Icon } from '@/shared/ui/icon'
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/shared/ui/item'
import { LocalTime } from '@/shared/ui/local-time'
import { formatBytes } from '@/shared/lib/format'
import { formatGrade, scaleMax } from '@/shared/lib/grade-scale'
import { getGradeScale } from '@/entities/tenant/server'
import { getT } from '@/shared/i18n/server'

function Files({ files }: { files: HomeworkFile[] }) {
  return (
    <div className="flex flex-col gap-2">
      {files.map((f) => (
        <Item key={f.id} variant="outline" size="sm" asChild>
          <a href={homeworkFileUrl(f)} target="_blank" rel="noopener">
            <ItemMedia variant="icon">
              <Icon name="file" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{f.name}</ItemTitle>
              <ItemDescription>{formatBytes(f.size)}</ItemDescription>
            </ItemContent>
            <Icon name="download" className="size-4 text-muted-foreground" />
          </a>
        </Item>
      ))}
    </div>
  )
}

/** Student: one homework — instructions, attachments, the answer form, and grade/feedback once graded. */
export async function HomeworkPage({ params }: { params: Promise<{ courseId: string; homeworkId: string }> }) {
  const user = await requireRole('student')
  const p = await params
  const id = Number(p.homeworkId)
  if (!Number.isSafeInteger(id) || id <= 0) notFound()
  const hw = await getMyHomework(user.userId, id)
  if (!hw || String(hw.courseId) !== p.courseId) notFound()
  const t = await getT()
  const scale = await getGradeScale(user.companyId)
  const s = t.learn

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" className="-ms-2 mb-2" asChild>
          <Link href={`/classes/${hw.courseId}`}>
            <Icon name="back" className="rtl:-scale-x-100" />
            {hw.courseTitle}
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <HomeworkStatusBadge scale={scale} status={hw.status} grade={hw.grade} dueAt={hw.dueAt} submittedAt={hw.submittedAt} />
          <span className="text-sm text-muted-foreground">
            {hw.dueAt ? (
              <>
                {t.hw.due} <LocalTime seconds={hw.dueAt} />
              </>
            ) : (
              t.hw.noDue
            )}
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{hw.title}</h1>
      </div>

      {hw.status === 'graded' && (
        <Card className="border-success/30 bg-success/5">
          <CardHeader>
            <CardDescription>{s.grade}</CardDescription>
            <CardTitle className="text-4xl font-semibold tabular-nums text-success">
              {hw.grade !== null && formatGrade(hw.grade, scale)}{' '}
              <span className="text-base font-normal text-muted-foreground">{scaleMax(scale)}</span>
            </CardTitle>
          </CardHeader>
          {hw.feedback && (
            <CardContent>
              <p className="text-sm font-medium">{s.feedback}</p>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{hw.feedback}</p>
            </CardContent>
          )}
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{s.instructions}</CardTitle>
        </CardHeader>
        <CardContent className="gap-4">
          {hw.instructions && <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{hw.instructions}</p>}
          {hw.attachments.length > 0 && <Files files={hw.attachments} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{s.yourAnswer}</CardTitle>
          {hw.submittedAt && (
            <CardDescription>
              {t.hw.status.submitted} · <LocalTime seconds={hw.submittedAt} />
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="gap-4">
          {hw.status === 'graded' ? (
            <>
              <Alert variant="info">
                <AlertDescription>{s.locked}</AlertDescription>
              </Alert>
              {hw.answer && <p className="whitespace-pre-wrap rounded-lg border bg-muted/40 p-4 text-sm">{hw.answer}</p>}
            </>
          ) : (
            <SubmitHomeworkForm homework={hw} />
          )}
          {hw.files.length > 0 && <Files files={hw.files} />}
        </CardContent>
      </Card>
    </div>
  )
}
