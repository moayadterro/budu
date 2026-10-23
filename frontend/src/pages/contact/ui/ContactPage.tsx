import { ContactForm, isContactTopic } from "@/features/contact-form";
import { SITE } from "@/shared/config/site";
import { HeroGlow } from "@/shared/ui/hero-glow";
import { getT } from "@/shared/i18n/server";
import { SchoolInvite } from "@/widgets/school-invite";
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

      {/* grid-cols-1 on phones: the column may never grow past the screen (a plain grid column grows to fit its widest content) */}
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,1fr)_26.5rem] lg:gap-10">
        <section className="lg:pt-2">
          <h2 className="mb-8 text-3xl font-semibold tracking-tight">
            {s.formTitle}
          </h2>
          <ContactForm topic={isContactTopic(q.topic) ? q.topic : "general"} />
        </section>

        <aside className="flex flex-col gap-10 lg:border-s lg:border-foreground/8 lg:ps-10 lg:pt-2">
          {/* write directly: the team's addresses as compact cards, one per row (owner) */}
          {emails.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="px-1 text-lg font-semibold tracking-tight">
                {s.otherTitle}
              </h2>
              <EmailCards
                rows={emails.map(([key, address]) => ({ key, address }))}
              />
            </section>
          )}
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

      {/* the same closing invitation for schools as Pricing and Courses (owner) */}
      <SchoolInvite />
    </div>
  );
}
