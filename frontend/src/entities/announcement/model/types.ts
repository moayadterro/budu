/** Who an announcement is for: everyone in the school, one class, or one course. */
export type Audience = 'school' | 'class' | 'course'

/** An announcement: from a school manager (school / class) or a course teacher (course). */
export type Announcement = {
  id: number
  /** the school (IOMAD company) it belongs to — for a course, the course's company */
  companyId: number
  school: string
  audience: Audience
  /** class or course id; null for the whole school */
  targetId: number | null
  /** class or course name, '' for the whole school */
  targetName: string
  authorId: number
  authorName: string
  title: string
  body: string
  /** unix seconds */
  createdAt: number
}

/**
 * What a reader may see: whole-school announcements of `schools`, class ones of `classes`, course
 * ones of `courses`, and everything (any audience) belonging to `allOf` (a school's managers).
 */
export type AnnouncementScope = { schools?: number[]; classes?: number[]; courses?: number[]; allOf?: number[] }
