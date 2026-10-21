import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Icon } from '@/shared/ui/icon'
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/shared/ui/item'
import { RichText } from '@/shared/ui/rich-text-editor'
import { formatBytes } from '@/shared/lib/format'
import { fileUrl, type CourseLesson } from '../model/types'
import { LessonItemIcon } from './LessonItemIcon'

/**
 * What a lesson teaches: its videos (streamed), text pages and documents — shared by the student's
 * lesson page and the public free preview. Homework is not here (it needs an account).
 */
export function LessonMaterials({ lesson, materialsLabel }: { lesson: CourseLesson; materialsLabel: string }) {
  const videos = lesson.items.filter((x) => x.kind === 'video')
  const docs = lesson.items.filter((x) => x.kind === 'file')
  const texts = lesson.items.filter((x) => x.kind === 'text')
  return (
    <>
      {videos.map((v) =>
        v.files[0] ? (
          <figure key={v.id} className="flex flex-col gap-2">
            <video
              controls
              preload="metadata"
              playsInline
              controlsList="nodownload"
              src={fileUrl(v.files[0])}
              className="aspect-video w-full rounded-xl border bg-live"
            />
            <figcaption className="text-sm font-medium">{v.name}</figcaption>
          </figure>
        ) : null,
      )}

      {texts.map((p) => (
        <Card key={p.id}>
          <CardHeader>
            <CardTitle>{p.name}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* cleaned by IOMAD (HTMLPurifier) when saved and when read */}
            <RichText html={p.content} />
          </CardContent>
        </Card>
      ))}

      {docs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{materialsLabel}</CardTitle>
          </CardHeader>
          <CardContent className="gap-2">
            {docs.map((d) =>
              d.files[0] ? (
                <Item key={d.id} variant="outline" size="sm" asChild>
                  <a href={fileUrl(d.files[0])} target="_blank" rel="noopener">
                    <ItemMedia>
                      <LessonItemIcon kind="file" mime={d.files[0].mime} />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{d.name}</ItemTitle>
                      <ItemDescription>{formatBytes(d.files[0].size)}</ItemDescription>
                    </ItemContent>
                    <Icon name="external" className="size-4 text-muted-foreground" />
                  </a>
                </Item>
              ) : null,
            )}
          </CardContent>
        </Card>
      )}
    </>
  )
}
