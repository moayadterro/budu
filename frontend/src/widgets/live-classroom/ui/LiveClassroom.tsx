'use client'

import { useRouter } from 'next/navigation'
import { ReactNode, useState } from 'react'
import { useSession } from '@/entities/session'
import { HangUpIcon, Icon, IconName, RecIcon } from '@/shared/ui/icon'
import { LIVE_CLASS } from '@/shared/mock'
import { cn } from '@/shared/lib/cn'
import { useT } from '@/shared/i18n'

/**
 * Live classroom (BigBlueButton-style). Visual only for now: controls toggle
 * local state; the real session will be the BBB join URL / embed.
 */
export function LiveClassroom() {
  const t = useT()
  const role = useSession((s) => s.user.role)
  const router = useRouter()
  const host = role === 'teacher'
  const [board, setBoard] = useState(false)
  const [on, setOn] = useState<Record<string, boolean>>({ mic: host, cam: host, share: true, rec: true, hand: false })
  const [panel, setPanel] = useState<'chat' | 'people'>('chat')
  const flip = (k: string) => setOn((s) => ({ ...s, [k]: !s[k] }))
  const leave = () => router.push('/home')

  const ctl = (k: string, icon: IconName | ReactNode, label: string, active?: string) => (
    <button
      key={k}
      aria-label={label}
      aria-pressed={!!on[k]}
      onClick={() => flip(k)}
      className={cn(
        'grid h-11 w-11 place-items-center rounded-xl transition-colors [&_svg]:h-[19px] [&_svg]:w-[19px]',
        active && on[k] ? active : !on[k] && (k === 'mic' || k === 'cam') ? 'bg-destructive text-primary-foreground' : 'bg-live-raised text-live-foreground',
      )}
    >
      {typeof icon === 'string' ? <Icon name={icon as IconName} /> : icon}
    </button>
  )

  return (
    <>
      <div className="mb-3.5">
        <div className="text-[11px] font-bold uppercase tracking-[.1em] text-destructive">{t.live.eyebrow}</div>
        <h1 className="mt-[3px] text-xl font-bold">{LIVE_CLASS.title}</h1>
      </div>

      <div className="mb-3 flex items-center gap-2.5 rounded-xl border border-live-line bg-live-panel px-[13px] py-2.5 text-[12.5px] leading-snug text-live-muted">
        <span className={cn('grid h-[30px] w-[30px] flex-none place-items-center rounded-[9px] text-primary-foreground', host ? 'bg-primary' : 'bg-live-raised')}>
          <Icon name={host ? 'users' : 'hand'} className="h-4 w-4" />
        </span>
        <span>
          <b className="text-live-foreground">{host ? t.role.teacher : t.role.student}</b> — {host ? t.live.bannerTeacher : t.live.bannerStudent}
        </span>
      </div>

      <div className="grid min-h-[450px] overflow-hidden rounded-xl bg-live text-live-foreground lg:grid-cols-[1fr_272px]">
        <div className="flex min-w-0 flex-col gap-3 p-3.5">
          {/* stage */}
          <div className="relative grid min-h-[230px] flex-1 place-items-center overflow-hidden rounded-[14px] border border-live-line bg-live-panel">
            <div className="absolute end-3 top-3 flex gap-[7px] text-[11px] font-bold">
              <span className={cn('flex items-center gap-1.5 rounded-lg bg-live-scrim px-2.5 py-[5px] backdrop-blur', !on.rec && 'opacity-35')}>
                <span className="dot-live bg-destructive text-destructive" />
                {t.live.rec}
              </span>
              <span className="flex items-center gap-1.5 rounded-lg bg-brand px-2.5 py-[5px]">
                <Icon name="spark" className="h-[13px] w-[13px]" />
                {t.live.aiSummary}
              </span>
            </div>
            {board ? (
              <div className="relative aspect-[16/10] w-[86%] max-w-[470px] overflow-hidden rounded-[10px] bg-live-board shadow-lg">
                <svg viewBox="0 0 400 250" className="absolute inset-0 h-full w-full">
                  <path d="M30 70 C 90 20,150 20,205 65 S 320 130,370 75" fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" />
                  <line x1="30" y1="150" x2="370" y2="150" stroke="var(--color-border)" strokeWidth="2" />
                  <circle cx="205" cy="65" r="5" fill="var(--color-destructive)" />
                  <text x="30" y="205" fontSize="24" fontWeight="700" fill="var(--color-live-ink)">f &apos;(x) = 6x + 2</text>
                </svg>
              </div>
            ) : (
              <div className="w-[78%] max-w-[420px] rounded-[10px] bg-live-board px-[18px] py-4 text-live-ink shadow-lg">
                <h4 className="text-[15px] font-bold text-live-title">{LIVE_CLASS.slideTitle}</h4>
                <p className="mt-1.5 text-[13px] opacity-80">{LIVE_CLASS.formula}</p>
                <div className="mt-[9px] h-[7px] rounded-full bg-primary/10" />
                <div className="mt-[9px] h-[7px] w-[70%] rounded-full bg-primary/10" />
              </div>
            )}
            <div className="absolute bottom-3 start-3 flex items-center gap-[7px] rounded-lg bg-live-scrim px-2.5 py-[5px] text-xs font-semibold backdrop-blur">
              <Icon name={board ? 'board' : 'share'} className="h-[13px] w-[13px]" strokeWidth={2} />
              {board ? t.live.onBoard : t.live.sharing}
            </div>
          </div>

          {/* participants */}
          <div className="flex gap-2.5 overflow-auto">
            {LIVE_CLASS.tiles.map((p) => (
              <div
                key={p.name}
                className={cn('relative grid h-[70px] w-[116px] flex-none place-items-center rounded-[10px] border bg-live-panel', p.hand ? 'border-highlight' : 'border-live-line')}
              >
                {p.hand && (
                  <span className="absolute end-[5px] top-[5px] grid h-5 w-5 place-items-center rounded-md bg-highlight text-highlight-foreground">
                    <Icon name="hand" className="h-3 w-3" strokeWidth={2} />
                  </span>
                )}
                <span className="grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-primary-foreground" style={{ background: p.color }}>
                  {p.initials}
                </span>
                <span className="absolute bottom-[5px] start-1.5 rounded-[5px] bg-live-scrim px-1.5 py-0.5 text-[10.5px] font-semibold">
                  {p.name} {p.host && t.live.host}
                </span>
              </div>
            ))}
          </div>

          {/* controls */}
          <div className="flex flex-wrap items-center justify-center gap-[9px]">
            {ctl('mic', on.mic ? 'mic' : 'micOff', t.live.controls.mic)}
            {ctl('cam', 'cam', t.live.controls.cam)}
            {host ? (
              <>
                {ctl('share', 'share', t.live.controls.share)}
                <button
                  aria-label={t.live.controls.board}
                  aria-pressed={board}
                  onClick={() => setBoard((b) => !b)}
                  className={cn('grid h-11 w-11 place-items-center rounded-xl [&_svg]:h-[19px] [&_svg]:w-[19px]', board ? 'bg-live-board text-live-ink' : 'bg-live-raised text-live-foreground')}
                >
                  <Icon name="board" />
                </button>
                {ctl('rec', <RecIcon />, t.live.controls.rec, 'bg-destructive text-primary-foreground')}
                {ctl('muteAll', 'micOff', t.live.controls.muteAll)}
                {ctl('manage', 'users', t.live.controls.manage)}
              </>
            ) : (
              ctl('hand', 'hand', t.live.controls.hand, 'bg-highlight text-highlight-foreground')
            )}
            <button
              onClick={leave}
              className="flex h-11 items-center gap-[7px] rounded-xl bg-destructive px-4 font-bold text-primary-foreground [&_svg]:h-[17px] [&_svg]:w-[17px]"
            >
              <HangUpIcon />
              {host ? t.live.end : t.live.leave}
            </button>
          </div>
        </div>

        {/* chat / people */}
        <div className="flex flex-col border-t border-live-line bg-live-panel lg:border-s lg:border-t-0">
          <div className="flex gap-1 border-b border-live-line px-3 py-2.5">
            {(['chat', 'people'] as const).map((p) => (
              <button
                key={p}
                aria-pressed={panel === p}
                onClick={() => setPanel(p)}
                className={cn('flex-1 rounded-lg p-[7px] text-xs font-semibold', panel === p ? 'bg-live-raised text-live-foreground' : 'text-live-muted')}
              >
                {p === 'chat' ? t.live.chat : t.live.people(LIVE_CLASS.participants)}
              </button>
            ))}
          </div>
          <div className="flex min-h-[140px] flex-1 flex-col gap-3 overflow-auto p-3">
            {(panel === 'chat' ? LIVE_CLASS.chat : LIVE_CLASS.tiles.map((p) => ({ ...p, text: '' }))).map((m, i) => (
              <div key={i} className="flex gap-[9px]">
                <span className="grid h-7 w-7 flex-none place-items-center rounded-full text-[11px] font-bold text-primary-foreground" style={{ background: m.color }}>
                  {m.initials}
                </span>
                <div className="self-center">
                  <b className="text-[11.5px] text-live-muted">{m.name}</b>
                  {m.text && <p className="mt-px text-[12.5px]">{m.text}</p>}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 border-t border-live-line px-3 py-2.5">
            <input
              placeholder={t.live.typeMsg}
              className="flex-1 rounded-[9px] bg-live-raised px-[11px] py-2 text-xs text-live-foreground placeholder:text-live-muted focus:outline-none"
            />
            <button aria-label={t.live.send} className="grid h-[38px] w-[38px] place-items-center rounded-xl bg-live-raised [&_svg]:h-[17px] [&_svg]:w-[17px]">
              <Icon name="send" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
