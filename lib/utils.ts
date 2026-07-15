import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { GROUPS, REGIONS } from "./constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 根據組別 ID 獲取組別資訊
 */
export function getGroupById(groupId: string) {
  return GROUPS.find((group) => group.id === groupId)
}

/**
 * 根據區域 ID 獲取區域資訊
 */
export function getRegionById(regionId: "R" | "G" | "O") {
  return REGIONS.find((region) => region.id === regionId)
}

/**
 * 根據組別獲取對應的主題樣式類名
 */
export function getThemeClass(groupId: string) {
  const group = getGroupById(groupId)
  if (!group) return ""

  switch (group.region) {
    case "R":
      return "text-region-r border-region-r glow-r"
    case "G":
      return "text-region-g border-region-g glow-g"
    case "O":
      return "text-region-o border-region-o glow-o"
    default:
      return ""
  }
}

/**
 * 計算經驗值對應的等級
 */
export function calculateLevel(exp: number): { level: number; currentExp: number; nextLevelExp: number } {
  const level = Math.floor(exp / 500) + 1
  const currentExp = exp % 500
  const nextLevelExp = 500

  return { level, currentExp, nextLevelExp }
}

/**
 * 格式化日期為營會日期格式
 */
export function formatCampDate(date: string): string {
  const campDate = new Date(date)
  return campDate.toLocaleDateString("zh-TW", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  })
}
