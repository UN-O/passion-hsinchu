import { CampMissionHome } from "@/components/camp-mission-home"
import { assertPlaygroundEnabled } from "@/lib/playground-guard"

// CampMissionHome 是真正的伺服器元件，會直接查資料庫（分區積分、小隊
// 積分、房號…）。這頁沒有 session/headers 可以讓 Next 自動判斷要動態
// 渲染，預設會在 build time 嘗試靜態預先產生——那個時間點如果剛好有
// schema 改動還沒 migrate 到正式資料庫，build 就會直接失敗（曾經因此
// 讓兩次部署失敗）。明確標成動態渲染，讓它跟真正的 /camp 頁面一樣
// 只在 request time 查詢。
export const dynamic = "force-dynamic"

export default function CampMissionHomePlaygroundPage() {
  // 這頁會查資料庫，proxy.ts 之外自己再擋一次，見 lib/playground-guard.ts。
  assertPlaygroundEnabled()
  return <CampMissionHome profileHref="/playground/camp-profile" meetingHref="/playground/camp-meeting" />
}
