export type CourseFormError = 'invalid' | 'tooLong' | 'server'
export type CourseFormState = { status: 'idle' } | { status: 'saved' } | { status: 'error'; error: CourseFormError }
