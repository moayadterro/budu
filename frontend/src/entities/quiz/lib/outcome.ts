/** Where no pass mark is set, this is the line between "fine" and "needs more work" (0–100). */
export const DEFAULT_PASS = 60
/** At or above this a result is "excellent" (the star). */
export const EXCELLENT = 85

export type Outcome = 'excellent' | 'passed' | 'failed'

/**
 * How a 0–100 grade did: below the pass mark (or 60% when none is set) = failed; at or above it =
 * passed; 85%+ = excellent. One rule for the result page, the quiz page and the teacher's list.
 */
export function outcomeOf(grade: number, passMark: number): Outcome {
  const line = passMark > 0 ? passMark : DEFAULT_PASS
  if (grade < line) return 'failed'
  return grade >= EXCELLENT ? 'excellent' : 'passed'
}

/** Token colour per outcome (text / ring). Always shown together with an icon and words, never alone. */
export const outcomeTone: Record<Outcome, 'success' | 'destructive'> = { excellent: 'success', passed: 'success', failed: 'destructive' }
