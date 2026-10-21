import 'server-only'
import { handleUpload } from '@/features/upload-material/server'

/**
 * /uploads — resumable uploads (tus) of lesson materials. The second route handler in the app (next to
 * /files): uploads in 5 MB pieces with resume can't be done with server actions. The feature checks
 * the session and course rights on creation and the owner on every later request.
 */
const handle = (req: Request) => handleUpload(req)

export { handle as GET, handle as HEAD, handle as POST, handle as PATCH, handle as DELETE, handle as OPTIONS }
