/**
 * 認證狀態管理 Hook
 * 提供登入、登出、用戶狀態管理功能
 */

"use client"

import { create } from "zustand"
import { type User, type AuthState, saveAuthState, loadAuthState, clearAuthState } from "@/lib/auth"

interface AuthStore extends AuthState {
  login: (user: User) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
  initialize: () => void
}

export const useAuth = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: (user: User) => {
    saveAuthState(user)
    set({ user, isAuthenticated: true, isLoading: false })
  },

  logout: () => {
    clearAuthState()
    set({ user: null, isAuthenticated: false, isLoading: false })
  },

  updateUser: (updates: Partial<User>) => {
    const { user } = get()
    if (user) {
      const updatedUser = { ...user, ...updates }
      saveAuthState(updatedUser)
      set({ user: updatedUser })
    }
  },

  initialize: () => {
    const user = loadAuthState()
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    })
  },
}))
