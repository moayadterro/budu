import 'server-only'
import { openAsBlob } from 'node:fs'
import { FileStore } from '@tus/file-store'
import { Server, type Upload } from '@tus/server'
import { COURSE_LIMITS } from '@/entities/course'
import { addMaterial, getCourse } from '@/entities/course/server'
import { getSession } from '@/entities/session/server'
import { MAX_UPLOAD_BYTES } from '@/shared/config/upload'

/**
 * Resumable uploads of lesson materials (tus protocol, https://tus.io): the browser sends 5 MB pieces
 * to /uploads; a dropped connection or a reload continues where it stopped. When the last piece
 * arrives the file goes to IOMAD exactly like a normal upload (addMaterial), then the pieces are
 * deleted. Unfinished uploads expire after a day. SERVER-SIDE ONLY.
 *
 * Security: only a signed-in teacher of the course can start one; every later request is checked
 * against the upload's owner (the upload id alone is not enough).
 */

const DIR = process.env.UPLOAD_DIR || '/uploads'
const DAY_MS = 24 * 60 * 60 * 1000

type Meta = { courseId: string; lessonId: string; name: string; filename: string; filetype: string; userId: string }

class Rejected {
  constructor(
    public status_code: number,
    public body: string,
  ) {}
}

const g = globalThis as unknown as { __buduTus?: { server: Server; store: FileStore } }

function create() {
  const store = new FileStore({ directory: DIR, expirationPeriodInMilliseconds: DAY_MS })
  const server = new Server({
    path: '/uploads',
    datastore: store,
    relativeLocation: true,
    maxSize: MAX_UPLOAD_BYTES,
    async onUploadCreate(_req, upload) {
      const user = await getSession()
      if (!user || (user.role !== 'teacher' && user.role !== 'manager')) throw new Rejected(403, 'forbidden')
      const m = (upload.metadata ?? {}) as Partial<Meta>
      const courseId = Number(m.courseId)
      const lessonId = Number(m.lessonId)
      if (!Number.isSafeInteger(courseId) || !Number.isSafeInteger(lessonId) || !m.filename) throw new Rejected(400, 'invalid')
      const course = await getCourse(user.userId, courseId)
      if (!course?.canEdit || !course.lessons.some((l) => l.id === lessonId)) throw new Rejected(403, 'forbidden')
      // the owner is set here, never taken from the browser
      return { metadata: { ...upload.metadata, userId: String(user.userId) } }
    },
    async onIncomingRequest(_req, uploadId) {
      if (!uploadId) return
      const user = await getSession()
      let owner: string | null | undefined
      try {
        owner = (await store.getUpload(uploadId)).metadata?.userId
      } catch {
        return // unknown id: tus answers 404 itself
      }
      if (!user || owner !== String(user.userId)) throw new Rejected(404, 'not found')
    },
    async onUploadFinish(_req, upload: Upload) {
      const m = upload.metadata as unknown as Meta
      const userId = Number(m.userId)
      const name = (m.name || m.filename.replace(/\.[^.]+$/, '') || m.filename).slice(0, COURSE_LIMITS.title)
      try {
        // streamed from disk — never the whole video in memory
        const blob = await openAsBlob(`${DIR}/${upload.id}`, { type: m.filetype || 'application/octet-stream' })
        await addMaterial(userId, Number(m.courseId), Number(m.lessonId), new File([blob], m.filename, { type: blob.type }), name)
      } catch (e) {
        console.error('resumable upload: moving to IOMAD failed', e)
        throw new Rejected(500, 'server')
      } finally {
        await store.remove(upload.id).catch(() => {})
      }
      return {}
    },
  })
  return { server, store }
}

const tus = () => (g.__buduTus ??= create())

/** Handle a tus request (POST / HEAD / PATCH / DELETE / OPTIONS on /uploads…). */
export const handleUpload = (req: Request) => tus().server.handleWeb(req)

const cleanup = globalThis as unknown as { __buduTusCleanup?: number }

/** Remove expired unfinished uploads (at most hourly per server process). */
export async function cleanUpUploads() {
  if (Date.now() - (cleanup.__buduTusCleanup ?? 0) < 60 * 60 * 1000) return
  cleanup.__buduTusCleanup = Date.now()
  try {
    await tus().server.cleanUpExpiredUploads()
  } catch (e) {
    console.error('upload cleanup failed', e)
  }
}
