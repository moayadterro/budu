/** Parent ↔ teacher chat about one child. */
export type Conversation = {
  id: number
  parentId: number
  teacherId: number
  childId: number
  /** the other person, from the viewer's side */
  withId: number
  withName: string
  childName: string
  lastMessage: string
  /** unix seconds */
  lastMessageAt: number
  unread: number
}

export type Message = {
  id: number
  senderId: number
  body: string
  /** unix seconds, with milliseconds (receipts compare precisely) */
  createdAt: number
}

/**
 * What the OTHER person has received / seen (unix seconds): my message sent at t is delivered when
 * t ≤ deliveredAt, seen when t ≤ readAt.
 */
export type Receipts = { deliveredAt: number; readAt: number }

export type MessageStatus = 'sent' | 'delivered' | 'seen'

export const statusOf = (m: Message, r: Receipts): MessageStatus =>
  m.createdAt <= r.readAt ? 'seen' : m.createdAt <= r.deliveredAt ? 'delivered' : 'sent'

export const MAX_MESSAGE = 4000
