"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { APIError } from "better-auth/api"

import { auth } from "@/lib/auth"
import { getAppSession, postSignInPath } from "@/lib/session"

export type SigninState = { error: string | null }

export async function campSignIn(
  _prevState: SigninState,
  formData: FormData
): Promise<SigninState> {
  const name = String(formData.get("name") ?? "").trim()
  const church = String(formData.get("church") ?? "").trim()

  if (!name || !church) {
    return { error: "請填寫教會與姓名" }
  }

  try {
    await auth.api.campSignIn({
      body: { name, church },
      headers: await headers(),
    })
  } catch (error) {
    if (error instanceof APIError) {
      return { error: String(error.body?.message ?? "登入失敗，請再試一次") }
    }
    throw error
  }

  const session = await getAppSession()
  redirect(session ? postSignInPath(session) : "/")
}

export async function logout() {
  await auth.api.signOut({ headers: await headers() })
  redirect("/signin")
}
