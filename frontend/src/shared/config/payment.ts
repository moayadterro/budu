/**
 * How students pay for now (no payment provider yet): a bank transfer in rubles to the platform's
 * phone number (Sberbank or the Fast Payment System, SBP), with the order number in the comment, and
 * the receipt emailed to billing. The platform admin confirms the order (Admin → Payments).
 */
export const PAYMENT = {
  phone: "+79219263517",
  receiptEmail: "billing@budu-school.ru",
  /** transfers are made in this currency */
  currency: "RUB",
} as const;
