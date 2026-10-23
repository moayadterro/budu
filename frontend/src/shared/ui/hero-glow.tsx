/**
 * The soft background behind a public page's hero, plus a fine dot texture. Each blur is ONE hue
 * (never mixed inside a shape); no visible box: the shapes sit well inside a large area that fades
 * out to its edges; motion only when allowed. Put it first inside a `relative isolate` section.
 * - `brand` (Pricing): green at the top-start, blue at the bottom-end, drifting gently.
 * - `talk` (Contact, owner: "make it alive", colours of contact with people): sky blue (trust),
 *   a warm rose (friendliness; orange is not allowed on public pages) and lavender between them,
 *   each wandering slowly around the whole hero on its own path.
 */
export function HeroGlow({ tone = 'brand' }: { tone?: 'brand' | 'talk' }) {
  if (tone === 'talk') {
    return (
      <>
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-32 -top-60 -bottom-48 -z-10 overflow-hidden [mask-image:radial-gradient(ellipse_closest-side_at_50%_50%,#000_60%,transparent_100%)]"
        >
          <div className="absolute start-[8%] top-[12%] h-[19rem] w-[28rem] max-w-[50%] rounded-full bg-info/16 blur-[90px] motion-safe:animate-wander-1 dark:bg-info/22" />
          <div className="absolute end-[6%] top-[30%] h-[18rem] w-[26rem] max-w-[48%] rounded-full bg-glow-rose/18 blur-[90px] motion-safe:animate-wander-2 dark:bg-glow-rose/18" />
          <div className="absolute start-[30%] bottom-[8%] h-[16rem] w-[24rem] max-w-[45%] rounded-full bg-subject-purple/11 blur-[90px] motion-safe:animate-wander-3 dark:bg-subject-purple/16" />
        </div>
        <div aria-hidden className="pointer-events-none absolute -inset-x-4 -top-20 bottom-0 -z-10 bg-dots" />
      </>
    )
  }
  return (
    <>
      {/* no visible box: the shapes sit well inside a large area (their blur fades to nothing before
          any edge), and the area itself fades out softly all the way to its edges */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-32 -top-60 -bottom-48 -z-10 overflow-hidden [mask-image:radial-gradient(ellipse_closest-side_at_50%_50%,#000_60%,transparent_100%)]"
      >
        <div className="absolute start-[7%] top-[14%] h-[20rem] w-[30rem] max-w-[55%] rounded-full bg-primary/30 blur-[90px] motion-safe:animate-aurora dark:bg-primary/35" />
        <div className="absolute end-[7%] bottom-[12%] h-[18rem] w-[28rem] max-w-[50%] rounded-full bg-info/28 blur-[90px] [animation-delay:-7s] [animation-direction:alternate-reverse] motion-safe:animate-aurora dark:bg-info/35" />
      </div>
      <div aria-hidden className="pointer-events-none absolute -inset-x-4 -top-20 bottom-0 -z-10 bg-dots" />
    </>
  )
}
