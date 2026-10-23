/**
 * Budu's public facts in ONE place — contact details, legal details, plan limits. Anything left
 * null is simply not shown (nothing invented on the public pages). Fill in the real values here.
 */
export const SITE = {
  name: "Budu",
  /** shown on Contact (and as the operator's contacts in the Privacy policy). The mailboxes must
   *  exist at the mail host (Timeweb) — create them before launch. */
  emails: {
    support: "support@budu-school.ru" as string | null, // help with Budu
    info: "info@budu-school.ru" as string | null, // general questions
    partners: "partners@budu-school.ru" as string | null, // partnerships
    billing: "billing@budu-school.ru" as string | null, // course payments (receipts) — confirmed by the owner
  },
  /**
   * Social accounts (owner: show them all). FOR NOW each opens the platform's own site; replace with
   * our account's address once it exists. null = shown as "soon" (not clickable). Order = page order.
   * Logos: src/assets/social/<key>.svg (brand app-icon tiles).
   */
  social: {
    telegram: "https://telegram.org" as string | null,
    vk: "https://vk.com" as string | null,
    max: "https://max.ru" as string | null,
    ok: "https://ok.ru" as string | null,
    instagram: "https://www.instagram.com" as string | null,
    facebook: "https://www.facebook.com" as string | null,
    tiktok: "https://www.tiktok.com" as string | null,
  },
  /** a WhatsApp number (digits, with country code) for chat, null = hidden */
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

export const whatsappUrl = (n: string) =>
  `https://wa.me/${n.replace(/\D/g, "")}`;
