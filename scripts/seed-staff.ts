import { sql } from "drizzle-orm"

import { STAFF_EMAILS } from "@/data/staff-emails"
import { db } from "@/db"
import { staffAllowlist } from "@/db/schema/app"

// 把 data/staff-emails.ts 的名單同步進 staff_allowlist。
// 只做新增與更新，不刪除 —— 後台手動加的人不會被這支腳本掃掉。

async function main() {
  if (STAFF_EMAILS.length === 0) {
    console.log("data/staff-emails.ts 是空的，沒有東西要匯入。")
    return
  }

  const values = STAFF_EMAILS.map((s) => ({
    email: s.email.trim().toLowerCase(),
    role: s.role,
    note: s.note ?? null,
  }))

  const duplicates = values
    .map((v) => v.email)
    .filter((e, i, arr) => arr.indexOf(e) !== i)
  if (duplicates.length > 0) {
    throw new Error(`名單裡有重複的 email：${[...new Set(duplicates)].join(", ")}`)
  }

  await db
    .insert(staffAllowlist)
    .values(values)
    .onConflictDoUpdate({
      target: staffAllowlist.email,
      set: { role: sql`excluded.role`, note: sql`excluded.note` },
    })

  const rows = await db.select().from(staffAllowlist)
  console.log(`已匯入 ${values.length} 筆，staff_allowlist 現有 ${rows.length} 筆：`)
  for (const r of rows) console.log(`  ${r.email}  ${r.role}${r.note ? "  (" + r.note + ")" : ""}`)
  console.log("\n名單上的人不需要重新註冊，下次用 Google 登入時 role 就會生效。")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
