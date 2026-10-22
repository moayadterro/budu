'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { BLOCK_KINDS, type Block, type BlockKind } from '@/entities/school-page'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Icon, type IconName } from '@/shared/ui/icon'
import { MoreMenu } from '@/shared/ui/more-menu'
import { cn } from '@/shared/lib/cn'
import { useT } from '@/shared/i18n'
import { addBlockAction, deleteBlockAction, moveBlockAction } from '../server/actions'
import { BlockForm } from './BlockForm'

export const KIND_ICON: Record<BlockKind, IconName> = { text: 'text', photos: 'image', news: 'news', spotlight: 'star', top: 'trophy' }

/** One line about what's in a block (for the collapsed card). */
function summary(b: Block, empty: string): string {
  const d = b.data as unknown as Record<string, unknown>
  const items = (d.items as unknown[]) ?? []
  if (b.kind === 'text') return String(d.heading || d.body || '').slice(0, 90) || empty
  if (b.kind === 'spotlight') return [d.label, d.name].filter(Boolean).join(' · ') || empty
  return [d.heading, items.length ? `${items.length}` : ''].filter(Boolean).join(' · ') || empty
}

/**
 * The page's blocks as simple cards: a ⋯ menu (Edit, Move up / down, Delete), editing opens in place;
 * "Add block" picks one of five kinds and opens it for editing right away.
 */
export function BlocksEditor({ blocks, people }: { blocks: Block[]; people: string[] }) {
  const t = useT()
  const s = t.schoolPage.editor
  const router = useRouter()
  const [editing, setEditing] = useState<number | null>(null)
  const [picking, setPicking] = useState(false)
  const [pending, start] = useTransition()

  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      await fn()
      router.refresh()
    })

  const add = (kind: BlockKind) =>
    start(async () => {
      setPicking(false)
      const id = await addBlockAction(kind)
      router.refresh()
      if (id) setEditing(id)
    })

  return (
    <div className="flex flex-col gap-3">
      {blocks.length === 0 && (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">{s.noBlocks}</div>
      )}
      {blocks.map((b, i) => (
        <div key={b.id} className={cn('rounded-xl border bg-card transition-shadow', editing === b.id && 'shadow-md ring-1 ring-primary/30')}>
          <div className="flex items-center gap-3 p-3 ps-4">
            <span className="grid size-9 flex-none place-items-center rounded-lg bg-primary/10 text-primary">
              <Icon name={KIND_ICON[b.kind]} className="size-4.5" />
            </span>
            <button type="button" onClick={() => setEditing(editing === b.id ? null : b.id)} className="min-w-0 flex-1 text-start">
              <span className="block text-sm font-medium">{s.kinds[b.kind].title}</span>
              <span className="block truncate text-xs text-muted-foreground">{summary(b, s.emptyBlock)}</span>
            </button>
            <MoreMenu
              label={t.actionsFor(s.kinds[b.kind].title)}
              actions={[
                { label: editing === b.id ? s.close : s.edit, icon: 'pencil', onSelect: () => setEditing(editing === b.id ? null : b.id) },
                { label: t.courses.moveUp, icon: 'up', disabled: i === 0 || pending, onSelect: () => run(() => moveBlockAction(b.id, -1)) },
                { label: t.courses.moveDown, icon: 'down', disabled: i === blocks.length - 1 || pending, onSelect: () => run(() => moveBlockAction(b.id, 1)) },
              ]}
              danger={{
                label: t.courses.delete,
                confirmLabel: s.deleteTitle(s.kinds[b.kind].title),
                description: s.deleteDesc,
                onConfirm: () => run(() => deleteBlockAction(b.id)),
              }}
            />
          </div>
          {editing === b.id && (
            <div className="border-t p-4">
              <BlockForm block={b} people={people} onDone={() => setEditing(null)} />
            </div>
          )}
        </div>
      ))}

      <Button type="button" variant="outline" size="lg" className="border-dashed" onClick={() => setPicking(true)} disabled={pending}>
        <Icon name="plus" />
        {s.add}
      </Button>

      <Dialog open={picking} onOpenChange={setPicking}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{s.addTitle}</DialogTitle>
            <DialogDescription>{s.addSub}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 sm:grid-cols-2">
            {BLOCK_KINDS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => add(k)}
                className="flex items-start gap-3 rounded-xl border p-3 text-start transition-colors outline-none hover:border-primary/40 hover:bg-primary/5 focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className="grid size-9 flex-none place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon name={KIND_ICON[k]} className="size-4.5" />
                </span>
                <span>
                  <span className="block text-sm font-medium">{s.kinds[k].title}</span>
                  <span className="block text-xs text-muted-foreground">{s.kinds[k].desc}</span>
                </span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
