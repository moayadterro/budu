'use client'

import { useRouter } from 'next/navigation'
import { useLiveEvent } from '@/shared/lib/live-events'

/** The conversation list updates live: a new message anywhere → re-render (last message, unread, order). */
export function LiveConversations() {
  const router = useRouter()
  useLiveEvent('chat', () => router.refresh(), () => router.refresh())
  return null
}
