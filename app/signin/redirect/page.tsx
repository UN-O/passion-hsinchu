import { redirect } from "next/navigation"

import { getAppSession, postSignInPath } from "@/lib/session"

// Google 回調後會導到這裡。要進哪個流程取決於名冊，而名冊要查 DB，
// 所以不能在 OAuth 的 callbackURL 直接寫死目的地。
export default async function SigninRedirectPage() {
  const session = await getAppSession()
  redirect(session ? postSignInPath(session) : "/signin")
}
