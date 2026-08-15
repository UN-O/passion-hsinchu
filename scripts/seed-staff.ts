import fs from "node:fs"
import path from "node:path"

import { sql } from "drizzle-orm"

import { STAFF_EMAILS as TEMPLATE_STAFF_EMAILS, type StaffEmailEntry } from "@/data/staff-emails"
import { db } from "@/db"
import { staffAllowlist } from "@/db/schema/app"

// 把工作人員名單同步進 staff_allowlist。只做新增與更新，不刪除 —— 後台手動
// 加的人不會被這支腳本掃掉。
//
// 真實名單放在 data/staff-emails.local.json（不進版控），有這個檔案就優先
// 讀它；沒有的話退回 data/staff-emails.ts 裡的範本（預設是空的）。

const LOCAL_STAFF_FILE = path.join(process.cwd(), "data/staff-emails.local.json")

function loadStaffEmails(): { emails: StaffEmailEntry[]; source: string } {
  if (fs.existsSync(LOCAL_STAFF_FILE)) {
    const parsed = JSON.parse(fs.readFileSync(LOCAL_STAFF_FILE, "utf8"))
    return { emails: parsed, source: "data/staff-emails.local.json" }
  }
  return { emails: TEMPLATE_STAFF_EMAILS, source: "data/staff-emails.ts" }
}

async function main() {
  const { emails: STAFF_EMAILS, source } = loadStaffEmails()

  if (STAFF_EMAILS.length === 0) {
    console.log(
      `${source} 是空的，沒有東西要匯入。真實名單請放在 data/staff-emails.local.json（該檔已被 git 忽略）。`,
    )
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
  console.log(`已從 ${source} 匯入 ${values.length} 筆，staff_allowlist 現有 ${rows.length} 筆：`)
  for (const r of rows) console.log(`  ${r.email}  ${r.role}${r.note ? "  (" + r.note + ")" : ""}`)
  console.log("\n名單上的人不需要重新註冊，下次用 Google 登入時 role 就會生效。")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
