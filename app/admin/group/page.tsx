/**
 * 組別報表頁面
 * 顯示9個組別的經驗值和排名
 */

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { calculateLevel } from "@/lib/utils"
import { Users, Trophy, Crown, Maximize2, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { useRouter } from "next/navigation"

interface TeamStats {
  team_name: string
  region: string
  color: string
  total_exp: number
  level: number
  record_count: number
  member_count: number
  achievements_count: number
  total_achievements: number // Changed from total_region_achievements to total_achievements
}

export default function GroupReportPage() {
  const [teamStats, setTeamStats] = useState<TeamStats[]>([])
  const [loading, setLoading] = useState(true)
  const [showChart, setShowChart] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchTeamStats()
  }, [])

  useEffect(() => {
    if (!loading && teamStats.length > 0) {
      const timer = setTimeout(() => setShowChart(true), 300)
      return () => clearTimeout(timer)
    }
  }, [loading, teamStats])

  const fetchTeamStats = async () => {
    try {
      console.log("[v0] Fetching team stats...")
      const response = await fetch("/api/admin/teams/stats")
      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Team stats received:", data)
        data.forEach((team: TeamStats) => {
          console.log(`[v0] Team ${team.team_name}: ${team.achievements_count}/${team.total_achievements} achievements`)
        })
        setTeamStats(data)
      } else {
        console.error("[v0] Failed to fetch team stats:", response.status, response.statusText)
      }
    } catch (error) {
      console.error("獲取組別統計失敗:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setShowChart(false)
    setLoading(true)
    await fetchTeamStats()
  }

  const sortedTeams = teamStats
    .map((team) => {
      const levelInfo = calculateLevel(team.total_exp)
      return { ...team, levelInfo }
    })
    .sort((a, b) => b.total_exp - a.total_exp)

  const maxExp = Math.max(...sortedTeams.map((team) => team.total_exp), 0)
  const yAxisMax = maxExp > 0 ? maxExp * 1.2 : 100 // Default to 100 if all teams have 0 exp

  const ExperienceBarChart = ({ isFullscreen = false }) => {
    const chartData = sortedTeams.map((team, index) => ({
      name: team.team_name,
      exp: showChart ? team.total_exp : 0,
      color: team.color,
      rank: index + 1,
      // Special colors for podium positions
      barColor: index === 0 ? "#FFD700" : index === 1 ? "#C0C0C0" : index === 2 ? "#CD7F32" : team.color,
      isTopThree: index < 3,
    }))

    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload
        return (
          <div className="bg-background border rounded-lg p-3 shadow-lg">
            <p className="font-semibold">{label}</p>
            <p className="text-sm">
              <span className="text-muted-foreground">經驗值: </span>
              <span className="font-mono">{payload[0].value.toLocaleString()} EXP</span>
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">排名: </span>
              <span>第 {data.rank} 名</span>
            </p>
          </div>
        )
      }
      return null
    }

    const CustomLabel = (props: any) => {
      const { x, y, width, value, payload } = props
      if (value === 0) return null

      const isTopThree = payload?.isTopThree || false

      return (
        <text
          x={x + width / 2}
          y={y - 10}
          fill="#666"
          textAnchor="middle"
          fontSize="12"
          fontWeight={isTopThree ? "bold" : "normal"}
        >
          {value.toLocaleString()}
        </text>
      )
    }

    return (
      <Card className={isFullscreen ? "h-full" : ""}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="w-5 h-5" />
              <span>經驗值排行榜</span>
            </CardTitle>
            <div className="flex space-x-2">
              {!isFullscreen && (
                <Button variant="outline" size="sm" onClick={() => router.push("/chart")}>
                  <Maximize2 className="w-4 h-4" />
                </Button>
              )}
              {!isFullscreen && (
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className={`${isFullscreen ? "h-full overflow-auto" : ""}`}>
          <div className={`w-full ${isFullscreen ? "h-[500px]" : "h-[350px]"}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 40,
                  right: 30,
                  left: 20,
                  bottom: 80,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis
                  dataKey="name"
                  angle={-90}
                  textAnchor="end"
                  height={80}
                  interval={0}
                  tick={{ fontSize: 14, fill: "white", fontWeight: "bold" }}
                />
                <YAxis
                  domain={[0, yAxisMax]}
                  tick={{ fontSize: 11 }}
                  label={{ value: "經驗值 (EXP)", angle: -90, position: "insideLeft" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="exp" label={<CustomLabel />} animationDuration={1500} animationEasing="ease-out">
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.barColor}
                      stroke={entry.isTopThree ? "#FFD700" : "rgba(255,255,255,0.3)"}
                      strokeWidth={entry.isTopThree ? 2 : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {sortedTeams.length > 0 && (
            <div className="mt-4 space-y-2">
              <motion.div
                className="flex justify-center"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
              >
                <div className="flex items-center space-x-2 text-sm">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  <span className="font-semibold text-yellow-600">冠軍: {sortedTeams[0].team_name}</span>
                </div>
              </motion.div>

              {sortedTeams.length > 1 && (
                <div className="flex justify-center space-x-6 text-xs text-muted-foreground">
                  {sortedTeams.slice(1, 3).map((team, index) => (
                    <div key={team.team_name} className="flex items-center space-x-1">
                      <Trophy className={`w-4 h-4 ${index === 0 ? "text-gray-400" : "text-amber-600"}`} />
                      <span>
                        {index === 0 ? "亞軍" : "季軍"}: {team.team_name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Trophy className="w-5 h-5 text-gray-400" />
      case 3:
        return <Trophy className="w-5 h-5 text-amber-600" />
      default:
        return (
          <div className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">
            #{rank}
          </div>
        )
    }
  }

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center space-x-2">
            <Users className="w-6 h-6" />
            <span>組別報表</span>
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
          <Users className="w-6 h-6" />
          <span>組別報表</span>
        </h1>
        <p className="text-muted-foreground mt-1">查看所有組別的經驗值和排名狀況</p>
      </div>

      <ExperienceBarChart />

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">第一名</p>
                <p className="font-semibold">{sortedTeams[0]?.team_name || "無資料"}</p>
                <p className="text-xs text-muted-foreground">{sortedTeams[0]?.total_exp.toLocaleString() || "0"} EXP</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">參與組別</p>
                <p className="font-semibold">{sortedTeams.length}</p>
                <p className="text-xs text-muted-foreground">個組別</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>組別排名</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedTeams.map((team, index) => {
            const rank = index + 1
            const achievementProgress =
              team.total_achievements > 0 ? (team.achievements_count / team.total_achievements) * 100 : 0

            return (
              <div
                key={team.team_name}
                className={`p-4 border rounded-lg ${rank <= 3 ? "border-primary/30 bg-primary/5" : "border-border"}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8">{getRankIcon(rank)}</div>
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: team.color }} />
                      <div>
                        <h3 className="font-semibold">{team.team_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {getRegionName(team.region)} • {team.member_count} 人
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="mb-1">
                      LV {team.level}
                    </Badge>
                    <p className="text-sm font-mono">{team.total_exp.toLocaleString()} EXP</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>成就解鎖進度</span>
                    <span>
                      {team.achievements_count}/{team.total_achievements} ({Math.round(achievementProgress)}%)
                    </span>
                  </div>
                  <Progress value={achievementProgress} className="h-2" />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
