import type React from "react"
import { ConferenceFlowProvider } from "@/components/opening/conference-flow-context"

export default function ConferenceLayout({ children }: { children: React.ReactNode }) {
  return <ConferenceFlowProvider>{children}</ConferenceFlowProvider>
}
