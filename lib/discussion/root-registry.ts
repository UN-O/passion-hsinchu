import { conferenceSessions } from "@/lib/opening-conference-content"

// 哪些頁面有討論串，由程式碼決定——不接受使用者自由輸入 rootKey。
// 這等同於「只有具管理權限的人能建立 root」：能新增一筆進這裡的人，
// 本來就要改程式碼、走部署流程，跟資料庫層級的權限檢查是同一件事。
//
// 目前接上兩種「活動 event」：CAMP 聚會頁（先只有一個佔位場次）與
// CONFERENCE 每一場正式聚會。CONFERENCE 工作坊原本也接了討論串，但
// 另一位協作者已經把 /conference/workshops/[id] 整個 route 拆掉、
// 改成主頁 ConferenceMissionHome 裡的 Dialog——等那邊的 UI 穩定、
// 而且有地方可以放討論串之後再補上。之後若 CAMP 聚會排程資料表定案、
// 或靈修每日內容需要各自討論串，照同樣的模式（穩定的字串 id → root
// key）加進來就好。
export type DiscussionRootDefinition = {
  key: string
  title: string
}

const CAMP_MEETING_ROOT: DiscussionRootDefinition = {
  key: "camp-meeting",
  title: "聚會心得討論",
}

const CONFERENCE_SESSION_ROOTS: DiscussionRootDefinition[] = conferenceSessions.map((session) => ({
  key: `conference-session-${session.id}`,
  title: `${session.sessionLabel}・${session.typeLabel}`,
}))

const ALL_ROOTS: DiscussionRootDefinition[] = [CAMP_MEETING_ROOT, ...CONFERENCE_SESSION_ROOTS]

const ROOT_BY_KEY = new Map(ALL_ROOTS.map((root) => [root.key, root]))

export function getRegisteredRoot(rootKey: string): DiscussionRootDefinition | null {
  return ROOT_BY_KEY.get(rootKey) ?? null
}

export function campMeetingRootKey(): string {
  return CAMP_MEETING_ROOT.key
}

export function conferenceSessionRootKey(sessionId: string): string {
  return `conference-session-${sessionId}`
}
