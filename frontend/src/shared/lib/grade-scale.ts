/**
 * Grade display scales (product rule: grades are STORED 0–100; a school picks how they're SHOWN).
 * Pure functions — usable on the server and in client components.
 */

export const GRADE_SCALES = [
  'percent',
  'letter',
  'gpa',
  'ects',
  'germany',
  'france',
  'russia',
  'russiaEcts',
  'ten',
  'japan',
] as const
export type GradeScale = (typeof GRADE_SCALES)[number]
export const DEFAULT_SCALE: GradeScale = 'percent'
export const isGradeScale = (v: unknown): v is GradeScale => typeof v === 'string' && (GRADE_SCALES as readonly string[]).includes(v)

/** First band whose minimum the grade reaches. */
const band = (g: number, bands: Array<[number, string]>, last: string) => bands.find(([min]) => g >= min)?.[1] ?? last
const oneDecimal = (n: number) => String(Math.round(n * 10) / 10)

/** A 0–100 grade in the given scale, e.g. 88 → "B+" | "4" | "17.6" | "88". */
export function formatGrade(grade: number, scale: GradeScale): string {
  const g = Math.max(0, Math.min(100, grade))
  switch (scale) {
    case 'percent':
      return oneDecimal(g)
    case 'letter':
      return band(g, [[97, 'A+'], [93, 'A'], [90, 'A-'], [87, 'B+'], [83, 'B'], [80, 'B-'], [77, 'C+'], [73, 'C'], [70, 'C-'], [67, 'D+'], [63, 'D'], [60, 'D-']], 'F')
    case 'gpa':
      return band(g, [[93, '4.0'], [90, '3.7'], [87, '3.3'], [83, '3.0'], [80, '2.7'], [77, '2.3'], [73, '2.0'], [70, '1.7'], [67, '1.3'], [65, '1.0']], '0.0')
    case 'ects':
      return band(g, [[90, 'A'], [80, 'B'], [70, 'C'], [65, 'D'], [60, 'E']], 'F')
    case 'germany':
      return band(g, [[90, '1'], [80, '2'], [65, '3'], [50, '4']], '5')
    case 'france':
      return oneDecimal(Math.round((g / 5) * 2) / 2)
    case 'russia':
      return band(g, [[85, '5'], [70, '4'], [50, '3']], '2')
    case 'russiaEcts':
      return band(g, [[90, '5A'], [82, '4B'], [75, '4C'], [67, '3D'], [60, '3E']], '2F')
    case 'ten':
      return oneDecimal(g / 10)
    case 'japan':
      return band(g, [[90, 'S'], [80, 'A'], [70, 'B'], [60, 'C']], 'F')
  }
}

/** "out of" suffix where it helps (0–100 → "/ 100", France → "/ 20"); letters need none. */
export function scaleMax(scale: GradeScale): string | null {
  return { percent: '/ 100', france: '/ 20', ten: '/ 10', gpa: '/ 4.0' }[scale as string] ?? null
}

/** Colour band of a 0–100 grade, independent of the scale: good ≥ 85, ok ≥ 60, else low. */
export const gradeTone = (g: number): 'good' | 'ok' | 'low' => (g >= 85 ? 'good' : g >= 60 ? 'ok' : 'low')
