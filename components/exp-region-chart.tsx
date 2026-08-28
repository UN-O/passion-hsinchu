import { expRegionLabel, type ExpRegion } from "@/lib/exp-regions"

export type ExpRegionChartRow = {
  region: ExpRegion
  total: number
  records: number
}

// 三區總分比較。
//
// 圖表決策（依 dataviz skill）：
// - 工作是「比大小」而不是「分辨身分」，所以是橫向長條圖，
//   而且是單一數列 —— 三根棒子同一個顏色。給每一區各自的顏色是把長度已經
//   表達過的資訊再用色相編碼一次，白白燒掉唯一的自由通道。
// - 顏色不跟著名次跑：排序改變時不會有任何一根棒子換色。
// - 顏色用中性灰（--chart-1）。style.md 規定 brand-yellow 只做強調，
//   大面積色塊不用；也不另外發明強調色。
// - 單一數列不需要圖例；三筆資料直接把數字標在棒子末端外側，
//   所以也不需要座標軸刻度。
// - 下面附一份表格，數值不必靠 hover 才讀得到。
export function ExpRegionChart({ rows }: { rows: ExpRegionChartRow[] }) {
  const max = Math.max(...rows.map((row) => row.total), 0)
  const totalAll = rows.reduce((sum, row) => sum + row.total, 0)

  if (totalAll === 0) {
    return <p className="mt-6 text-sm text-muted-foreground">目前還沒有任何加分記錄。</p>
  }

  return (
    <figure className="mt-6">
      <div className="flex flex-col gap-5">
        {rows.map((row) => {
          const label = expRegionLabel(row.region)
          const percent = max === 0 ? 0 : (row.total / max) * 100

          return (
            <div
              key={row.region}
              className="group/bar flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4"
              tabIndex={0}
              title={`${label}：${row.total.toLocaleString("en-US")} 分（${row.records} 筆）`}
            >
              <span className="text-sm sm:w-16 sm:shrink-0">{label}</span>

              <div className="flex flex-1 items-center gap-3">
                {/* 未填滿的軌道用極淡的中性色，只是讓人看得出比例尺 */}
                <div className="h-4 flex-1 rounded-r-[4px] bg-white/5">
                  <div
                    // 資料端 4px 圓角、貼齊基線那端是直角。
                    // 0 分要完全沒有棒子：min-w 會讓 0 也畫出一小截，看起來像有分。
                    className={`h-full rounded-r-[4px] bg-chart-1 transition-colors group-hover/bar:bg-white group-focus/bar:bg-white ${
                      row.total > 0 ? "min-w-0.5" : ""
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                {/* 數值標在棒子外側：標在裡面會被短棒子裁掉 */}
                <span className="w-20 shrink-0 text-right text-sm tabular-nums">
                  {row.total.toLocaleString("en-US")}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* 基線：一條 1px 實線，不用虛線 */}
      <div className="mt-1 border-t border-border" />

      <figcaption className="sr-only">三區加分總分比較</figcaption>

      {/* 表格本身不會主動縮到比內容窄，外層沒有 overflow-x-auto 的話，內容一旦
          比窄螢幕寬（例如分數位數變多），整個頁面會被撐開橫向捲動，不是只有
          表格自己捲。這裡本來就沒有這層，先補上。 */}
      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">三區加分總分與記錄筆數</caption>
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th scope="col" className="py-2 text-left font-normal">
                分區
              </th>
              <th scope="col" className="py-2 text-right font-normal">
                總分
              </th>
              <th scope="col" className="py-2 text-right font-normal">
                筆數
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.region} className="border-b border-border">
                <th scope="row" className="py-2 text-left font-normal">
                  {expRegionLabel(row.region)}
                </th>
                <td className="py-2 text-right tabular-nums">{row.total.toLocaleString("en-US")}</td>
                <td className="py-2 text-right tabular-nums text-muted-foreground">{row.records}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  )
}
