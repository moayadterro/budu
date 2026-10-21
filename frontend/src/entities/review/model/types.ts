/**
 * A course's rating from students who finished it (1–5 stars). With no reviews yet a course shows
 * 5.0 (owner: "the rating initially is 5"), marked as new.
 */
export type Rating = { average: number; count: number }

export type Review = { authorName: string; stars: number; comment: string; at: number }

/** what a student may do about a course's rating */
export type RatingAsk = { finished: boolean; dismissed: boolean; mine: { stars: number; comment: string } | null }

export const REVIEW_LIMITS = { comment: 1000 } as const

export const NO_RATING: Rating = { average: 5, count: 0 }
