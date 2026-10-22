import { LegalDocument } from '@/widgets/legal-document'
import { getT } from '@/shared/i18n/server'

/**
 * Public: the privacy policy, describing what Budu actually stores (keep it in step with the app).
 * Have a lawyer review it before launch (152-FZ / GDPR).
 */
export async function PrivacyPage() {
  return <LegalDocument doc={(await getT()).site.privacy} />
}
