import { notFound } from "next/navigation"

// proxy.ts 已經在路由最前面擋掉正式環境的 /playground/*，這支只給「有真的
// 查資料庫」的 playground 頁面（目前只有 camp-mission-home）在頁面自己
// 這層再擋一次——跟 requireStaff()／requireFlowAccess() 同一個精神：外層
// 的路由關卡以後可能因為 Next.js 版本更新（例如 proxy.ts 的命名慣例本身
// 就是從 middleware.ts 換過來的）被無聲繞過，真正查得到個資／資料庫的地方
// 不能只靠外層那一道。只有純靜態內容、沒有 DB 查詢的 playground 頁不需要
// 呼叫這個——多包一層對它們沒有實質風險可以擋。
//
// 只能從 server component 呼叫：這裡讀的是非 NEXT_PUBLIC_ 的環境變數，
// 在 client bundle 裡一定是 undefined，不要把這支從任何 "use client" 檔案
// import 進去。
export function assertPlaygroundEnabled(): void {
  const allowed = process.env.NODE_ENV !== "production" && process.env.ENABLE_PLAYGROUND === "true"
  if (!allowed) notFound()
}
