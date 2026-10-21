import 'server-only'
import { query } from '@/shared/server/db'
import { defaultInstance, iomadCall } from '@/shared/server/iomad'
import type { Conversation, Message } from '../model/types'

/**
 * Parent ↔ teacher conversations in app-db (`conversations`, `messages`). Plain functions over the
 * database with no Next.js dependency, so they can move into a separate backend service later.
 * Callers decide who may start a conversation (family rules); here, only participants read or write.
 * SERVER-SIDE ONLY.
 */

type Row = {
  id: string
  parent_id: number
  teacher_id: number
  child_id: number
  last_message_at: number
  last_message: string | null
  unread: number
}

async function names(ids: number[]) {
  const unique = [...new Set(ids)]
  if (!unique.length) return new Map<number, string>()
  const users = await iomadCall<Array<{ id: number; fullname: string }>>(defaultInstance(), 'core_user_get_users_by_field', {
    field: 'id',
    values: unique,
  })
  return new Map(users.map((u) => [u.id, u.fullname]))
}

const SELECT = `
  SELECT c.id, c.parent_id, c.teacher_id, c.child_id, extract(epoch FROM c.last_message_at)::int AS last_message_at,
         (SELECT body FROM messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_message,
         (SELECT count(*)::int FROM messages m WHERE m.conversation_id = c.id AND m.sender_id <> $1
             AND m.created_at > CASE WHEN c.parent_id = $1 THEN c.parent_read_at ELSE c.teacher_read_at END) AS unread
    FROM conversations c`

async function toConversations(userId: number, rows: Row[]): Promise<Conversation[]> {
  const n = await names(rows.flatMap((r) => [r.parent_id, r.teacher_id, r.child_id]))
  return rows.map((r) => {
    const withId = r.parent_id === userId ? r.teacher_id : r.parent_id
    return {
      id: Number(r.id),
      parentId: r.parent_id,
      teacherId: r.teacher_id,
      childId: r.child_id,
      withId,
      withName: n.get(withId) ?? '',
      childName: n.get(r.child_id) ?? '',
      lastMessage: r.last_message ?? '',
      lastMessageAt: r.last_message_at,
      unread: r.unread,
    }
  })
}

/** The user's conversations (as parent or teacher), most recent first. */
export async function listConversations(userId: number): Promise<Conversation[]> {
  const rows = await query<Row>(`${SELECT} WHERE c.parent_id = $1 OR c.teacher_id = $1 ORDER BY c.last_message_at DESC LIMIT 100`, [userId])
  return toConversations(userId, rows)
}

/** One conversation, if the user takes part in it. */
export async function getConversation(userId: number, id: number): Promise<Conversation | null> {
  const rows = await query<Row>(`${SELECT} WHERE c.id = $2 AND (c.parent_id = $1 OR c.teacher_id = $1)`, [userId, id])
  return (await toConversations(userId, rows))[0] ?? null
}

/** The conversation for this parent + teacher + child (created if new). Returns its id. */
export async function openConversation(parentId: number, teacherId: number, childId: number): Promise<number> {
  const [row] = await query<{ id: string }>(
    `INSERT INTO conversations (parent_id, teacher_id, child_id) VALUES ($1, $2, $3)
     ON CONFLICT (parent_id, teacher_id, child_id) DO UPDATE SET parent_id = EXCLUDED.parent_id
     RETURNING id`,
    [parentId, teacherId, childId],
  )
  return Number(row.id)
}

/** Messages after `afterId` (0 = the latest 200), oldest first. Caller checked participation. */
export async function listMessages(conversationId: number, afterId = 0): Promise<Message[]> {
  const rows = await query<{ id: string; sender_id: number; body: string; created: number }>(
    afterId
      ? `SELECT id, sender_id, body, extract(epoch FROM created_at)::int AS created FROM messages
          WHERE conversation_id = $1 AND id > $2 ORDER BY id`
      : `SELECT * FROM (SELECT id, sender_id, body, extract(epoch FROM created_at)::int AS created FROM messages
          WHERE conversation_id = $1 AND $2 = 0 ORDER BY id DESC LIMIT 200) m ORDER BY id`,
    [conversationId, afterId],
  )
  return rows.map((r) => ({ id: Number(r.id), senderId: r.sender_id, body: r.body, createdAt: r.created }))
}

/**
 * Adds a message. Returns it, and whether the recipient already had unread messages from before
 * (then they were notified already — notify only on the first unread one, so a chat isn't an email per line).
 */
export async function sendMessage(c: Conversation, senderId: number, body: string): Promise<{ message: Message; recipientHadUnread: boolean }> {
  const recipientIsParent = c.parentId !== senderId
  const [prior] = await query<{ n: number }>(
    `SELECT count(*)::int AS n FROM messages m JOIN conversations c ON c.id = m.conversation_id
      WHERE c.id = $1 AND m.sender_id = $2
        AND m.created_at > CASE WHEN $3 THEN c.parent_read_at ELSE c.teacher_read_at END`,
    [c.id, senderId, recipientIsParent],
  )
  const [row] = await query<{ id: string; created: number }>(
    `WITH m AS (INSERT INTO messages (conversation_id, sender_id, body) VALUES ($1, $2, $3) RETURNING id, created_at)
     UPDATE conversations SET last_message_at = (SELECT created_at FROM m),
            ${recipientIsParent ? 'teacher_read_at' : 'parent_read_at'} = (SELECT created_at FROM m)
      WHERE id = $1
     RETURNING (SELECT id FROM m) AS id, extract(epoch FROM (SELECT created_at FROM m))::int AS created`,
    [c.id, senderId, body],
  )
  return {
    message: { id: Number(row.id), senderId, body, createdAt: row.created },
    recipientHadUnread: (prior?.n ?? 0) > 0,
  }
}

/** The user has seen the conversation up to now. */
export async function markConversationRead(userId: number, id: number) {
  await query(
    `UPDATE conversations SET
        parent_read_at  = CASE WHEN parent_id = $1 THEN now() ELSE parent_read_at END,
        teacher_read_at = CASE WHEN teacher_id = $1 THEN now() ELSE teacher_read_at END
      WHERE id = $2 AND (parent_id = $1 OR teacher_id = $1)`,
    [userId, id],
  )
}

/** Unread messages across all of the user's conversations (nav badge). */
export async function unreadMessages(userId: number): Promise<number> {
  const [row] = await query<{ n: number }>(
    `SELECT count(*)::int AS n FROM messages m JOIN conversations c ON c.id = m.conversation_id
      WHERE (c.parent_id = $1 OR c.teacher_id = $1) AND m.sender_id <> $1
        AND m.created_at > CASE WHEN c.parent_id = $1 THEN c.parent_read_at ELSE c.teacher_read_at END`,
    [userId],
  )
  return row?.n ?? 0
}
