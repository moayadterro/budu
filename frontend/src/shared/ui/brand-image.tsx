'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/shared/lib/cn'

/**
 * A school's logo, icon or photo in a square tile that adapts to what was uploaded:
 * - logo / icon (transparent corners, or a very wide / tall image) → shown whole, centred with padding
 * - photo (opaque, roughly square) → fills the tile
 * Decided in the browser once the image loads (same-origin /files, so its pixels can be read).
 */
export function BrandImage({ src, alt = '', className }: { src: string; alt?: string; className?: string }) {
  const [fit, setFit] = useState<'contain' | 'cover' | null>(null)
  const ref = useRef<HTMLImageElement>(null)
  // already loaded before React hydrated (cache, fast network): onLoad won't fire — decide now
  useEffect(() => {
    const img = ref.current
    if (img?.complete) setFit(img.naturalWidth ? fitOf(img) : 'contain')
  }, [src])
  return (
    <span className={cn('grid place-items-center overflow-hidden bg-background', fit !== 'cover' && 'p-[10%]', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={ref}
        src={src}
        alt={alt}
        className={cn('size-full transition-opacity duration-200', fit === 'cover' ? 'object-cover' : 'object-contain', fit ? 'opacity-100' : 'opacity-0')}
        onLoad={(e) => setFit(fitOf(e.currentTarget))}
        onError={() => setFit('contain')}
      />
    </span>
  )
}

function fitOf(img: HTMLImageElement): 'contain' | 'cover' {
  const { naturalWidth: w, naturalHeight: h } = img
  if (!w || !h) return 'contain'
  const ratio = w / h
  if (ratio > 1.35 || ratio < 0.74) return 'contain' // a wordmark or a tall badge: never crop it
  try {
    const c = document.createElement('canvas')
    c.width = c.height = 8
    const x = c.getContext('2d', { willReadFrequently: true })
    if (!x) return 'contain'
    x.drawImage(img, 0, 0, 8, 8)
    const corners = [x.getImageData(0, 0, 1, 1), x.getImageData(7, 0, 1, 1), x.getImageData(0, 7, 1, 1), x.getImageData(7, 7, 1, 1)]
    return corners.some((d) => d.data[3] < 250) ? 'contain' : 'cover' // transparent corners = a logo
  } catch {
    return 'contain'
  }
}
