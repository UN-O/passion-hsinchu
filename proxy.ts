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
//
// /playground/* 的擋法不一樣、放進同一支檔案是因為 Next 16 一個專案只認
// 一支 proxy.ts：這個 repo 是 public 的，網址可以直接被外部人士猜到，
// 其中 camp-mission-home 會直接查資料庫，正式環境下不能讓任何人打到
// （見 CLAUDE.md「Playground 預覽頁」）。放行要兩個條件都成立，不是靠
// cookie 判斷；查得到資料庫的那頁另外在 lib/playground-guard.ts 自己
// 也擋一次，不完全依賴這裡。
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/playground")) {
    const allowed = process.env.NODE_ENV !== "production" && process.env.ENABLE_PLAYGROUND === "true"
    return allowed ? NextResponse.next() : new NextResponse(null, { status: 404 })
  }

  const sessionCookie = getSessionCookie(request)

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/signin", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/opening/:path*", "/camp", "/conference", "/playground", "/playground/:path*"],
}
