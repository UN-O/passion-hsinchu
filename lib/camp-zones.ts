import type { ExpRegion } from "./exp-regions"

// 三區的顯示資料（名稱、icon、代表色）。原本散在 camp-mission-home.tsx 的
// ZONE_META 裡，現在討論區的名字徽章也要用同一組 icon（見
// components/discussion/zone-badge.tsx），所以抽出來當單一來源——兩邊各存
// 一份的話，之後換 icon 一定會有一邊忘記改。
//
// 這個檔案跟 lib/exp-regions.ts 一樣不 import 任何伺服器端的東西，
// client component 可以直接用。
export const CAMP_ZONE_META: Record<ExpRegion, { title: string; icon: string; color: string }> = {
  groundhog: { title: "土撥鼠區", icon: "/images/zone-icon-1.webp", color: "#008300" },
  clownfish: { title: "尼莫魚區", icon: "/images/zone-icon-2.webp", color: "#9333ea" },
  bee: { title: "熊蜂區", icon: "/images/zone-icon-3.webp", color: "#3987e5" },
}
