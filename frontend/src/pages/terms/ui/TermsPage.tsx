import { LegalDocument } from '@/widgets/legal-document'
import { getT } from '@/shared/i18n/server'

/**
 * Public: the terms of use — plain rules that match how Budu really works (accounts, children,
 * schools' consent, content, paid courses by transfer). Have a lawyer review it before launch.
 */
export async function TermsPage() {
  return <LegalDocument doc={(await getT()).site.terms} />
}
