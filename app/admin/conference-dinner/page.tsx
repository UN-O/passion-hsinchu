import { getDinnerStats } from "@/lib/conference-dinner"
import { dinnerDateLabel, dinnerLocationLabel, dinnerTimeLabel } from "@/lib/opening-conference-content"
import { requireStaff } from "@/lib/session"
import { DinnerRosterImageDialog } from "./roster-image-dialog"

export default async function AdminConferenceDinnerPage() {
  await requireStaff()

  const stats = await getDinnerStats()

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">晚餐報名</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {dinnerDateLabel} {dinnerTimeLabel}｜{dinnerLocationLabel}
      </p>

      <section className="mt-12">
        <h2 className="font-heading text-lg font-bold">統計</h2>
        <p className="mt-2 text-sm">
          CONFERENCE 報名 <span className="font-semibold text-primary">{stats.totalConferenceEnrolled}</span> 人・
          參加 <span className="font-semibold text-primary">{stats.attendingCount}</span> 人・
          不參加 <span className="font-semibold text-primary">{stats.notAttendingCount}</span> 人・
          還沒填 <span className="font-semibold text-primary">{stats.notRespondedCount}</span> 人
        </p>

        <ul className="mt-4 flex flex-col divide-y divide-border">
          <li className="flex items-center justify-between py-2 text-sm">
            <span>葷食便當</span>
            <span className="font-semibold text-primary">{stats.meatCount} 份</span>
          </li>
          <li className="flex items-center justify-between py-2 text-sm">
            <span>素食便當</span>
            <span className="font-semibold text-primary">{stats.veggieCount} 份</span>
          </li>
        </ul>
      </section>

      <section className="mt-16">
        <h2 className="font-heading text-lg font-bold">下載訂便當名單</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          葷素分開下載。文字檔方便對訂購數量、圖片版可以直接放進 PPT，簽到表多一欄「是否領取」，現場發便當時核對用。
        </p>
        <ul className="mt-4 flex flex-col gap-4 text-sm">
          <li className="flex flex-col gap-1">
            <span className="font-medium">葷食（{stats.meatCount} 人）</span>
            <span className="flex flex-wrap items-center gap-3 text-xs">
              <a
                href="/api/admin/conference-dinner/roster?mealType=meat"
                className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                下載名單（文字）
              </a>
              <DinnerRosterImageDialog mealType="meat" withCheckColumn={false} />
              <DinnerRosterImageDialog mealType="meat" withCheckColumn={true} />
            </span>
          </li>
          <li className="flex flex-col gap-1">
            <span className="font-medium">素食（{stats.veggieCount} 人）</span>
            <span className="flex flex-wrap items-center gap-3 text-xs">
              <a
                href="/api/admin/conference-dinner/roster?mealType=veggie"
                className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                下載名單（文字）
              </a>
              <DinnerRosterImageDialog mealType="veggie" withCheckColumn={false} />
              <DinnerRosterImageDialog mealType="veggie" withCheckColumn={true} />
            </span>
          </li>
        </ul>
      </section>
    </div>
  )
}
