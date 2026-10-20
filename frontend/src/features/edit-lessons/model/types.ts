export type LessonFormError = 'invalid' | 'tooLong' | 'server'
export type LessonFormState = { status: 'idle' } | { status: 'saved'; at: number } | { status: 'error'; error: LessonFormError }
