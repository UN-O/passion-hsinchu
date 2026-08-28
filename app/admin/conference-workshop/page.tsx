import { getWorkshopCapacities, getWorkshopCounts, getWorkshopRegistrationStats } from "@/lib/conference-workshop"
import {
  conferenceWorkshops,
  workshopRoundLabels,
  type ConferenceWorkshopRound,
} from "@/lib/opening-conference-content"
import { requireStaff } from "@/lib/session"
import { WorkshopAssignSearch } from "./assign-search"
import { CapacityForm } from "./capacity-form"
import { WorkshopCsvImport } from "./csv-import"
import { RegistrationChart } from "./registration-chart"
import { RosterDownload } from "./roster-download"

const ROUNDS: ConferenceWorkshopRound[] = ["R1", "R2"]

export default async function AdminConferenceWorkshopPage() {
  await requireStaff()

  const [counts, capacities, stats] = await Promise.all([
    getWorkshopCounts(),
    getWorkshopCapacities(),
    getWorkshopRegistrationStats(),
  ])

  // 依場次分組（不是依工作坊分組）：場次一全部列完才換場次二，兩組之間
  // 有分隔線，符合「同一場次是同一個時段」這個真正影響排程的分法。
  const slotsByRound = ROUNDS.map((round) => ({
    round,
    workshops: conferenceWorkshops.filter((w) => w.rounds.includes(round)),
  }))

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">工作坊報名</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        CONFERENCE 工作坊選擇。使用者可以隨時在系統上自己選／改，這裡的匯入只用來回填既有 Google
        表單回覆，不會覆蓋使用者自己在系統上選過的結果。
      </p>

      <section className="mt-12">
        <h2 className="font-heading text-lg font-bold">報名狀況</h2>
        <p className="mt-2 text-sm">
          CONFERENCE 報名 <span className="font-semibold text-primary">{stats.totalConferenceEnrolled}</span> 人・
          已選完兩場 <span className="font-semibold text-primary">{stats.completedCount}</span> 人・
          還沒選完 <span className="font-semibold text-primary">{stats.notCompletedCount}</span> 人
        </p>
        {slotsByRound.map(({ round, workshops }) => (
          <div key={round} className="mt-4 border-t border-border pt-4 first:mt-0 first:border-t-0 first:pt-0">
            <p className="text-sm font-semibold text-muted-foreground">{workshopRoundLabels[round]}</p>
            <RegistrationChart
              rows={workshops.map((workshop) => {
                const key = `${workshop.id}:${round}`
                return {
                  label: workshop.topic || workshop.speaker,
                  count: counts.get(key) ?? 0,
                  capacity: capacities.get(key) ?? null,
                }
              })}
            />
          </div>
        ))}
      </section>

      <section className="mt-16">
        <h2 className="font-heading text-lg font-bold">人數上限與名單</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          人數上限留空＝不限人數。額滿的組合會在使用者的選擇畫面上顯示「已額滿」、擋掉新選（已經選在裡面的人不受影響）。
        </p>
        {slotsByRound.map(({ round, workshops }) => (
          <div key={round} className="mt-6 border-t border-border pt-4 first:mt-4 first:border-t-0 first:pt-0">
            <p className="text-sm font-semibold text-muted-foreground">{workshopRoundLabels[round]}</p>
            <ul className="mt-2 flex flex-col divide-y divide-border">
              {workshops.map((workshop) => {
                const key = `${workshop.id}:${round}`
                return (
                  <li key={key} className="flex flex-col gap-1 py-1">
                    <CapacityForm
                      workshopId={workshop.id}
                      round={round}
                      label={workshop.topic || workshop.speaker}
                      count={counts.get(key) ?? 0}
                      currentCapacity={capacities.get(key) ?? null}
                    />
                    <RosterDownload workshopId={workshop.id} round={round} />
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </section>

      <section className="mt-16">
        <h2 className="font-heading text-lg font-bold">批次匯入既有回覆</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          欄位需包含 姓名、所屬教會、第一場工作坊、第二場工作坊（選項格式「A｜主題｜講員」，只認開頭的英文字母）。
          姓名／教會要先在 /admin/enrollment 的名冊裡對得到，才會被匯入。
        </p>
        <WorkshopCsvImport />
      </section>

      <section className="mt-16">
        <h2 className="font-heading text-lg font-bold">手動加入工作坊</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          搜尋名冊裡的人，直接幫他選一場工作坊——不卡選工作坊的更改截止時間，也不卡人數上限，現場救援用。
          只改你選的那個場次，另一場不會被動到。
        </p>
        <WorkshopAssignSearch />
      </section>
    </div>
  )
}
