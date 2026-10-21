import { ContactForm, isContactTopic } from '@/features/contact-form'
import { SITE, telegramUrl, whatsappUrl } from '@/shared/config/site'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Icon } from '@/shared/ui/icon'
import { PublicHero } from '@/shared/ui/public-hero'
import { getT } from '@/shared/i18n/server'

/** Public: the contact form + the ways to reach us that exist (SITE — empty ones are hidden). */
export async function ContactPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const t = await getT()
  const s = t.site.contact
  const q = await searchParams
  const emails = (Object.entries(SITE.emails) as Array<[keyof typeof SITE.emails, string | null]>).filter(([, v]) => v)
  const legal = (Object.entries(SITE.legal) as Array<[keyof typeof SITE.legal, string | null]>).filter(([, v]) => v)
  const chats = [SITE.telegram && { label: s.telegram, href: telegramUrl(SITE.telegram) }, SITE.whatsapp && { label: s.whatsapp, href: whatsappUrl(SITE.whatsapp) }].filter(
    Boolean,
  ) as Array<{ label: string; href: string }>
  return (
    <div className="flex flex-col gap-10">
      <PublicHero title={s.title} sub={s.sub} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader>
            <CardTitle>{s.formTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <ContactForm topic={isContactTopic(q.topic) ? q.topic : 'general'} />
          </CardContent>
        </Card>
        <aside className="flex flex-col gap-4">
          {(emails.length > 0 || chats.length > 0) && (
            <Card size="sm">
              <CardHeader>
                <CardTitle>{s.otherTitle}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                {emails.map(([k, v]) => (
                  <div key={k}>
                    <div className="text-xs text-muted-foreground">{s.emailLabels[k]}</div>
                    <a href={`mailto:${v}`} className="font-medium text-primary hover:underline" dir="ltr">
                      {v}
                    </a>
                  </div>
                ))}
                {chats.map((c) => (
                  <a key={c.href} href={c.href} target="_blank" rel="noopener" className="inline-flex items-center gap-2 font-medium text-primary hover:underline">
                    <Icon name="chat" className="size-4" />
                    {c.label}
                  </a>
                ))}
              </CardContent>
            </Card>
          )}
          {legal.length > 0 && (
            <Card size="sm">
              <CardHeader>
                <CardTitle>{s.legalTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
                  {legal.map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="text-muted-foreground">{s.legal[k]}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </div>
  )
}
