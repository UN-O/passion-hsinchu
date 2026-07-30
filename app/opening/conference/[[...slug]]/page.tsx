import { notFound, redirect } from "next/navigation"
import { getSession } from "@/lib/fake-session"
import { ConferenceFlowScreens } from "@/components/opening/conference/conference-flow-screens"
import { resolveConferenceStep } from "@/lib/opening-steps"

export default async function ConferencePage({
  params,
}: {
  params: Promise<{ slug?: string[] }>
}) {
  const { slug } = await params
  if (!slug || slug.length === 0) redirect("/opening/conference/welcome")

  const step = resolveConferenceStep(slug)
  if (!step) notFound()

  const session = await getSession()
  if (!session) redirect("/signin")

  return <ConferenceFlowScreens initialStep={step} name={session.name} />
}
