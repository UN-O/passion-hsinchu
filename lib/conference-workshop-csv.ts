import { parse } from "csv-parse/sync"

import type { ExistingWorkshopRow, ImportEntry } from "./conference-workshop"
import type { ExistingRow } from "./enrollment-csv"
import { normalizeChurch, normalizeName } from "./normalize"
import { conferenceWorkshops, type ConferenceWorkshopRound } from "./opening-conference-content"

export type ParsedWorkshopRow = {
  lineNumber: number
  name: string
  church: string
  nameNorm: string
  churchNorm: string
  selections: Record<ConferenceWorkshopRound, string> // workshopId
}

export type RowError = { lineNumber: number; message: string; raw: string }

export type ParseResult = { rows: ParsedWorkshopRow[]; errors: RowError[] }

// 姓名／教會欄位用「開頭是不是這幾個字」比對，不要求完全相等：現場的
// Google 表單標頭實際上是「姓名 ：」「所屬教會 ：」，跟 scripts/sync-roster.ts
// 抓報名名冊的做法一致（見那支檔案的說明）。工作坊欄位標頭更長、後面還
// 帶著「＊（工作坊A人數已額滿，故不開放選填。）」這類即時公告文字，同樣
// 只能用前綴比對，逐字比對標頭一定會兜不起來。
const HEADER_PREFIXES: Record<"name" | "church" | "R1" | "R2", string[]> = {
  name: ["姓名"],
  church: ["所屬教會", "教會"],
  R1: ["第一場工作坊", "第1場工作坊"],
  R2: ["第二場工作坊", "第2場工作坊"],
}

function findHeaderIndex(header: string[], prefixes: string[]): number {
  return header.findIndex((cell) => prefixes.some((p) => cell.trim().startsWith(p)))
}

// 表單選項是「A｜預備自己成為對的人，其實很需要勇氣！｜Adri 小之牧師」這種
// 格式，只取最前面的英文字母去對 workshop id（workshop-a 的字尾）——主題
// 文案、講員稱呼都可能跟程式裡存的字面不完全一樣，字母代號才是穩定的鍵。
function workshopIdFromLetter(letter: string): string | undefined {
  return conferenceWorkshops.find((w) => w.id === `workshop-${letter.toLowerCase()}`)?.id
}

function parseSelectionCell(raw: string, round: ConferenceWorkshopRound): { workshopId: string } | { error: string } {
  const trimmed = raw.trim()
  if (!trimmed) return { error: "沒有填" }

  const letter = trimmed.split("｜")[0]?.trim().toUpperCase()
  const workshopId = letter ? workshopIdFromLetter(letter) : undefined
  if (!workshopId) return { error: `看不懂的選項："${trimmed}"` }

  const workshop = conferenceWorkshops.find((w) => w.id === workshopId)!
  if (!workshop.rounds.includes(round)) {
    return { error: `《${workshop.topic || workshop.speaker}》沒有開放這個場次` }
  }
  return { workshopId }
}

export function parseWorkshopCsv(text: string): ParseResult {
  const rows: ParsedWorkshopRow[] = []
  const errors: RowError[] = []

  let records: string[][]
  try {
    records = parse(text, {
      bom: true,
      skip_empty_lines: true,
      relax_column_count: true,
      trim: true,
    }) as string[][]
  } catch (error) {
    return { rows: [], errors: [{ lineNumber: 0, message: `CSV 格式錯誤：${(error as Error).message}`, raw: "" }] }
  }

  if (records.length === 0) {
    return { rows: [], errors: [{ lineNumber: 0, message: "檔案是空的", raw: "" }] }
  }

  const header = records[0]
  const nameCol = findHeaderIndex(header, HEADER_PREFIXES.name)
  const churchCol = findHeaderIndex(header, HEADER_PREFIXES.church)
  const r1Col = findHeaderIndex(header, HEADER_PREFIXES.R1)
  const r2Col = findHeaderIndex(header, HEADER_PREFIXES.R2)

  const missing = [
    nameCol === -1 && "姓名",
    churchCol === -1 && "所屬教會",
    r1Col === -1 && "第一場工作坊",
    r2Col === -1 && "第二場工作坊",
  ].filter((v): v is string => Boolean(v))

  if (missing.length > 0) {
    return {
      rows: [],
      errors: [
        {
          lineNumber: 1,
          message: `標頭缺少欄位：${missing.join("、")}（讀到的標頭：${header.join(", ")}）`,
          raw: header.join(","),
        },
      ],
    }
  }

  // 同一個人在原始表單裡重複填寫，是使用者填錯後又重新送一次（Google
  // 表單允許重複作答），後面那筆才是他真正要的——跟 enrollment CSV「後面
  // 那列略過」剛好相反，這裡故意讓後面覆蓋前面，不當成錯誤。
  const byKey = new Map<string, ParsedWorkshopRow>()

  for (let i = 1; i < records.length; i++) {
    const record = records[i]
    const lineNumber = i + 1
    const raw = record.join(",")

    const name = (record[nameCol] ?? "").trim()
    const church = (record[churchCol] ?? "").trim()
    if (!name || !church) {
      errors.push({ lineNumber, message: "姓名或教會是空的", raw })
      continue
    }

    const r1 = parseSelectionCell(record[r1Col] ?? "", "R1")
    const r2 = parseSelectionCell(record[r2Col] ?? "", "R2")
    if ("error" in r1 || "error" in r2) {
      const parts = ["error" in r1 && `場次一：${r1.error}`, "error" in r2 && `場次二：${r2.error}`].filter(
        (v): v is string => Boolean(v)
      )
      errors.push({ lineNumber, message: parts.join("；"), raw })
      continue
    }

    const nameNorm = normalizeName(name)
    const churchNorm = normalizeChurch(church)
    byKey.set(`${nameNorm} ${churchNorm}`, {
      lineNumber,
      name,
      church,
      nameNorm,
      churchNorm,
      selections: { R1: r1.workshopId, R2: r2.workshopId },
    })
  }

  rows.push(...byKey.values())
  return { rows, errors }
}

export type WorkshopDiffEntry = {
  row: ParsedWorkshopRow
  enrollmentId: string | null // null = 名冊比對不到
  action: "create" | "update" | "unchanged" | "unmatched"
  changes: string[]
}

export type WorkshopDiff = {
  entries: WorkshopDiffEntry[]
  createCount: number
  updateCount: number
  unchangedCount: number
  unmatchedCount: number
}

const roundLabel: Record<ConferenceWorkshopRound, string> = { R1: "場次一", R2: "場次二" }

function workshopLabel(workshopId: string): string {
  const workshop = conferenceWorkshops.find((w) => w.id === workshopId)
  return workshop?.topic || workshop?.speaker || workshopId
}

// 比對 CSV 跟現有名冊（拿姓名＋教會換 enrollmentId）與現有報名資料，
// 產生預覽。名冊比不到的人會被標成 unmatched，後台會列出來但不會匯入——
// 這張表不負責新增名冊，姓名／教會打錯要去 /admin/enrollment 那邊修。
export function diffWorkshopRegistrations(
  rows: ParsedWorkshopRow[],
  enrollments: ExistingRow[],
  existingRegistrations: ExistingWorkshopRow[]
): WorkshopDiff {
  const enrollmentByKey = new Map(enrollments.map((e) => [`${e.nameNorm} ${e.churchNorm}`, e.id]))
  const registrationByKey = new Map(existingRegistrations.map((r) => [`${r.enrollmentId} ${r.round}`, r.workshopId]))

  const entries: WorkshopDiffEntry[] = rows.map((row) => {
    const enrollmentId = enrollmentByKey.get(`${row.nameNorm} ${row.churchNorm}`) ?? null
    if (!enrollmentId) return { row, enrollmentId: null, action: "unmatched", changes: [] }

    const changes: string[] = []
    let isNew = false
    for (const round of ["R1", "R2"] as ConferenceWorkshopRound[]) {
      const existing = registrationByKey.get(`${enrollmentId} ${round}`)
      const next = row.selections[round]
      if (existing === undefined) {
        isNew = true
        changes.push(`${roundLabel[round]} → ${workshopLabel(next)}`)
      } else if (existing !== next) {
        changes.push(`${roundLabel[round]} ${workshopLabel(existing)} → ${workshopLabel(next)}`)
      }
    }

    const action = changes.length === 0 ? "unchanged" : isNew ? "create" : "update"
    return { row, enrollmentId, action, changes }
  })

  return {
    entries,
    createCount: entries.filter((e) => e.action === "create").length,
    updateCount: entries.filter((e) => e.action === "update").length,
    unchangedCount: entries.filter((e) => e.action === "unchanged").length,
    unmatchedCount: entries.filter((e) => e.action === "unmatched").length,
  }
}

export function toImportEntries(diff: WorkshopDiff): ImportEntry[] {
  const entries: ImportEntry[] = []
  for (const entry of diff.entries) {
    if (entry.action !== "create" && entry.action !== "update") continue
    if (!entry.enrollmentId) continue
    for (const round of ["R1", "R2"] as ConferenceWorkshopRound[]) {
      entries.push({ enrollmentId: entry.enrollmentId, round, workshopId: entry.row.selections[round] })
    }
  }
  return entries
}
