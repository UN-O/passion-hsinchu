import { REGIONS, ADMIN_CREDENTIALS } from "./constants"

export interface User {
  id: string
  realName: string
  nickname: string
  region: "R" | "G" | "O"
  groupId: string
  role: "student" | "admin"
  exp: number
  achievements: string[]
  expectation: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

/**
 * 驗證密碼是否正確
 */
export function validatePassword(inputPassword: string, region?: "R" | "G" | "O"): boolean {
  // 管理者登入
  if (inputPassword === ADMIN_CREDENTIALS.password) {
    return true
  }

  // 學生登入 - 檢查是否為有效的聖經章節密碼
  if (region) {
    const regionInfo = REGIONS.find((r) => r.id === region)
    return regionInfo?.password === inputPassword
  }

  // 檢查是否為任何區域的密碼
  return REGIONS.some((r) => r.password === inputPassword)
}

/**
 * 根據密碼獲取對應的區域
 */
export function getRegionByPassword(password: string): "R" | "G" | "O" | null {
  const region = REGIONS.find((r) => r.password === password)
  return region?.id || null
}

/**
 * 檢查是否為管理者
 */
export function isAdmin(password: string): boolean {
  return password === ADMIN_CREDENTIALS.password
}

/**
 * 生成用戶 ID
 */
export function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 本地存儲鍵名
 */
export const AUTH_STORAGE_KEY = "passion_camp_auth"

/**
 * 保存認證狀態到本地存儲
 */
export function saveAuthState(user: User): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
  }
}

/**
 * 從本地存儲讀取認證狀態
 */
export function loadAuthState(): User | null {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return null
      }
    }
  }
  return null
}

/**
 * 清除認證狀態
 */
export function clearAuthState(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }
}
