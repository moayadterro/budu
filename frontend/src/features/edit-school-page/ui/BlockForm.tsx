'use client'

import { useRouter } from 'next/navigation'
import { useId, useState, useTransition } from 'react'
import { Medal, PAGE_LIMITS as L, type Block, type BlockData } from '@/entities/school-page'
import { Alert } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Field } from '@/shared/ui/field'
import { Icon } from '@/shared/ui/icon'
import { Input } from '@/shared/ui/input'
import { DateInput } from '@/shared/ui/date-input'
import { Textarea } from '@/shared/ui/textarea'
import { pictureSrc } from '@/shared/lib/person'
import { useT } from '@/shared/i18n'
import { saveBlockAction } from '../server/actions'
import { PhotoField, PhotosField } from './PhotoUpload'

const today = () => new Date().toISOString().slice(0, 10)

/** A member of the school, suggested by name (their photo shows on the page when it matches). */
export type Member = { name: string; pictureId: number | null }

/** Edit one block (its fields depend on its kind) → Save. */
export function BlockForm({ block, people, onDone }: { block: Block; people: Member[]; onDone: () => void }) {
  const t = useT()
  const s = t.schoolPage.editor
  const router = useRouter()
  const listId = useId()
  const [data, setData] = useState(block.data as unknown as Record<string, unknown>)
  const [failed, setFailed] = useState(false)
  const [pending, start] = useTransition()
  const set = (k: string, v: unknown) => setData((d) => ({ ...d, [k]: v }))
  const items = (data.items as Record<string, unknown>[]) ?? []
  const setItem = (i: number, k: string, v: unknown) => set('items', items.map((it, j) => (j === i ? { ...it, [k]: v } : it)))

  const save = () =>
    start(async () => {
      const ok = await saveBlockAction(block.id, JSON.stringify(data))
      setFailed(!ok)
      if (ok) {
        router.refresh()
        onDone()
      }
    })

  const privacy = (
    <p className="mb-4 flex items-start gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
      <Icon name="lock" className="mt-0.5 size-3.5 flex-none" />
      {s.privacy}
    </p>
  )
  const peopleList = (
    <datalist id={listId}>
      {[...new Set(people.map((p) => p.name))].map((name) => (
        <option key={name} value={name} />
      ))}
    </datalist>
  )

  return (
    <div className="flex flex-col">
      {failed && <Alert variant="destructive" className="mb-4">{s.failed}</Alert>}

      {block.kind === 'text' && (
        <>
          <Field label={s.heading}>
            <Input value={String(data.heading ?? '')} onChange={(e) => set('heading', e.target.value)} maxLength={L.heading} placeholder={s.textHeadingPh} />
          </Field>
          <Field label={s.body}>
            <Textarea value={String(data.body ?? '')} onChange={(e) => set('body', e.target.value)} maxLength={L.text} rows={6} placeholder={s.textBodyPh} />
          </Field>
        </>
      )}

      {block.kind === 'photos' && (
        <>
          <Field label={s.heading}>
            <Input value={String(data.heading ?? '')} onChange={(e) => set('heading', e.target.value)} maxLength={L.heading} placeholder={s.photosHeadingPh} />
          </Field>
          <PhotosField items={items as BlockData['photos']['items']} onChange={(v) => set('items', v)} />
        </>
      )}

      {block.kind === 'news' && (
        <>
          <Field label={s.heading}>
            <Input value={String(data.heading ?? '')} onChange={(e) => set('heading', e.target.value)} maxLength={L.heading} placeholder={t.schoolPage.newsDefault} />
          </Field>
          <Button
            type="button"
            variant="outline"
            className="mb-4 self-start"
            disabled={items.length >= L.news}
            onClick={() => set('items', [{ id: `n${Date.now()}`, title: '', body: '', date: today(), fileId: null }, ...items])}
          >
            <Icon name="plus" />
            {s.addNews}
          </Button>
          <div className="flex flex-col gap-3">
            {items.map((n, i) => (
              <div key={String(n.id)} className="rounded-lg border p-3">
                <div className="grid gap-x-3 sm:grid-cols-[10rem_1fr]">
                  <Field label={s.date}>
                    <DateInput value={String(n.date ?? today())} onChange={(v) => setItem(i, 'date', v || today())} />
                  </Field>
                  <Field label={s.newsTitle}>
                    <Input value={String(n.title ?? '')} onChange={(e) => setItem(i, 'title', e.target.value)} maxLength={L.heading} />
                  </Field>
                </div>
                <Field label={s.body}>
                  <Textarea value={String(n.body ?? '')} onChange={(e) => setItem(i, 'body', e.target.value)} maxLength={L.text} rows={3} />
                </Field>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <PhotoField value={(n.fileId as number | null) ?? null} onChange={(v) => setItem(i, 'fileId', v)} />
                  <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={() => set('items', items.filter((_, j) => j !== i))}>
                    <Icon name="trash" />
                    {s.removeNews}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {block.kind === 'spotlight' && (
        <>
          {privacy}
          {peopleList}
          <Field label={s.spotLabel}>
            <Input value={String(data.label ?? '')} onChange={(e) => set('label', e.target.value)} maxLength={L.heading} placeholder={s.spotLabelPh} />
          </Field>
          <Field label={s.spotName}>
            <Input value={String(data.name ?? '')} onChange={(e) => set('name', e.target.value)} maxLength={L.name} list={listId} placeholder={s.spotNamePh} />
          </Field>
          <Field label={s.spotText}>
            <Textarea value={String(data.text ?? '')} onChange={(e) => set('text', e.target.value)} maxLength={L.text} rows={4} placeholder={s.spotTextPh} />
          </Field>
          <PhotoField value={(data.fileId as number | null) ?? null} onChange={(v) => set('fileId', v)} />
        </>
      )}

      {block.kind === 'top' && (
        <>
          {privacy}
          {peopleList}
          <Field label={s.heading}>
            <Input value={String(data.heading ?? '')} onChange={(e) => set('heading', e.target.value)} maxLength={L.heading} placeholder={t.schoolPage.topDefault} />
          </Field>
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => {
              const it = items[i] ?? { name: '', note: '' }
              // same rule as on save: exactly one member with this name → their photo
              const same = people.filter((p) => p.name.trim().toLocaleLowerCase() === String(it.name ?? '').trim().toLocaleLowerCase())
              const photo = same.length === 1 ? pictureSrc(same[0]!.pictureId) : null
              const put = (k: string, v: string) => {
                const next = [0, 1, 2].map((j) => (j === i ? { ...it, [k]: v } : (items[j] ?? { name: '', note: '' })))
                set('items', next)
              }
              return (
                <div key={i} className="grid grid-cols-[auto_1fr] items-center gap-x-3 sm:grid-cols-[auto_1fr_1fr]">
                  {photo ? (
                    <span className="relative" aria-hidden>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo} alt="" className="size-9 rounded-full object-cover" />
                      <Medal place={i + 1} className="absolute -end-1.5 -bottom-1.5 size-5 text-[0.625rem] ring-1" />
                    </span>
                  ) : (
                    <span aria-hidden>
                      <Medal place={i + 1} className="size-9" />
                    </span>
                  )}
                  <Input value={String(it.name ?? '')} onChange={(e) => put('name', e.target.value)} maxLength={L.name} list={listId} placeholder={s.topName} aria-label={`${i + 1}. ${s.topName}`} />
                  <Input
                    value={String(it.note ?? '')}
                    onChange={(e) => put('note', e.target.value)}
                    maxLength={L.note}
                    placeholder={s.topNote}
                    aria-label={`${i + 1}. ${s.topNote}`}
                    className="col-start-2 mt-2 sm:col-start-auto sm:mt-0"
                  />
                </div>
              )
            })}
          </div>
        </>
      )}

      <div className="mt-5 flex gap-2">
        <Button type="button" onClick={save} disabled={pending}>
          {pending ? s.saving : s.save}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          {s.close}
        </Button>
      </div>
    </div>
  )
}
