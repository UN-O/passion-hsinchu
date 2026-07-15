/**
 * 用戶報表頁面
 * 顯示用戶數量統計和期待訊息採樣
 */

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserCheck, Users, MessageSquare, Shuffle } from "lucide-react"

interface TeamStats {
  team_name: string
  region: string
  user_count: number
}

interface UserExpectation {
  nickname: string
  team: string
  expectations: string
}

interface UserReportData {
  teamStats: TeamStats[]
  expectations: UserExpectation[]
}

export default function UserReportPage() {
  const [userStats, setUserStats] = useState<TeamStats[]>([])
  const [allExpectations, setAllExpectations] = useState<UserExpectation[]>([])
  const [sampledExpectations, setSampledExpectations] = useState<UserExpectation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserStats()
  }, [])

  const fetchUserStats = async () => {
    try {
      const response = await fetch("/api/admin/users")
      if (response.ok) {
        const data: UserReportData = await response.json()
        setUserStats(data.teamStats)
        setAllExpectations(data.expectations)
      }
    } catch (error) {
      console.error("Failed to fetch user stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const totalUsers = userStats.reduce((sum, stat) => sum + Number(stat.user_count), 0)

  const getRegionStats = () => {
    const regionStats = { R: 0, G: 0, O: 0 }
    userStats.forEach((stat) => {
      if (stat.region in regionStats) {
        regionStats[stat.region as keyof typeof regionStats] += Number(stat.user_count)
      }
    })
    return regionStats
  }

  const regionStats = getRegionStats()

  const getRegionName = (region: string) => {
    switch (region) {
      case "R":
        return "信心區"
      case "G":
        return "盼望區"
      case "O":
        return "愛心區"
      default:
        return region
    }
  }

  const getRegionColor = (region: string) => {
    switch (region) {
      case "R":
        return "#FF0080"
      case "G":
        return "#00FF80"
      case "O":
        return "#FF8000"
      default:
        return "#666666"
    }
  }

  const handleSampleExpectations = () => {
    if (allExpectations.length === 0) return

    const shuffled = [...allExpectations].sort(() => 0.5 - Math.random())
    setSampledExpectations(shuffled.slice(0, Math.min(10, allExpectations.length)))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center space-x-2">
            <UserCheck className="w-6 h-6" />
            <span>用戶報表</span>
          </h1>
          <p className="text-muted-foreground mt-1">載入中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center space-x-2">
          <UserCheck className="w-6 h-6" />
          <span>用戶報表</span>
        </h1>
        <p className="text-muted-foreground mt-1">查看用戶數量統計和期待訊息</p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">總用戶數</p>
                <p className="text-2xl font-bold">{totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-full" style={{ backgroundColor: "#FF0080" }} />
              <div>
                <p className="text-sm text-muted-foreground">愛心區</p>
                <p className="text-2xl font-bold">{regionStats.R}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-full" style={{ backgroundColor: "#00FF80" }} />
              <div>
                <p className="text-sm text-muted-foreground">盼望區</p>
                <p className="text-2xl font-bold">{regionStats.G}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-full" style={{ backgroundColor: "#FF8000" }} />
              <div>
                <p className="text-sm text-muted-foreground">信心區</p>
                <p className="text-2xl font-bold">{regionStats.O}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Group User Count */}
        <Card>
          <CardHeader>
            <CardTitle>各組別用戶數量</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {userStats
              .sort((a, b) => b.user_count - a.user_count)
              .map((stat) => {
                const percentage = totalUsers > 0 ? (stat.user_count / totalUsers) * 100 : 0

                return (
                  <div key={stat.team_name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getRegionColor(stat.region) }} />
                      <div>
                        <p className="font-medium">{stat.team_name}</p>
                        <p className="text-sm text-muted-foreground">{getRegionName(stat.region)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{stat.user_count} 人</p>
                      <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                )
              })}
          </CardContent>
        </Card>

        {/* Expectations Sampling */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>期待訊息採樣</span>
              </div>
              <Button
                onClick={handleSampleExpectations}
                size="sm"
                variant="outline"
                disabled={allExpectations.length === 0}
              >
                <Shuffle className="w-4 h-4 mr-2" />
                隨機採樣
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sampledExpectations.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {allExpectations.length === 0 ? "暫無用戶期待訊息" : "點擊「隨機採樣」查看用戶期待"}
                </p>
                {allExpectations.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">共有 {allExpectations.length} 條期待訊息</p>
                )}
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {sampledExpectations.map((expectation, index) => (
                  <div key={index} className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Badge variant="outline" className="text-xs mt-0.5">
                        #{index + 1}
                      </Badge>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs font-medium">{expectation.nickname}</span>
                          <Badge variant="secondary" className="text-xs">
                            {expectation.team}
                          </Badge>
                        </div>
                        <p className="text-sm leading-relaxed">{expectation.expectations}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
