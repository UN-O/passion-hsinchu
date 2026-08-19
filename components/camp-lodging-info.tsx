// 住房資料目前沒有真的房號分配資料表，先放佔位內容，等資料確定後換成真的房號／須知。
const PLACEHOLDER_ROOM_NUMBER = "212"
const PLACEHOLDER_LODGING_NOTES = "這裡先放佔位文字，等住房須知與守則確定後補上。"

export function CampLodgingInfo() {
  return (
    <div className="flex flex-col gap-6 rounded-3xl bg-muted p-6 text-left">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">房號</p>
        <p className="text-6xl font-bold text-primary">{PLACEHOLDER_ROOM_NUMBER}</p>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">住房須知</p>
        <p className="text-base">{PLACEHOLDER_LODGING_NOTES}</p>
      </div>
    </div>
  )
}
