import type { ExpRegion } from "./exp-regions"

// 三區、各 3 隊，共 9 隊，固定不變——跟 lib/exp-regions.ts 的三區一樣不進
// 資料庫（不會有人在活動中途新增一隊）。隊名本身就是唯一值，直接拿來當
// key，不用另外編號。
//
// 這個檔案跟 lib/exp-regions.ts、lib/camp-zones.ts 一樣不 import 任何
// 伺服器端的東西，client component（後台加分流程）可以直接用。
export type CampTeam = {
  name: string
  region: ExpRegion
}

export const CAMP_TEAMS: CampTeam[] = [
  { name: "鼠命必達", region: "groundhog" },
  { name: "鼠靈軍隊", region: "groundhog" },
  { name: "土撥天際", region: "groundhog" },
  { name: "六眼肥魚", region: "clownfish" },
  { name: "海葵勇士", region: "clownfish" },
  { name: "小小幸運鰭", region: "clownfish" },
  { name: "電蜂善", region: "bee" },
  { name: "搧蜂點火", region: "bee" },
  { name: "大蜂收", region: "bee" },
]

const CAMP_TEAM_NAMES = new Set(CAMP_TEAMS.map((team) => team.name))

export function isCampTeamName(value: unknown): value is string {
  return typeof value === "string" && CAMP_TEAM_NAMES.has(value)
}

// 加分只認隊，分區是從隊反推的（隊名跟分區是多對一，不會有一個隊名橫跨
// 兩區的情況）——呼叫端不用另外自己維護一份隊名對分區的對照表。
export function campTeamRegion(teamName: string): ExpRegion | undefined {
  return CAMP_TEAMS.find((team) => team.name === teamName)?.region
}
