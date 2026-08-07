// 工作人員名單。用 `pnpm db:seed-staff` 匯入 staff_allowlist 表。
//
// 加人進來之後對方**不需要重新註冊**：role 是在每次登入時比對這張表同步的，
// 下次登入就會生效。
//
// admin 與 staff 目前權限相同，先分開是為了之後要限制某些操作時不用改 schema。
export const STAFF_EMAILS: { email: string; role: "staff" | "admin"; note?: string }[] = [
  // { email: "someone@gmail.com", role: "admin", note: "總召" },
]
