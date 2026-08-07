import Link from "next/link"
import { redirect } from "next/navigation"

import { getAppSession, postSignInPath } from "@/lib/session"
import { GoogleButton } from "./google-button"

export default async function SigninPage({
  searchParams,
}: {
  searchParams: Promise<{ need?: string }>
}) {
  const session = await getAppSession()
  const { need } = await searchParams

  // 已經有 session 的人不該停在這裡；但 need=google 是「session 層級不夠」
  // 被踢回來的，這種情況要留在頁面上讓他改用 Google 登入。
  if (session && need !== "google") {
    redirect(postSignInPath(session))
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">簽到</h1>

        {need === "google" ? (
          <p className="mt-3 text-sm text-muted-foreground">
            這個頁面需要用 Google 登入才能進入。你目前是用姓名進入的，請改用 Google 登入。
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            請用報名時使用的 Google 帳號登入。
          </p>
        )}

        <div className="mt-8">
          <GoogleButton />
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <p className="text-sm font-medium">沒有 Google 帳號？</p>
          <p className="mt-2 text-sm text-muted-foreground">
            報名 CAMP 的學員可以直接用報名時填寫的姓名與教會進入。
          </p>
          <Link
            href="/signin/camp"
            className="mt-4 inline-block text-sm font-medium underline underline-offset-4"
          >
            用姓名進入 CAMP
          </Link>
        </div>
      </div>
    </main>
  )
}
