import { redirect } from "next/navigation"

import { listAllChurches } from "@/lib/enrollment"
import { getAppSession, postSignInPath } from "@/lib/session"
import { ClaimForm } from "./claim-form"

// 報名表只收了姓名與教會，沒有 email，所以 Google 登入無法自動配對到報名紀錄。
// 每個 Google 使用者第一次登入後都要在這裡自己對上。
export default async function ClaimPage() {
  const session = await getAppSession()
  if (!session) redirect("/signin")
  if (session.enrollment || session.user.role !== "attendee") {
    redirect(postSignInPath(session))
  }

  const churches = await listAllChurches()

  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">確認你的報名資料</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          報名表單沒有收 email，所以需要你告訴我們你是哪一位。
        </p>

        <ClaimForm churches={churches} />
      </div>
    </main>
  )
}
