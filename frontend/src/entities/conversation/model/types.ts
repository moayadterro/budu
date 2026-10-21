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
  /** unix seconds */
  createdAt: number
}

export const MAX_MESSAGE = 4000
