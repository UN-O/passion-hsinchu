import type { Flow } from "@/lib/session"
import { conferenceSessions } from "@/lib/opening-conference-content"
import { getCampMeetingSessions } from "@/lib/opening-camp-content"
import { DEVOTION_ENTRIES } from "@/lib/devotion-content"

// 哪些頁面有討論串，由程式碼決定——不接受使用者自由輸入 rootKey。
// 這等同於「只有具管理權限的人能建立 root」：能新增一筆進這裡的人，
// 本來就要改程式碼、走部署流程，跟資料庫層級的權限檢查是同一件事。
export type DiscussionRootDefinition = {
  key: string
  title: string
  // 這個討論串屬於哪一場活動。通用路由 /discussion/[postId] 沒有辦法從網址
  // 判斷該用哪個 flow 的權限閘門，只能從貼文的 root 反查回這裡——所以
  // flow 是註冊表的必填欄位，不是從 key 的前綴猜的：新增 root 時忘了想
  // 權限就會直接編譯失敗，而不是預設放行。
  flow: Flow
  // 這個討論串所屬的來源頁面，給討論串詳細頁的「返回」用。
  sourcePath: string
}

// CAMP 舊版單一聚會討論（現在改成逐場，見 CAMP_SESSION_ROOTS）。繼續留在
// 白名單裡但不再是任何頁面的預設入口——避免萬一底下已經有真實留言時，
// /discussion/[postId] 反查會找不到 flow 而整串變成 404（見 CLAUDE.md：
// 外洩／資料處理要謹慎，這裡是「別把使用者已經留的內容弄丟」的同類考量）。
const CAMP_MEETING_ROOT: DiscussionRootDefinition = {
  key: "camp-meeting",
  title: "聚會心得討論",
  flow: "camp",
  sourcePath: "/camp/meeting",
}

// CAMP 6 場開放討論的場次（開場／兩場晚場／閉幕＋勇者辯論場／Live
// Podcast），逐場各自一個討論串，跟 CONFERENCE_SESSION_ROOTS 同一個模式。
// 大地競賽只有場次資訊頁、不開放留言，不在這裡面（見
// lib/opening-camp-content.ts 的 CAMP_MEETING_SESSION_IDS）。
const CAMP_SESSION_ROOTS: DiscussionRootDefinition[] = getCampMeetingSessions().map((session) => ({
  key: `camp-session-${session.id}`,
  title: session.label,
  flow: "camp",
  sourcePath: `/camp/meeting/${session.id}`,
}))

// CAMP 靈修：引導問題會是這個 root 底下置頂的官方回覆（見
// lib/discussion/root.ts 的 getOrCreateDevotionRoot）。
const CAMP_DEVOTION_ROOTS: DiscussionRootDefinition[] = DEVOTION_ENTRIES.map((entry) => ({
  key: `camp-devotion-${entry.id}`,
  title: entry.title,
  flow: "camp",
  sourcePath: `/camp/devotion/${entry.id}`,
}))

// CONFERENCE 工作坊原本也接了討論串，但另一位協作者已經把
// /conference/workshops/[id] 整個 route 拆掉、改成主頁 ConferenceMissionHome
// 裡的 Dialog——等那邊的 UI 穩定、而且有地方可以放討論串之後再補上。
const CONFERENCE_SESSION_ROOTS: DiscussionRootDefinition[] = conferenceSessions.map((session) => ({
  key: `conference-session-${session.id}`,
  title: `${session.sessionLabel}・${session.typeLabel}`,
  flow: "conference",
  sourcePath: `/conference/meeting/${session.id}`,
}))

const ALL_ROOTS: DiscussionRootDefinition[] = [
  CAMP_MEETING_ROOT,
  ...CAMP_SESSION_ROOTS,
  ...CAMP_DEVOTION_ROOTS,
  ...CONFERENCE_SESSION_ROOTS,
]

const ROOT_BY_KEY = new Map(ALL_ROOTS.map((root) => [root.key, root]))

export function getRegisteredRoot(rootKey: string): DiscussionRootDefinition | null {
  return ROOT_BY_KEY.get(rootKey) ?? null
}

// 某個 root_key 對應到哪一場活動的權限閘門。查不到（沒註冊過的 key）一律
// 回 null，呼叫端要當成「不存在」處理，不可以 fallback 成放行。
export function flowForRootKey(rootKey: string | null): Flow | null {
  if (!rootKey) return null
  return ROOT_BY_KEY.get(rootKey)?.flow ?? null
}

export function campSessionRootKey(sessionId: string): string {
  return `camp-session-${sessionId}`
}

export function campDevotionRootKey(day: string): string {
  return `camp-devotion-${day}`
}

export function conferenceSessionRootKey(sessionId: string): string {
  return `conference-session-${sessionId}`
}
