import { notFound, redirect } from "next/navigation"
import { CampFlowScreens } from "@/components/opening/camp/camp-flow-screens"
import { resolveCampStep } from "@/lib/opening-steps"

export default async function CampPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>
}) {
  const { slug } = await params
  if (!slug || slug.length === 0) redirect("/opening/camp/welcome")

  const step = resolveCampStep(slug)
  if (!step) notFound()

  return <CampFlowScreens initialStep={step} />
}
