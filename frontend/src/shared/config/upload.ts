/**
 * Largest lesson file (video, PDF …) a teacher can upload, in MB. Keep below
 * IOMAD's PHP `upload_max_filesize`/`post_max_size` (256M, iomad/php.ini) and
 * the server-action / proxy body limits in next.config.js.
 */
export const MAX_UPLOAD_MB = 250
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024
