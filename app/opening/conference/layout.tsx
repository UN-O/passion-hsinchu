import type React from "react"

import { ConferenceFlowProvider } from "@/components/opening/conference-flow-context"
import { requireFlowAccess } from "@/lib/session"

// CONFERENCE 額外要求 verified（證明過 Google 帳號所有權）。
// 沒有這道檢查，任何人走 CAMP 那條無驗證的姓名路徑就能繞進來，
// Google 驗證形同虛設。requireFlowAccess 裡處理。
export default async function ConferenceLayout({ children }: { children: React.ReactNode }) {
  await requireFlowAccess("conference")

  return <ConferenceFlowProvider>{children}</ConferenceFlowProvider>
}
