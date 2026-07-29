import { NextRequest, NextResponse } from "next/server"
import { SESSION_COOKIE_NAME, parseSessionCookie } from "@/lib/fake-session"

export function middleware(request: NextRequest) {
  const session = parseSessionCookie(request.cookies.get(SESSION_COOKIE_NAME)?.value)

  if (!session) {
    return NextResponse.redirect(new URL("/signin", request.url))
  }

  const { pathname } = request.nextUrl
  const flow = pathname.startsWith("/opening/camp")
    ? "camp"
    : pathname.startsWith("/opening/conference")
      ? "conference"
      : null

  if (flow && session.sessionType !== flow) {
    return NextResponse.redirect(new URL(`/opening/${session.sessionType}/welcome`, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/opening/:path*"],
}
