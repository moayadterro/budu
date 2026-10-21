import { cn } from '@/shared/lib/cn'

/**
 * The Budu logo (source: src/assets/logo.svg): the steps mark + the "Буду" wordmark, coloured by the
 * `logo-mark` / `logo-text` tokens so it follows light/dark mode. `mark` = the steps alone (favicon-like
 * places: the collapsed sidebar). Size it by height: `className="h-8 w-auto"`.
 */
export function Logo({ mark, className, label = 'Budu' }: { mark?: boolean; className?: string; label?: string }) {
  return (
    <svg
      viewBox={mark ? '0 0 319 294' : '0 0 1318 390'}
      role="img"
      aria-label={label}
      className={cn('flex-none', className ?? (mark ? 'size-8' : 'h-8 w-auto'))}
    >
      <g className="fill-logo-mark">
      <rect x="0" y="230.23" width="267.85" height="63.77" rx="11.48" />
      <rect x="63.77" y="153.7" width="229.59" height="63.77" rx="11.48" />
      <rect x="127.55" y="77.17" width="191.32" height="63.77" rx="11.48" />
      <circle cx="248.72" cy="28.06" r="28.06" />
      </g>
      {!mark && (
        <path
          transform="translate(398.56 294)"
          className="fill-logo-text"
          d="M119 6.4Q87.8 6 66.2 -7.5Q44.6 -21 32.3 -44.9Q20 -68.8 17 -100.4Q15.4 -117.4 16.3 -138.7Q17.2 -160 20.8 -180.6Q24.4 -201.2 31 -216Q37.4 -229.8 47.5 -241.3Q57.6 -252.8 69 -260.8Q82.4 -270.2 97.8 -275.3Q113.2 -280.4 130.2 -283.2Q147.2 -286 165.5 -288.2Q183.8 -290.4 202.6 -294L207.4 -246Q196 -243 181.4 -241.6Q166.8 -240.2 151.4 -238.7Q136 -237.2 122 -234Q108 -230.8 97.8 -224.4Q84 -215.8 76.7 -200.5Q69.4 -185.2 68.2 -169.6Q80.6 -187.6 98.5 -194.4Q116.4 -201.2 133.8 -201.2Q162.4 -201.2 182.9 -187.5Q203.4 -173.8 214.4 -150.7Q225.4 -127.6 225.4 -99.6Q225.4 -67.8 211.7 -43.8Q198 -19.8 174 -6.5Q150 6.8 119 6.4ZM121.4 -44.4Q144.6 -44.4 156.4 -58.8Q168.2 -73.2 168.2 -97.2Q168.2 -121.8 156.1 -135.9Q144 -150 121.4 -150Q98.4 -150 86.5 -135.9Q74.6 -121.8 74.6 -97.2Q74.6 -71.8 86.8 -58.1Q99 -44.4 121.4 -44.4ZM285 96 326.6 -18.4 327.4 15.2 233.4 -216H289.8L353 -52.4H340.2L403 -216H457.4L335.4 96ZM457.4 48V-42Q474.6 -42 481.9 -54Q489.2 -66 493.4 -96.8Q495.8 -114.6 497.5 -134.2Q499.2 -153.8 500.4 -174.4Q501.6 -195 502.6 -216H669.4V-42H691.4V48H640.2V0H508.6V48ZM527 -42H615V-174H549.8Q549.2 -163 548.5 -152Q547.8 -141 546.9 -130.2Q546 -119.4 545.2 -109.3Q544.4 -99.2 543.4 -90Q541.6 -72.4 538.4 -61.4Q535.2 -50.4 527 -42ZM747 96 788.6 -18.4 789.4 15.2 695.4 -216H751.8L815 -52.4H802.2L865 -216H919.4L797.4 96Z"
        />
      )}
    </svg>
  )
}
