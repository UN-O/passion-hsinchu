import { eq } from "drizzle-orm"

import { db } from "@/db"
import { staffAllowlist } from "@/db/schema/app"
import { user } from "@/db/schema/auth"

export type StaffRole = "staff" | "admin"

export async function lookupStaffRole(email: string): Promise<StaffRole | null> {
  const [row] = await db
    .select({ role: staffAllowlist.role })
    .from(staffAllowlist)
    .where(eq(staffAllowlist.email, email.trim().toLowerCase()))
    .limit(1)

  return row?.role ?? null
}

// 每次登入時把 user.role 對齊 staff_allowlist。
//
// 刻意掛在 session 建立而不是 user 建立：這樣「之後才被加進名單的人」
// 不用刪帳號重註冊，下次登入自動生效；被移出名單的人也會自動降回 attendee。
export async function syncStaffRole(userId: string): Promise<void> {
  const [current] = await db
    .select({ role: user.role, email: user.email })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)

  if (!current) return

  // CAMP 那條路的合成信箱不可能出現在名單上，直接跳過省一次查詢
  if (current.email.endsWith("@camp.invalid")) return

  const desired: "attendee" | StaffRole = (await lookupStaffRole(current.email)) ?? "attendee"
  if (current.role === desired) return

  await db.update(user).set({ role: desired }).where(eq(user.id, userId))
}
