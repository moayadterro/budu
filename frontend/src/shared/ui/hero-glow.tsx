/**
 * The soft background behind a public page's hero (Pricing, Contact …): a light green blur at the
 * top-start and a blue one at the bottom-end, each one hue, drifting slowly (still when motion is
 * off), plus a fine dot texture. No visible box: the shapes sit well inside a large area that fades
 * out to its edges. Put it first inside a `relative isolate` hero section.
 */
export function HeroGlow() {
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
