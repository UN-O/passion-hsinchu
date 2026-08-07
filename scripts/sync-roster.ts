import { parse } from "csv-parse/sync"

import { applyDiff, getAllForDiff } from "@/lib/enrollment"
import { diffEnrollments, parseEnrollmentCsv } from "@/lib/enrollment-csv"
import { normalizeChurch, normalizeName } from "@/lib/normalize"

// 直接對 Google Form 的「回覆」試算表匯出 CSV，只取姓名與所屬教會兩欄。
// 生日、電話、緊急聯絡人、信仰問答等欄位一律不讀取、不落地——這個系統的
// 名冊只需要姓名與教會，其他欄位是未成年人的個資，沒有理由經手。
//
// 用法： pnpm db:sync-roster          先看預覽，不寫入
//       pnpm db:sync-roster --apply  預覽後直接套用（新增/更新，絕不刪除）

type SheetSource = {
  label: string
  flow: "camp" | "conference"
  url: string
  // 標頭比對用前綴，因為兩份表單一個用「姓名」一個用「姓名：」
  namePrefix: string
  churchPrefix: string
}

const SOURCES: SheetSource[] = [
  {
    label: "CAMP",
    flow: "camp",
    url: "https://docs.google.com/spreadsheets/d/REDACTED_CAMP_SHEET_ID/export?format=csv&gid=1101889416",
    namePrefix: "姓名",
    churchPrefix: "所屬教會",
  },
  {
    label: "CONFERENCE",
    flow: "conference",
    url: "https://docs.google.com/spreadsheets/d/REDACTED_CONFERENCE_SHEET_ID/export?format=csv&gid=718985630",
    namePrefix: "姓名",
    churchPrefix: "所屬教會",
  },
]

type Extracted = { name: string; church: string; flow: "camp" | "conference"; lineNumber: number }

async function fetchSheet(source: SheetSource): Promise<Extracted[]> {
  const res = await fetch(source.url)
  if (!res.ok) {
    throw new Error(`${source.label} 下載失敗：HTTP ${res.status}`)
  }
  const text = await res.text()

  const records: string[][] = parse(text, {
    bom: true,
    skip_empty_lines: true,
    relax_column_count: true,
  })

  const header = records[0]
  const nameCol = header.findIndex((h) => h.trim().startsWith(source.namePrefix))
  const churchCol = header.findIndex((h) => h.trim().startsWith(source.churchPrefix))

  if (nameCol === -1 || churchCol === -1) {
    throw new Error(
      `${source.label} 找不到姓名或所屬教會欄位（讀到的標頭：${header.slice(0, 8).join(", ")}...）`
    )
  }

  const out: Extracted[] = []
  for (let i = 1; i < records.length; i++) {
    const name = (records[i][nameCol] ?? "").trim()
    const church = (records[i][churchCol] ?? "").trim()
    if (!name || !church) continue // 未填完的表單回覆，跳過
    out.push({ name, church, flow: source.flow, lineNumber: i + 1 })
  }
  return out
}

function buildCsv(campRows: Extracted[], confRows: Extracted[]): { csv: string; sourceCount: number } {
  // 用 (nameNorm, churchNorm) 合併兩份表單：兩場都報名的人會合併成一列。
  const merged = new Map<string, { name: string; church: string; camp: boolean; conference: boolean }>()

  for (const row of [...campRows, ...confRows]) {
    const key = `${normalizeName(row.name)} ${normalizeChurch(row.church)}`
    const existing = merged.get(key)
    if (existing) {
      if (row.flow === "camp") existing.camp = true
      if (row.flow === "conference") existing.conference = true
    } else {
      merged.set(key, {
        name: row.name,
        church: row.church,
        camp: row.flow === "camp",
        conference: row.flow === "conference",
      })
    }
  }

  const lines = ["姓名,教會,CAMP,CONFERENCE"]
  for (const r of merged.values()) {
    const esc = (s: string) => (s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s)
    lines.push(`${esc(r.name)},${esc(r.church)},${r.camp},${r.conference}`)
  }

  return { csv: lines.join("\n"), sourceCount: campRows.length + confRows.length }
}

async function main() {
  const apply = process.argv.includes("--apply")

  console.log("下載中...")
  const [campRows, confRows] = await Promise.all(SOURCES.map(fetchSheet))
  console.log(`CAMP 表單有效回覆：${campRows.length} 筆`)
  console.log(`CONFERENCE 表單有效回覆：${confRows.length} 筆`)

  const { csv, sourceCount } = buildCsv(campRows, confRows)
  const { rows, errors } = parseEnrollmentCsv(csv)

  console.log(`\n合併後不重複人數：${rows.length}（原始總筆數 ${sourceCount}，含兩場都報名重疊與表單內重複提交）`)

  if (errors.length > 0) {
    console.log(`\n以下 ${errors.length} 列有問題，不會被匯入：`)
    for (const e of errors) console.log(`  第 ${e.lineNumber} 行：${e.message}`)
  }

  const existing = await getAllForDiff()
  const diff = diffEnrollments(rows, existing)

  console.log(
    `\n預覽：新增 ${diff.createCount} 筆、更新 ${diff.updateCount} 筆、未變更 ${diff.unchangedCount} 筆`
  )

  const changed = diff.entries.filter((e) => e.action !== "unchanged")
  if (changed.length > 0) {
    console.log("\n變更明細：")
    for (const e of changed) {
      const tag = e.action === "create" ? "新增" : "更新"
      const detail = e.changes.length > 0 ? `（${e.changes.join("、")}）` : ""
      console.log(`  ${tag}  ${e.row.name} / ${e.row.church}${detail}`)
    }
  }

  if (!apply) {
    console.log("\n這是預覽，尚未寫入資料庫。要套用請加 --apply。")
    return
  }

  const result = await applyDiff(diff)
  console.log(
    `\n已套用：新增 ${result.created} 筆、更新 ${result.updated} 筆、未變更 ${result.unchanged} 筆`
  )
  console.log("（只做新增與更新，沒有刪除任何既有名冊資料）")
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
