// 各工作坊＋場次報名人數的橫向長條圖。跟 style.md 的「進度條」用法一致：
// 用同一支 brand-yellow，軌道用中性灰階，不另外發明新的強調色——這裡本來
// 就是「人數 / 上限」的進度概念，不是要分辨不同類別，用進度條的視覺語言
// 比一般長條圖更貼切。沒有設上限的欄位，寬度改成跟目前最大值（不論有沒有
// 上限）的比例，讓所有列在同一個尺度下還是能互相比較大小。
export function RegistrationChart({
  rows,
}: {
  rows: { label: string; count: number; capacity: number | null }[]
}) {
  const scaleMax = Math.max(1, ...rows.map((r) => r.capacity ?? r.count))

  return (
    <div className="mt-4 flex flex-col gap-3">
      {rows.map((r) => {
        const widthPct = Math.min(100, (r.count / scaleMax) * 100)
        return (
          <div key={r.label} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 flex-1 truncate">{r.label}</span>
              <span className="shrink-0 font-semibold text-primary">
                {r.count}
                {r.capacity !== null && <span className="text-muted-foreground"> / {r.capacity}</span>}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${widthPct}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
