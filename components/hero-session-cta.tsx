import Link from "next/link"

import { Button } from "@/components/ui/button"
import type { AppSession } from "@/lib/session"

// 已登入使用者的首頁 CTA。按鈕依「報名了什麼」決定，不看日期 ——
// 人都登入了，再顯示「立即報名」沒有意義。
//
// 這是 server component：session 已經在 page 取好，不需要送任何 JS 到前端。
export function HeroSessionCta({ session }: { session: AppSession }) {
  const isStaff = session.user.role !== "attendee"

  if (isStaff) {
    return (
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Button asChild size="xl" className="w-full sm:w-auto">
          <Link href="/admin/enrollment">進入後台</Link>
        </Button>
        <Button asChild size="xl" variant="secondary" className="w-full sm:w-auto">
          <Link href="/camp">查看 CAMP 頁面</Link>
        </Button>
        <Button asChild size="xl" variant="secondary" className="w-full sm:w-auto">
          <Link href="/conference">查看 CONFERENCE 頁面</Link>
        </Button>
      </div>
    )
  }

  // 用 Google 登入但還沒對到名冊的人，先去認領，不然點進 /camp 只會被踢回來
  if (!session.enrollment) {
    return (
      <Button asChild size="xl" className="w-full sm:w-auto">
        <Link href="/claim">完成報到</Link>
      </Button>
    )
  }

  const { camp: inCamp, conference: inConference } = session.enrollment

  return (
    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
      {inCamp && (
        <Button asChild size="xl" className="w-full sm:w-auto">
          <Link href="/camp">進入 CAMP</Link>
        </Button>
      )}
      {inConference && (
        <Button
          asChild
          size="xl"
          variant={inCamp ? "secondary" : "default"}
          className="w-full sm:w-auto"
        >
          <Link href="/conference">進入 CONFERENCE</Link>
        </Button>
      )}
    </div>
  )
}
