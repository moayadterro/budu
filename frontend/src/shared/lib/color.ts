/** Blend a token colour into a base token, e.g. a subject colour into the surface. */
export const tint = (color: string, pct: number, base = 'var(--color-card)') =>
  `color-mix(in srgb, ${color} ${pct}%, ${base})`
