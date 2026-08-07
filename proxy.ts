import { NextResponse, type NextRequest } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

// ⚠ 這裡是體驗優化，不是安全邊界。
//
// 只檢查 session cookie 存不存在，不驗證簽章、不查資料庫。真正的授權判斷
// 全部在 layout / server component 裡（見 lib/session.ts 的 require* 函式）。
//
// 這樣切分有個實際好處：Next 16 對留在原地的舊 middleware.ts 是無聲忽略的，
// 一旦有人手滑把這個檔案改壞或用舊習慣建了 middleware.ts，也只是少一次
// 提前導向，不會造成未授權存取。
export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request)

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/signin", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/opening/:path*"],
}
