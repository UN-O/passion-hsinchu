import { RosterImageDialog } from "./roster-image-dialog"
import type { ConferenceWorkshopRound } from "@/lib/opening-conference-content"

// 文字版直接連結下載（<a href> 就能觸發瀏覽器下載，不用前端 JS）；
// 圖片版改成先開預覽對話框，見 roster-image-dialog.tsx。
export function RosterDownload({
  workshopId,
  round,
}: {
  workshopId: string
  round: ConferenceWorkshopRound
}) {
  return (
    <span className="flex items-center gap-3 text-xs">
      <a
        href={`/api/admin/conference-workshop/roster?workshopId=${workshopId}&round=${round}&format=txt`}
        className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        下載名單（文字）
      </a>
      <RosterImageDialog workshopId={workshopId} round={round} />
    </span>
  )
}
