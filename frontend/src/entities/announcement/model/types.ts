/** A school announcement (posted by a manager). */
export type Announcement = {
  id: number
  companyId: number
  school: string
  authorName: string
  title: string
  body: string
  /** unix seconds */
  createdAt: number
}
