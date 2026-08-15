// 工作人員名單範本。真實名單「不」進版控（這裡曾經直接寫死真實姓名和私人
// email，已經 commit 進這個 public repo，是個資外洩——不要重蹈覆轍）。
//
// 使用方式：
//   1. 建立 data/staff-emails.local.json（已被 .gitignore 忽略，不會進版控）
//   2. 內容格式同下方 STAFF_EMAILS 的陣列（JSON，不含註解）
//   3. 執行 `pnpm db:seed-staff`：偵測到 local.json 就會改讀那份
//
// 加人進來之後對方**不需要重新註冊**：role 是在每次登入時比對 staff_allowlist
// 表同步的，下次登入就會生效。
//
// admin 與 staff 目前權限相同，先分開是為了之後要限制某些操作時不用改 schema。
export type StaffEmailEntry = { email: string; role: "staff" | "admin"; note?: string }

export const STAFF_EMAILS: StaffEmailEntry[] = [
  // { email: "someone@example.com", role: "staff", note: "範例，實際名單請放 data/staff-emails.local.json" },
]
