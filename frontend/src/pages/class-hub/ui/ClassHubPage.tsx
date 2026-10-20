import { notFound } from 'next/navigation'
import { ClassHub } from '@/widgets/class-hub'
import { isSubject } from '@/shared/mock'

export async function ClassHubPage({ params }: { params: Promise<{ subject: string }> }) {
  const { subject } = await params
  if (!isSubject(subject)) notFound()
  return <ClassHub subject={subject} />
}
