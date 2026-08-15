import type { Metadata } from "next"

import { ProgramPortal } from "@/components/program-portal"
import { requireFlowAccess } from "@/lib/session"
import { camp } from "@/lib/site-config"

export const metadata: Metadata = {
  title: camp.label,
  robots: { index: false, follow: false },
}

export default async function CampPage() {
  const session = await requireFlowAccess("camp")

  return <ProgramPortal flow="camp" program={camp} session={session} />
}
