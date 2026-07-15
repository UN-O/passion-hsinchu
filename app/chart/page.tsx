"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from "recharts"
import { Button } from "@/components/ui/button"
import { RefreshCw, Play, ArrowLeft, Crown } from "lucide-react"
import Link from "next/link"
import Plasma from "@/components/Plasma"

interface TeamStats {
  team_name: string
  region: string
  color: string
  total_exp: number
  level: number
  record_count: number
  member_count: number
  achievements_count: number
  total_achievements: string
}

interface ChartData extends TeamStats {
  displayExp: number
  rank: number
  isTopThree: boolean
  regionGroup: string
  isRegionSpacer?: boolean
}

const createCustomLabel = (chartData: ChartData[]) => {
  return (props: any) => {
    const { x, y, width, height, value, payload, index } = props

    let teamData = null

    if (payload && payload.payload) {
      teamData = payload.payload
    } else if (typeof index !== "undefined" && chartData && chartData[index]) {
      teamData = chartData[index]
    }

    if (!teamData || teamData.isRegionSpacer) {
      return null
    }

    const isTopThree = teamData.rank <= 3
    const getIcon = (rank: number) => {
      switch (rank) {
        case 1:
          return <Crown className="w-6 h-6" fill="gold" stroke="gold" />
        default:
          return null
      }
    }

    const icon = isTopThree ? getIcon(teamData.rank) : null
    const actualValue = teamData.total_exp

    return (
      <g>
        {icon && (
          <foreignObject x={x + width / 2 - 12} y={y - 50} width="24" height="24">
            <div className="flex items-center justify-center">{icon}</div>
          </foreignObject>
        )}
        <text x={x + width / 2} y={y - 5} textAnchor="middle" fontSize="14" fontWeight="bold" fill="white">
          {actualValue}
        </text>
      </g>
    )
  }
}

export default function ChartPage() {
  const [teamStats, setTeamStats] = useState<TeamStats[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [showRealData, setShowRealData] = useState(true)
  const [refreshState, setRefreshState] = useState<"refresh" | "play">("refresh")
  const [firstPlaceColor, setFirstPlaceColor] = useState<string>("#ffffff")
  const [showFadeEffect, setShowFadeEffect] = useState(false)
  const [overlayOpacity, setOverlayOpacity] = useState(1)

  const fetchTeamStats = async () => {
    try {
      const response = await fetch("/api/admin/teams/stats")
      if (!response.ok) throw new Error("Failed to fetch team stats")
      const data = await response.json()
      setTeamStats(data)
    } catch (error) {
      console.error("Error fetching team stats:", error)
    }
  }

  const handleRefresh = () => {
    if (isAnimating) return

    setIsAnimating(true)
    setShowRealData(false)
    setShowFadeEffect(false)
    setOverlayOpacity(1)
    setRefreshState("play")

    // Reset to zero values
    setTimeout(() => {
      setShowRealData(true)

      // Start overlay fade after animation begins
      setTimeout(() => {
        setOverlayOpacity(0)
      }, 500)

      // Show fade effect and reset states after animation completes
      setTimeout(() => {
        setShowFadeEffect(true)
        setIsAnimating(false)
        setRefreshState("refresh")
      }, 2500)
    }, 100)
  }

  useEffect(() => {
    fetchTeamStats()
  }, [])

  useEffect(() => {
    if (teamStats.length > 0) {
      const teamsByRegion = teamStats.reduce(
        (acc, team) => {
          if (!acc[team.region]) acc[team.region] = []
          acc[team.region].push(team)
          return acc
        },
        {} as Record<string, TeamStats[]>,
      )

      const regionOrder = ["R", "G", "O"]
      const sortedTeams: TeamStats[] = []

      regionOrder.forEach((region) => {
        if (teamsByRegion[region]) {
          const regionTeams = teamsByRegion[region].sort((a, b) => a.team_name.localeCompare(b.team_name))
          sortedTeams.push(...regionTeams)
        }
      })

      const rankedTeams = [...teamStats].sort((a, b) => b.total_exp - a.total_exp)
      const rankMap = new Map(rankedTeams.map((team, index) => [team.team_name, index + 1]))

      const processedData: ChartData[] = []
      let currentRegion = ""

      sortedTeams.forEach((team, index) => {
        if (team.region !== currentRegion && currentRegion !== "") {
          processedData.push({
            ...team,
            team_name: `spacer-${team.region}`,
            displayExp: 0,
            total_exp: 0,
            rank: 999,
            isTopThree: false,
            regionGroup: team.region,
            isRegionSpacer: true,
          })
        }

        currentRegion = team.region
        processedData.push({
          ...team,
          displayExp: showRealData ? team.total_exp : 0,
          rank: rankMap.get(team.team_name) || 1,
          isTopThree: (rankMap.get(team.team_name) || 1) <= 3,
          regionGroup: team.region,
        })
      })

      setChartData(processedData)

      const firstPlaceTeam = rankedTeams[0]
      if (firstPlaceTeam) {
        const regionColors = {
          R: "#ff0080", // Pink for R region
          G: "#9aff02", // Pink-green for G region
          O: "#ff8040", // Pink-orange for O region
        }
        const regionColor = regionColors[firstPlaceTeam.region as keyof typeof regionColors] || firstPlaceTeam.color
        setFirstPlaceColor(regionColor)
      }
    }
  }, [teamStats, showRealData])

  const maxExp = Math.max(...teamStats.map((team) => team.total_exp))
  const yAxisMax = maxExp > 0 ? Math.ceil(maxExp * 1.2) : 100

  return (
    <div className="min-h-screen bg-black p-6 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Plasma
          color={firstPlaceColor}
          speed={0.6}
          direction="forward"
          scale={1.1}
          opacity={0.3}
          mouseInteractive={true}
        />
      </div>

      <div
        className="absolute inset-0 bg-black transition-opacity duration-1000 ease-out z-50"
        style={{ opacity: overlayOpacity }}
      />

      <div className="max-w-7xl mx-auto relative z-60">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/admin/group">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-white">PASSION | REBIRTH 經驗值排行榜</h1>
          </div>

          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isAnimating}
            className="flex items-center space-x-2 bg-transparent"
          >
            {refreshState === "refresh" ? (
              <RefreshCw className={`w-4 h-4 ${isAnimating ? "animate-spin" : ""}`} />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span>{refreshState === "refresh" ? "重置" : "播放"}</span>
          </Button>
        </div>

        <motion.div
          className="rounded-lg p-6 h-[80vh] relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={showFadeEffect ? { backdropFilter: "blur(2px)" } : {}}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 60, right: 30, left: 20, bottom: 80 }}>
              <XAxis
                dataKey="team_name"
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 16,
                  fill: "white",
                  angle: -90,
                  textAnchor: "end",
                }}
                height={80}
                tickFormatter={(value) => (value.startsWith("spacer-") ? "" : value)}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 14, fill: "white" }} domain={[0, yAxisMax]} />
              <Bar dataKey="displayExp" radius={[8, 8, 0, 0]} animationDuration={2000} animationEasing="ease-out">
                {chartData.map((entry, index) => {
                  if (entry.isRegionSpacer) {
                    return <Cell key={`cell-${index}`} fill="transparent" />
                  }

                  const regionColors = {
                    R: "#ff0080", // Pink for R region
                    G: "#9aff02", // Pink-green for G region
                    O: "#ff8040", // Pink-orange for O region
                  }

                  const regionColor = regionColors[entry.region as keyof typeof regionColors] || firstPlaceColor

                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.rank === 1 ? regionColor : regionColor}
                      style={
                        entry.rank === 1
                          ? {
                              filter: `drop-shadow(0 0 20px ${regionColor}) drop-shadow(0 0 40px ${regionColor})`,
                            }
                          : showFadeEffect && entry.rank !== 1
                            ? {
                                opacity: 0.3,
                                filter: "brightness(1.5)",
                              }
                            : {}
                      }
                    />
                  )
                })}
                <LabelList content={createCustomLabel(chartData)} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  )
}
