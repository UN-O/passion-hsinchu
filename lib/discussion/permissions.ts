import type { AppSession } from "@/lib/session"

// 這個專案沒有「per-root 作者」的概念——root 是教材/活動本身，不是某個使用者
// 寫的（見 db/schema/discussion.ts 的說明）。所以規格裡的「Root 作者或
// Discussion Admin」直接對應到既有的 staff／admin 角色：全站的工作人員
// 就是每個 root 的 Discussion Admin，不需要另外設計 per-root ownership。
export function isDiscussionAdmin(session: AppSession): boolean {
  return session.user.role === "staff" || session.user.role === "admin"
}
