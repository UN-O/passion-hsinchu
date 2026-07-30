"use server"

import { redirect } from "next/navigation"
import { clearSession, setSessionCookie } from "@/lib/fake-session"

export type SigninState = {
  error: string | null
}

export async function signIn(_prevState: SigninState, formData: FormData): Promise<SigninState> {
  const rawChurch = String(formData.get("church") ?? "").trim()
  const otherChurch = String(formData.get("otherChurch") ?? "").trim()
  const church = rawChurch === "其他" ? otherChurch : rawChurch
  const sessionType = String(formData.get("sessionType") ?? "")
  const name = String(formData.get("name") ?? "").trim()

  if (!church || (sessionType !== "camp" && sessionType !== "conference") || !name) {
    return { error: "請完整填寫教會、場次與姓名" }
  }

  await setSessionCookie({ church, sessionType, name, hasCompletedOpening: false })
  redirect(`/opening/${sessionType}/welcome`)
}

export async function logout() {
  await clearSession()
  redirect("/signin")
}
