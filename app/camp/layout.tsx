import type React from "react"

// 純粹套用淺黃色主題（app/globals.css 的 .camp-theme），不做授權判斷——
// /camp 底下每一頁本來就各自呼叫 requireFlowAccess("camp")，這裡加了也還是要保留。
export default function CampSectionLayout({ children }: { children: React.ReactNode }) {
  return <div className="camp-theme min-h-screen bg-background text-foreground">{children}</div>
}
