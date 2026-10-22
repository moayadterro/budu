/** Letters of right-to-left scripts (Arabic incl. Persian/Urdu forms, Hebrew, Syriac, Thaana). */
const RTL = /[֐-ࣿיִ-﷿ﹰ-﻿]/g
const LTR = /[A-Za-zÀ-ɏͰ-ϿЀ-ӿ]/g

/**
 * The direction of a piece of content WRITTEN BY PEOPLE (not our UI): right-to-left when most of its
 * letters are Arabic / Hebrew. For single strings in markup prefer `dir="auto"` (the browser decides
 * from the first strong letter); use this to lay out a whole page by its content's language.
 */
export function contentDir(...texts: string[]): 'rtl' | 'ltr' {
  const all = texts.join(' ')
  return (all.match(RTL)?.length ?? 0) > (all.match(LTR)?.length ?? 0) ? 'rtl' : 'ltr'
}
