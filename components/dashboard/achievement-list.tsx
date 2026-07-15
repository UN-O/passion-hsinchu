/**
 * 成就列表組件
 * 仿照 Steam 遊戲成就列表的 UI 設計
 */

"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/hooks/use-auth"
import { Trophy, HelpCircle, Lock, Check } from "lucide-react"
import * as LucideIcons from "lucide-react"

interface Achievement {
  id: number
  name: string
  description: string
  icon: string
  category: string
  is_active: boolean
}

interface UserAchievement {
  id: number
  user_id: number
  achievement_id: number
  unlocked_at: string
  name: string
  description: string
  icon: string
  category: string
}

export function AchievementList() {
  const { user } = useAuth()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        const [achievementsRes, userDataRes] = await Promise.all([
          fetch("/api/achievements"),
          fetch(`/api/user/${user.id}`),
        ])

        if (achievementsRes.ok) {
          const achievementsData = await achievementsRes.json()
          setAchievements(achievementsData.achievements || [])
        }

        if (userDataRes.ok) {
          const userData = await userDataRes.json()
          setUserAchievements(userData.achievements || [])
        }
      } catch (error) {
        console.error("Failed to fetch achievements:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  if (!user || loading) return null

  const unlockedAchievementIds = new Set(userAchievements.map((ua) => ua.achievement_id))
  const unlockedCount = userAchievements.length
  const totalCount = achievements.length
  const completionPercentage = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0

  const sortedAchievements = [...achievements].sort((a, b) => {
    const aUnlocked = unlockedAchievementIds.has(a.id)
    const bUnlocked = unlockedAchievementIds.has(b.id)

    if (aUnlocked === bUnlocked) {
      // Both unlocked or both locked - sort by ID (ascending)
      return a.id - b.id
    }

    // Unlocked achievements come first
    return bUnlocked ? 1 : -1
  })

  const getIcon = (iconName: string, isUnlocked: boolean) => {
    if (!isUnlocked) {
      return <HelpCircle className="w-6 h-6 text-muted-foreground" />
    }

    const IconComponent = (LucideIcons as any)[iconName] || Trophy
    return <IconComponent className="w-6 h-6" />
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Trophy className="w-5 h-5" />
            <span>成就列表</span>
          </CardTitle>
          <Badge variant="secondary">
            {unlockedCount} / {totalCount}
          </Badge>
        </div>

        <div className="space-y-2">
          <Progress value={completionPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            {unlockedCount} / {totalCount} ACHIEVEMENT EARNED ({Math.round(completionPercentage)}%)
          </p>
        </div>
      </CardHeader>

      <CardContent className="pr-2">
        <ScrollArea className="h-80">
          <div className="space-y-3 pr-4">
            {sortedAchievements.map((achievement) => {
              const isUnlocked = unlockedAchievementIds.has(achievement.id)
              const userAchievement = userAchievements.find((ua) => ua.achievement_id === achievement.id)

              return (
                <div
                  key={achievement.id}
                  className={`flex items-center space-x-4 p-3 rounded-lg border transition-all ${
                    isUnlocked ? "bg-card border-primary/20 shadow-sm" : "bg-muted/30 border-muted"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      isUnlocked ? "bg-primary/10" : "bg-muted"
                    }`}
                  >
                    {getIcon(achievement.icon, isUnlocked)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className={`font-semibold text-sm ${isUnlocked ? "text-foreground" : "text-muted-foreground"}`}>
                      {achievement.name}
                    </h4>
                    <p className={`text-xs ${isUnlocked ? "text-muted-foreground" : "text-muted-foreground"}`}>
                      {isUnlocked ? achievement.description : "⧆⧆⧆⧆⧆⧆"}
                    </p>
                    {isUnlocked && userAchievement && (
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex items-center space-x-1">
                          <Check className="w-3 h-3 text-green-500" />
                          <span className="text-xs text-green-500">已解鎖</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(userAchievement.unlocked_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    {isUnlocked ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
