import type { Messages } from '@/shared/i18n'
import type { NotificationKind, NotificationParams } from '../model/types'

/** Title + body of a notification in the given language. `role` params are role keys, translated here. */
export function renderNotification(t: Messages, kind: NotificationKind, params: NotificationParams) {
  const p = { ...params }
  if (p.role && p.role in t.role) p.role = t.role[p.role as keyof Messages['role']]
  const k = t.notify.kinds[kind]
  return { title: k.title(p), body: k.body(p) }
}
