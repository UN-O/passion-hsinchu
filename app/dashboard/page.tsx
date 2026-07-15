/**
 * 學生儀表板頁面
 * 包含經驗值系統、成就列表、本日經文和拼圖收等功能
 */

"use client"
import { AuthGuard } from "@/components/auth-guard"
import { UserGreeting } from "@/components/dashboard/user-greeting"
import { PuzzleCompletionButtonContainer } from "@/components/dashboard/puzzle-completion-button-container"
import { ActionButtons } from "@/components/dashboard/action-buttons"
import { DailyVerse } from "@/components/dashboard/daily-verse"
import { AchievementList } from "@/components/dashboard/achievement-list"
import { PuzzleBar } from "@/components/dashboard/puzzle-bar"
import { Header } from "@/components/ui/header"

export default function DashboardPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen pb-40 text-white">
        <Header />

        {/* Main Content */}
        <div className="max-w-md mx-auto p-4 space-y-6 pt-4">
          {/* Row 1: User Greeting & Experience */}
          <UserGreeting />

          {/* Row 2: Puzzle Completion Button */}
          <PuzzleCompletionButtonContainer />

          {/* Row 3: Action Buttons */}
          <ActionButtons />

          {/* Row 4: Daily Verse */}
          <DailyVerse />

          {/* Row 5: Achievement List */}
          <AchievementList />
        </div>

        {/* Fixed Bottom: Puzzle Bar */}
        <PuzzleBar />
      </div>
    </AuthGuard>
  )
}
