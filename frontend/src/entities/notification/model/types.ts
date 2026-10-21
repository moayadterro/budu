/** What happened. The text is rendered from kind + params in the reader's language (t.notify.kinds). */
export type NotificationKind = 'enrolled' | 'homeworkNew' | 'homeworkSubmitted' | 'homeworkGraded' | 'addedToSchool' | 'addedToClass'

export type NotificationParams = Record<string, string>

export type AppNotification = {
  id: number
  kind: NotificationKind
  params: NotificationParams
  /** in-app path to open, e.g. /classes/3/homework/8 */
  link: string | null
  /** unix seconds */
  createdAt: number
  read: boolean
}

/** Who to notify: the IOMAD user, their email and name (for the email). */
export type Recipient = { id: number; email: string; name: string }
