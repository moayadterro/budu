'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { Upload } from 'tus-js-client'
import { COURSE_LIMITS } from '@/entities/course'
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MB } from '@/shared/config/upload'
import { formatBytes } from '@/shared/lib/format'
import { Alert } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Field } from '@/shared/ui/field'
import { FilePicker } from '@/shared/ui/file-picker'
import { Icon } from '@/shared/ui/icon'
import { Input } from '@/shared/ui/input'
import { Progress } from '@/shared/ui/progress'
import { useT } from '@/shared/i18n'

const ACCEPT = 'video/*,application/pdf,image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.odt,.odp,.ods,.txt'
const CHUNK = 5 * 1024 * 1024
/** waits between retries when a piece fails (the connection dropped …) — then keep trying every minute */
const RETRIES = [1000, 3000, 5000, 10000, 20000, 30000, ...Array(60).fill(60000)]

type Phase = 'idle' | 'uploading' | 'offline' | 'processing' | 'error'

/**
 * Upload a video / PDF / document into a lesson — resumable (tus): sent in 5 MB pieces, a dropped
 * connection pauses it and it continues from the last piece when the internet is back; choosing the
 * same file again after a reload continues too. Progress, speed, time left, cancel.
 */
export function MaterialForm({ courseId, lessonId, onDone }: { courseId: number; lessonId: number; onDone: () => void }) {
  const t = useT()
  const s = t.courses
  const u = s.uploadState
  const router = useRouter()
  const upload = useRef<Upload | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(0)
  const [total, setTotal] = useState(0)
  const [resumed, setResumed] = useState(false)
  const [rate, setRate] = useState(0) // bytes / second
  const sample = useRef<{ at: number; bytes: number } | null>(null)

  // offline → say so (tus keeps retrying); back online → nudge it to continue at once
  useEffect(() => {
    const off = () => phase === 'uploading' && setPhase('offline')
    const on = () => {
      if (phase === 'offline' || phase === 'error') {
        setPhase('uploading')
        setError(null)
        upload.current?.start()
      }
    }
    window.addEventListener('offline', off)
    window.addEventListener('online', on)
    return () => {
      window.removeEventListener('offline', off)
      window.removeEventListener('online', on)
    }
  }, [phase])

  // leaving mid-upload loses the progress of the current piece — ask first
  useEffect(() => {
    if (phase !== 'uploading' && phase !== 'offline' && phase !== 'processing') return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [phase])

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const file = data.get('file')
    if (!(file instanceof File) || file.size === 0) return setError(s.errors.noFile)
    if (file.size > MAX_UPLOAD_BYTES) return setError(s.errors.tooBig)
    setError(null)
    setTotal(file.size)
    setSent(0)
    sample.current = null

    const up = new Upload(file, {
      endpoint: '/uploads',
      chunkSize: CHUNK,
      retryDelays: RETRIES,
      storeFingerprintForResuming: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        courseId: String(courseId),
        lessonId: String(lessonId),
        name: String(data.get('name') ?? '').trim().slice(0, COURSE_LIMITS.title),
        filename: file.name,
        filetype: file.type,
      },
      onProgress(bytes, of) {
        setSent(bytes)
        setPhase(bytes >= of ? 'processing' : navigator.onLine ? 'uploading' : 'offline')
        const now = Date.now()
        const last = sample.current
        if (!last) sample.current = { at: now, bytes }
        else if (now - last.at > 1500) {
          setRate(((bytes - last.bytes) * 1000) / (now - last.at))
          sample.current = { at: now, bytes }
        }
      },
      onShouldRetry(err, attempt) {
        if (!navigator.onLine) setPhase('offline')
        const status = (err as { originalResponse?: { getStatus(): number } }).originalResponse?.getStatus() ?? 0
        // don't retry what will never work (no access, too big …)
        return attempt < RETRIES.length && !(status >= 400 && status < 500 && status !== 409 && status !== 423)
      },
      onError(err) {
        const status = (err as { originalResponse?: { getStatus(): number } }).originalResponse?.getStatus() ?? 0
        setPhase('error')
        setError(status === 413 ? s.errors.tooBig : status === 403 || status === 404 ? s.errors.invalid : navigator.onLine ? u.failed : u.offlineStopped)
      },
      onSuccess() {
        setPhase('idle')
        router.refresh()
        onDone()
      },
    })
    upload.current = up
    // the same file was partly uploaded before (reload, closed tab …): continue it
    const previous = await up.findPreviousUploads()
    if (previous.length) {
      up.resumeFromPreviousUpload(previous[0])
      setResumed(true)
    }
    setPhase('uploading')
    up.start()
  }

  /** after an error: continue the same upload (from the last piece the server has) */
  const retry = () => {
    if (!upload.current) return
    setError(null)
    setPhase('uploading')
    upload.current.start()
  }

  const cancel = async () => {
    const up = upload.current
    upload.current = null
    setPhase('idle')
    if (up) await up.abort(true).catch(() => {}) // also deletes what was sent
  }

  const busy = phase !== 'idle' && phase !== 'error'
  const stalled = phase === 'error' && !!upload.current
  const pct = total ? Math.min(100, Math.round((sent / total) * 100)) : 0
  const left = rate > 0 ? Math.max(1, Math.round((total - sent) / rate)) : null

  return (
    <form onSubmit={submit} className="rounded-lg border bg-muted/40 p-4">
      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}
      {!busy && !stalled && (
        <>
          <div className="mb-4">
            <FilePicker name="file" label={s.addMaterial} hint={s.materialHint(MAX_UPLOAD_MB)} accept={ACCEPT} required />
          </div>
          <Field label={s.materialName}>
            <Input name="name" maxLength={COURSE_LIMITS.title} />
          </Field>
        </>
      )}
      {busy && (
        <div className="mb-4 flex flex-col gap-2" aria-live="polite">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 font-medium">
              <Icon name={phase === 'offline' ? 'alert' : 'upload'} className={phase === 'offline' ? 'text-warning' : 'text-primary'} />
              {phase === 'offline' ? u.offline : phase === 'processing' ? u.processing : resumed ? u.resuming : u.uploading}
            </span>
            <span className="tabular-nums text-muted-foreground">{pct}%</span>
          </div>
          <Progress value={pct} className="h-2" aria-label={u.uploading} />
          <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground tabular-nums">
            <span>
              {formatBytes(sent)} / {formatBytes(total)}
            </span>
            {phase === 'uploading' && rate > 0 && (
              <span>
                {formatBytes(rate)}/s{left !== null && <> · {u.left(left)}</>}
              </span>
            )}
          </div>
          {phase === 'offline' && <p className="text-xs text-muted-foreground">{u.offlineHint}</p>}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {stalled ? (
          <>
            <Button type="button" onClick={retry}>
              <Icon name="upload" />
              {u.retry(pct)}
            </Button>
            <Button type="button" variant="outline" onClick={cancel}>
              {u.cancel}
            </Button>
          </>
        ) : (
          !busy && (
            <Button type="submit">
              <Icon name="upload" />
              {s.upload}
            </Button>
          )
        )}
        {busy && phase !== 'processing' && (
          <Button type="button" variant="outline" onClick={cancel}>
            {u.cancel}
          </Button>
        )}
        {!busy && !stalled && (
          <Button type="button" variant="outline" onClick={onDone}>
            {s.cancel}
          </Button>
        )}
      </div>
    </form>
  )
}
