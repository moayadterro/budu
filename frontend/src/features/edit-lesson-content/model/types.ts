export type ContentFormError = 'invalid' | 'tooLong' | 'noFile' | 'tooBig' | 'server'
export type ContentFormState = { status: 'idle' } | { status: 'saved'; at: number } | { status: 'error'; error: ContentFormError }
