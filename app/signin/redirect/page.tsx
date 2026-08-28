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

export default async function SigninRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  // next 只允許站內路徑（見 app/signin/page.tsx 同一個檢查），避免變成
  // open redirect。有這個值代表使用者是被 assertFlowAccess 踢來補驗證的
  // （例如點「進入 CONFERENCE」但 session 還沒證明過 Google 帳號所有權），
  // 驗證完要送回他原本要去的 flow，不是套 postSignInPath 那套「登入成功
  // 後該去哪裡」的通用邏輯——不然兩場都報名、兩場開場都還沒開始的人會被
  // 送去 /opening 選單，而不是他原本點的那個 flow。目的地本身還是有
  // 自己的 requireFlowAccess 把關，next 選錯也不會繞過權限檢查。
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null

  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    const session = await getAppSession()
    if (session) redirect(safeNext ?? postSignInPath(session))

    if (attempt < RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
    }
  }

  // 真的沒有 session（例如使用者在 Google 那邊取消授權）才回登入頁
  redirect("/signin")
}
