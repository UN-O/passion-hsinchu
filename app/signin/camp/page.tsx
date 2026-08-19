import Link from "next/link"
import { redirect } from "next/navigation"

import { listChurches } from "@/lib/enrollment"
import { getAppSession, postSignInPath } from "@/lib/session"
import { CampSigninForm } from "./camp-signin-form"

export default async function CampSigninPage() {
  const session = await getAppSession()
  if (session) redirect(postSignInPath(session))

  // 教會清單來自名冊，所以沒有「其他」選項 —— 不在名冊上的教會不該能自行輸入
  const churches = await listChurches("camp")

  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">CAMP 報到</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          選擇你的教會，並填寫報名表單上的完整姓名。
        </p>

        <CampSigninForm churches={churches} />

        <Link
          href="/signin"
          className="mt-8 inline-block text-sm text-muted-foreground underline underline-offset-4"
        >
          改用 Google 登入
        </Link>
      </div>
    </main>
  )
}
