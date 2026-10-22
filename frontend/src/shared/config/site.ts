/**
 * Budu's public facts in ONE place — contact details, legal details, plan limits. Anything left
 * null is simply not shown (nothing invented on the public pages). Fill in the real values here.
 */
export const SITE = {
  name: "Budu",
  /** shown on Contact (and as the operator's contacts in the Privacy policy) */
  emails: {
    support: null as string | null, // e.g. 'support@budu-school.ru' — when the mailbox exists
    hello: null as string | null, // general questions, partnerships
    billing: "billing@budu-school.ru" as string | null, // course payments (receipts) — confirmed by the owner
  },
  /** chat links: a Telegram username (without @) and a WhatsApp number (digits, with country code) */
  telegram: null as string | null,
  whatsapp: null as string | null,
  /** the data controller ("оператор персональных данных", 152-FZ) — needed for the Privacy policy */
  legal: {
    name: null as string | null, // e.g. 'ООО «Буду»'
    inn: null as string | null,
    ogrn: null as string | null,
    address: null as string | null,
  },
  /**
   * Plans (owner): students free, teachers free (some AI features paid later), schools free up to
   * these limits — above them a quote (B2B, via Contact). PLACEHOLDER numbers: confirm with the owner.
   */
  freeSchool: { teachers: 5, students: 50 },
} as const;

export const telegramUrl = (u: string) => `https://t.me/${u.replace(/^@/, "")}`;
export const whatsappUrl = (n: string) =>
  `https://wa.me/${n.replace(/\D/g, "")}`;
