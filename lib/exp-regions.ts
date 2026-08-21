// CAMP 加分系統的固定常數。
//
// 這個檔案刻意不 import 任何伺服器端的東西（尤其是 @/db）：client component
// 也要用到分區名稱與 preset，把資料存取放進來會把 db 連線一起打包到前端。
// 有查資料庫的部分都在 lib/exp.ts。

// 三區是固定的，不進資料庫——不會有人在活動中途新增一區，
// 而做成資料表反而讓「有幾區」變成執行期才知道的事。
export const EXP_REGIONS = [
  { key: "bee", label: "蜜蜂" },
  { key: "clownfish", label: "尼莫魚" },
  { key: "groundhog", label: "土撥鼠" },
] as const

export type ExpRegion = (typeof EXP_REGIONS)[number]["key"]

export const EXP_REGION_KEYS: readonly ExpRegion[] = EXP_REGIONS.map((region) => region.key)

const REGION_LABELS: Record<ExpRegion, string> = Object.fromEntries(
  EXP_REGIONS.map((region) => [region.key, region.label])
) as Record<ExpRegion, string>

export function isExpRegion(value: unknown): value is ExpRegion {
  return typeof value === "string" && EXP_REGION_KEYS.includes(value as ExpRegion)
}

export function expRegionLabel(region: ExpRegion): string {
  return REGION_LABELS[region]
}

// 快捷鍵的分數。其他數字用數字鍵盤自己打。
export const EXP_AMOUNT_PRESETS = [200, 400, 500, 1000, 2000] as const

// 不會有扣分，所以下限是 1。上限純粹是手滑防呆：數字鍵盤上多按兩個 0
// 就會變成 200000，那一筆足以讓整場比賽失去意義，而且事後只能靠刪除補救。
export const EXP_AMOUNT_MIN = 1
export const EXP_AMOUNT_MAX = 100000

export const EXP_REASON_MAX_LENGTH = 200

// 原因只是標籤，不綁分數。2025 是一個 preset 一個固定分數，這裡刻意拆開：
// 同一個原因在不同情境給的分數不一定一樣。
export const EXP_REASON_PRESETS = [
  "大隊長加分",
  "PERK",
  "bonus (小)",
  "bonus (中)",
  "bonus (大)",
  "反應熱烈",
  "小競賽",
  "小隊呼",
  "最早到場",
  "對牧者有禮貌",
  "團隊合作",
  "創意表現",
  "準時集合",
  "環境整潔",
  "優秀表現",
  "MVP或特殊貢獻",
  "闖關勝利",
] as const
