import type React from "react"
import { CampFlowProvider } from "@/components/opening/camp-flow-context"

export default function CampLayout({ children }: { children: React.ReactNode }) {
  return <CampFlowProvider>{children}</CampFlowProvider>
}
