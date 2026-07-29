import { redirect } from "next/navigation"
import { getSession } from "@/lib/fake-session"
import { SigninForm } from "./signin-form"

export default async function SigninPage() {
  const session = await getSession()

  if (session) {
    redirect(session.hasCompletedOpening ? "/" : `/opening/${session.sessionType}/welcome`)
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">簽到</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          請填寫以下資訊，開始你的 PASSION 旅程。
        </p>
        <SigninForm />
      </div>
    </main>
  )
}
