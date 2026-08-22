const LODGING_NOTES = [
  "每天早上 7:15 開始 morning call！",
  "晚上 22:30 會開始查房，熄燈時間為 23:00，請務必留在自己的寢室，不得跑房。",
]

const LODGING_SPECIAL_NOTES = [
  "離房鑰匙請交櫃檯，晚上請準備好隔天上午會用到的東西。",
  "第三天早上退房，請前一晚先收好行李，在早上 8:20 前將行李放在大廳寄存。",
  // T 和 shirt 中間用不換行連字號（U+2011），視覺上跟一般連字號一樣，
  // 但不會被當成換行點——不然畫面窄的時候「T-」跟「shirt」會被拆成兩行。
  "第二天下午統一換穿 PASSION T‑shirt。",
]

export function CampLodgingInfo({ roomNumber }: { roomNumber: string | null }) {
  return (
    <div className="flex flex-col gap-6 rounded-3xl bg-muted p-6 text-left">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">房號</p>
        {/* 查不到房號（還沒分房、或這個人不在 camp_team_member 裡，例如
            工作人員）不要顯示假房號誤導人，改顯示「尚未分配」。 */}
        {roomNumber ? (
          <p className="text-6xl font-bold text-primary">{roomNumber}</p>
        ) : (
          <p className="text-2xl font-bold text-muted-foreground">尚未分配</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">住房須知</p>
        {LODGING_NOTES.map((line) => (
          <p key={line} className="text-base">
            {line}
          </p>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">特別須知</p>
        <ol className="flex flex-col gap-2 text-base">
          {LODGING_SPECIAL_NOTES.map((note, index) => (
            <li key={note}>
              {index + 1}. {note}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
