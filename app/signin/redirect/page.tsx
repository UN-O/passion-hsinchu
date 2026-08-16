import { redirect } from "next/navigation"

import { getAppSession, postSignInPath } from "@/lib/session"

// Google 回調後會導到這裡。要進哪個流程取決於名冊，而名冊要查 DB，
// 所以不能在 OAuth 的 callbackURL 直接寫死目的地。
//
// 這裡刻意重試幾次再放棄：callback 設好 cookie 之後緊接著就是這個請求，
// 偶爾會讀不到剛寫入的 session。之前只要第一次讀不到就把人踢回 /signin，
// 使用者看到的就是「第一次登入失敗、再點一次才成功」。
const RETRIES = 3
const RETRY_DELAY_MS = 150

export default async function SigninRedirectPage() {
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    const session = await getAppSession()
    if (session) redirect(postSignInPath(session))

    if (attempt < RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
    }
  }

  // 真的沒有 session（例如使用者在 Google 那邊取消授權）才回登入頁
  redirect("/signin")
}
