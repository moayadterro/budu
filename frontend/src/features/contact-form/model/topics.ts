export const CONTACT_TOPICS = ['general', 'school', 'support', 'billing', 'partnership'] as const
export type ContactTopic = (typeof CONTACT_TOPICS)[number]
export const isContactTopic = (v: unknown): v is ContactTopic => CONTACT_TOPICS.includes(v as ContactTopic)
