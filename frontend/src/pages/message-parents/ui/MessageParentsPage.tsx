import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getFamily, teachesChild } from '@/entities/family/server'
import { requireRole } from '@/entities/session/server'
import { getUserById } from '@/entities/user/server'
import { StartConversationButton } from '@/features/chat'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Icon } from '@/shared/ui/icon'
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/shared/ui/item'
import { PersonAvatar } from '@/shared/ui/person-avatar'
import { getT } from '@/shared/i18n/server'

/** Teacher: the parents of one of their students, to start a conversation (/messages/new?student=…). */
export async function MessageParentsPage(props: { searchParams: Promise<{ student?: string }> }) {
  const user = await requireRole('teacher', 'manager')
  const studentId = Number((await props.searchParams).student)
  if (!Number.isSafeInteger(studentId) || studentId <= 0 || !(await teachesChild(user.userId, studentId))) notFound()
  const t = await getT()
  const s = t.messages
  const [student, { parents }] = await Promise.all([getUserById(studentId), getFamily(studentId)])
  if (!student) notFound()
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <Button variant="ghost" size="sm" className="-ms-2 w-fit" asChild>
        <Link href="/messages">
          <Icon name="back" className="rtl:-scale-x-100" />
          {s.back}
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{s.parentsOf(student.name)}</CardTitle>
          <CardDescription>{s.parentsOfSub}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {parents.length === 0 && <p className="text-sm text-muted-foreground">{s.noParentsOf(student.name)}</p>}
          {parents.map((p) => (
            <Item key={p.id} size="sm" variant="outline">
              <ItemMedia>
                <PersonAvatar person={p} />
              </ItemMedia>
              <ItemContent className="min-w-0">
                <ItemTitle className="truncate">{p.name}</ItemTitle>
                <ItemDescription className="truncate">{p.email}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <StartConversationButton childId={studentId} withId={p.id} />
              </ItemActions>
            </Item>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
