'use client'

import { useState } from 'react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Icon } from '@/shared/ui/icon'
import { Textarea } from '@/shared/ui/textarea'
import { Appear } from '@/shared/ui/motion'
import { useT } from '@/shared/i18n'

/** Answer text + file upload + submit. Local for now; later submits to the IOMAD assignment. */
export function SubmitHomework() {
  const t = useT()
  const [file, setFile] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <Appear>
        <div className="rounded-xl border border-success/30 bg-success/10 p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-success text-primary-foreground">
              <Icon name="tick" className="h-[18px] w-[18px]" strokeWidth={2.4} />
            </span>
            <div>
              <b className="block text-sm font-medium text-success">{t.homework.doneTitle}</b>
              <span className="text-xs text-muted-foreground">{t.homework.doneSub}</span>
            </div>
          </div>
        </div>
      </Appear>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.homework.yours}</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea placeholder={t.homework.answerPh} />
        <label className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-input p-6 text-center hover:bg-muted">
          <Icon name="upload" className="h-[22px] w-[22px] text-primary" />
          <span className="text-[13px] font-semibold text-primary">{file ?? t.homework.upload}</span>
          <span className="text-[11px] text-muted-foreground">{t.homework.uploadHint}</span>
          <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0]?.name ?? null)} />
        </label>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button onClick={() => setSubmitted(true)}>
            <Icon name="tick" strokeWidth={2} />
            {t.homework.submit}
          </Button>
          <span className="text-xs text-muted-foreground">{t.homework.notYet}</span>
        </div>
      </CardContent>
    </Card>
  )
}
