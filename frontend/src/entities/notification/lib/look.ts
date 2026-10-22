import type { IconName } from '@/shared/ui/icon'
import type { NotificationKind } from '../model/types'

/** How each kind of notification looks in the bell: an icon and a token tint, so a row is recognised at a glance. */
type Look = { icon: IconName; tone: 'primary' | 'info' | 'success' | 'warning' | 'highlight' | 'muted' }

const LOOK: Record<NotificationKind, Look> = {
  enrolled: { icon: 'book', tone: 'primary' },
  homeworkNew: { icon: 'task', tone: 'warning' },
  homeworkSubmitted: { icon: 'task', tone: 'info' },
  homeworkGraded: { icon: 'star', tone: 'success' },
  addedToSchool: { icon: 'users', tone: 'primary' },
  addedToClass: { icon: 'layers', tone: 'primary' },
  schoolInvite: { icon: 'userAdd', tone: 'primary' },
  inviteAnswered: { icon: 'userAdd', tone: 'muted' },
  schoolEvent: { icon: 'cal', tone: 'highlight' },
  parentRequest: { icon: 'userAdd', tone: 'primary' },
  parentAnswered: { icon: 'users', tone: 'muted' },
  newMessage: { icon: 'chat', tone: 'primary' },
  announcement: { icon: 'megaphone', tone: 'highlight' },
  orderConfirmed: { icon: 'wallet', tone: 'success' },
  orderRejected: { icon: 'wallet', tone: 'warning' },
  quizPublished: { icon: 'check', tone: 'info' },
  quizToGrade: { icon: 'check', tone: 'warning' },
  quizGraded: { icon: 'star', tone: 'success' },
  examResult: { icon: 'star', tone: 'success' },
  quizReminder: { icon: 'clock', tone: 'warning' },
  examInvite: { icon: 'check', tone: 'info' },
  examNudge: { icon: 'clock', tone: 'warning' },
}

export const notificationLook = (kind: NotificationKind): Look => LOOK[kind] ?? { icon: 'bell', tone: 'muted' }
