'use server'

import { redirect } from 'next/navigation'
import { MAX_MESSAGE, type Message } from '@/entities/conversation'
import { getConversation, listMessages, markConversationRead, openConversation, sendMessage } from '@/entities/conversation/server'
import { childOf, getFamily, teachesChild } from '@/entities/family/server'
import { notify } from '@/entities/notification/server'
import { getSession, requireRole } from '@/entities/session/server'
import { getUserById } from '@/entities/user/server'
import { formId } from '@/shared/lib/form'

/**
 * Start (or reopen) a conversation. A parent writes to a teacher of one of their child's courses;
 * a teacher writes to a parent of a student in one of their courses.
 */
export async function startConversationAction(form: FormData) {
  const user = await requireRole('parent', 'teacher', 'manager')
  const childId = formId(form, 'childId')
  const withId = formId(form, 'withId')
  if (!childId || !withId) return
  let id: number
  if (user.role === 'parent') {
    if (!(await childOf(user.userId, childId)) || !(await teachesChild(withId, childId))) return
    id = await openConversation(user.userId, withId, childId)
  } else {
    if (!(await teachesChild(user.userId, childId))) return
    if (!(await getFamily(childId)).parents.some((p) => p.id === withId)) return
    id = await openConversation(withId, user.userId, childId)
  }
  redirect(`/messages/${id}`)
}

export type SendResult = { ok: true; message: Message } | { ok: false }

/** Send a message; the other side is notified (bell + email) unless they already have unread ones. */
export async function sendMessageAction(conversationId: number, text: string): Promise<SendResult> {
  const user = await getSession()
  if (!user || !Number.isSafeInteger(conversationId)) return { ok: false }
  const body = String(text ?? '').trim()
  if (!body || body.length > MAX_MESSAGE) return { ok: false }
  const c = await getConversation(user.userId, conversationId)
  if (!c) return { ok: false }
  const { message, recipientHadUnread } = await sendMessage(c, user.userId, body)
  if (!recipientHadUnread) {
    const to = await getUserById(c.withId)
    if (to) {
      const preview = body.length > 140 ? `${body.slice(0, 140)}…` : body
      await notify([to], 'newMessage', { from: user.name, child: c.childName, preview }, `/messages/${c.id}`)
    }
  }
  return { ok: true, message }
}

/** New messages since `afterId` (the open thread asks when /events says one arrived); marks the conversation read. */
export async function pollMessagesAction(conversationId: number, afterId: number): Promise<Message[]> {
  const user = await getSession()
  if (!user || !Number.isSafeInteger(conversationId) || !Number.isSafeInteger(afterId)) return []
  const c = await getConversation(user.userId, conversationId)
  if (!c) return []
  const messages = await listMessages(c.id, Math.max(0, afterId))
  if (messages.length) await markConversationRead(user.userId, c.id)
  return messages
}
