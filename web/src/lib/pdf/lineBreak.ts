/**
 * react-pdf hyphenates aggressively by default, which mangles prose and produces odd breaks in
 * long URLs. The DOM layout relied on Tailwind `break-all` for URL lines; react-pdf has no such
 * property, so breaking is expressed here instead.
 *
 * Short tokens are never broken. Longer ones break only after URL punctuation, and a single
 * unbroken run (a long hash or slug) is hard-chunked so it cannot overflow the content box.
 */

/** Break after URL punctuation, keeping the delimiter on the preceding chunk. */
const URL_BREAK_AFTER = /(?<=[/\-_.?&=:@+~%#])/

/** Below this, leave the token alone — keeps Hungarian/German compounds intact. */
const MIN_BREAKABLE_LENGTH = 18

/** A single run longer than this cannot fit a URL line, so chunk it. */
const MAX_UNBROKEN_RUN = 32

export function splitForPdfLineBreak(word: string): string[] {
  if (word.length <= MIN_BREAKABLE_LENGTH) return [word]
  const parts = word.split(URL_BREAK_AFTER).filter(Boolean)
  return parts.flatMap((part) =>
    part.length > MAX_UNBROKEN_RUN ? (part.match(new RegExp(`.{1,${MAX_UNBROKEN_RUN}}`, 'g')) ?? [part]) : part,
  )
}
