import type React from "react"

import { CampFlowProvider } from "@/components/opening/camp-flow-context"
import { requireFlowAccess } from "@/lib/session"

// 授權閘門放在這裡而不是 proxy.ts：proxy 只做 cookie 存在性的樂觀導向，
// 不是安全邊界。停用 proxy.ts 之後這裡的判斷仍然必須成立。
export default async function CampLayout({ children }: { children: React.ReactNode }) {
  await requireFlowAccess("camp")

  return <CampFlowProvider>{children}</CampFlowProvider>
}
