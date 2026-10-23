import { ContactForm, isContactTopic } from "@/features/contact-form";
import { SITE } from "@/shared/config/site";
import { HeroGlow } from "@/shared/ui/hero-glow";
import { getT } from "@/shared/i18n/server";
import { SocialLinks } from "@/shared/ui/social-links";
import { EmailCards, type EmailRow } from "./ContactChannels";

export async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const t = await getT();
  const s = t.site.contact;
  const q = await searchParams;
  const emails = (
    Object.entries(SITE.emails) as Array<[EmailRow["key"], string | null]>
  ).filter((e): e is [EmailRow["key"], string] => !!e[1]);
  const legal = (
    Object.entries(SITE.legal) as Array<
      [keyof typeof SITE.legal, string | null]
    >
  ).filter(([, v]) => v);

  return (
    <div className="flex flex-col gap-16 sm:gap-24">
      <section className="relative isolate flex flex-col items-center gap-4 pt-6 text-center sm:pt-12">
        <HeroGlow tone="talk" />
        <p className="text-xs font-medium tracking-wider text-info uppercase">
          {s.eyebrow}
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
          {s.title}
        </h1>
        <p className="max-w-2xl text-lg text-pretty text-muted-foreground">
          {s.sub}
        </p>
      </section>

      {emails.length > 0 && (
        <section className="flex flex-col gap-8">
          <h2 className="text-3xl font-semibold tracking-tight">
            {s.otherTitle}
          </h2>
          <EmailCards
            rows={emails.map(([key, address]) => ({ key, address }))}
          />
        </section>
      )}

      <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_19.5rem] lg:gap-8">
        <section className="rounded-3xl bg-card p-6 shadow-[0_3px_8px_-2px_color-mix(in_oklch,var(--foreground)_9%,transparent),0_10px_24px_-10px_color-mix(in_oklch,var(--foreground)_8%,transparent)] sm:p-10 dark:shadow-none dark:ring-1 dark:ring-foreground/8">
          <h2 className="mb-8 text-3xl font-semibold tracking-tight">
            {s.formTitle}
          </h2>
          <ContactForm topic={isContactTopic(q.topic) ? q.topic : "general"} />
        </section>

        <aside className="flex flex-col gap-10 lg:pt-2">
          <section className="flex flex-col gap-3">
            <h2 className="px-1 text-lg font-semibold tracking-tight">
              {s.socialTitle}
            </h2>
            <p className="-mt-1 px-1 text-sm leading-relaxed text-pretty text-muted-foreground">
              {s.socialInvite}
            </p>
            <SocialLinks className="mt-2 px-1" />
          </section>
          {legal.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="px-1 text-lg font-semibold tracking-tight">
                {s.legalTitle}
              </h2>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 px-2 text-sm">
                {legal.map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-muted-foreground">{s.legal[k]}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
