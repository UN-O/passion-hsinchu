/**
 * 用戶問候組件
 * 顯示用戶稱呼、組別資訊和經驗值進度條
 * 使用小隊特殊色背景和 motion 動畫效果
 */

"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent } from "@/components/ui/card"
import { Zap } from "lucide-react"
import { TEAM_COLORS } from "@/lib/constants"

export function UserGreeting() {
  const { user } = useAuth()
  const [animatedExp, setAnimatedExp] = useState(0)
  const [teamStats, setTeamStats] = useState<any>(null)
  const [showProgressAnimation, setShowProgressAnimation] = useState(true)

  useEffect(() => {
    if (user?.id) {
      console.log("[v0] Fetching user data for ID:", user.id)
      fetch(`/api/user/${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          console.log("[v0] User API response:", data)
          if (data.teamStats) {
            console.log("[v0] Team stats received:", data.teamStats)
            setTeamStats(data.teamStats)
          } else {
            console.log("[v0] No teamStats in response")
          }
        })
        .catch((error) => {
          console.error("[v0] Error fetching user data:", error)
        })
    }
  }, [user?.id])

  const calculateLevel = (exp: number) => {
    const level = Math.floor(exp / 500) + 1
    const currentExp = exp % 500
    const nextLevelExp = 500
    return { level, currentExp, nextLevelExp }
  }

  const getTeamColor = (teamName: string) => {
    const team = TEAM_COLORS.find((t) => t.name === teamName)
    return team?.color || "#eed688"
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
        return ""
    }
  }

  const teamTotalExp = teamStats?.total_exp || 0
  console.log("[v0] Team total exp:", teamTotalExp, "Type:", typeof teamTotalExp)
  const teamTotalExpNumber = Number(teamTotalExp)
  const levelInfo = calculateLevel(teamTotalExpNumber)
  const teamColor = user ? getTeamColor(user.team) : "#eed688"

  useEffect(() => {
    console.log("[v0] Animation effect triggered. teamTotalExp:", teamTotalExpNumber)
    if (teamTotalExpNumber && typeof teamTotalExpNumber === "number" && teamTotalExpNumber > 0) {
      console.log("[v0] Starting animation for exp:", teamTotalExpNumber)
      const timer = setTimeout(() => {
        let current = 0
        const increment = teamTotalExpNumber / 60
        console.log("[v0] Animation increment:", increment)
        const animate = () => {
          current += increment
          if (current < teamTotalExpNumber) {
            setAnimatedExp(Math.floor(current))
            requestAnimationFrame(animate)
          } else {
            setAnimatedExp(teamTotalExpNumber)
            console.log("[v0] Animation completed at:", teamTotalExpNumber)
          }
        }
        animate()
      }, 500)

      return () => clearTimeout(timer)
    } else {
      console.log("[v0] Animation conditions not met, setting animatedExp to 0")
      setAnimatedExp(0)
    }
  }, [teamTotalExpNumber])

  if (!user) return null

  const progressPercentage = (levelInfo.currentExp / levelInfo.nextLevelExp) * 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <Card className="border-0 overflow-hidden relative backdrop-blur-xl">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${teamColor}15 0%, ${teamColor}25 50%, ${teamColor}15 100%)`,
          }}
        />
        <div
          className="absolute inset-0 border border-white/10 rounded-lg"
          style={{
            boxShadow: `
              0 8px 32px ${teamColor}20,
              inset 0 1px 0 rgba(255,255,255,0.1),
              0 0 0 1px ${teamColor}30
            `,
          }}
        />

        <CardContent className="px-6 relative z-10">
          <div className="flex items-center justify-between mb-8">
            <motion.div
              className="flex items-center space-x-6"
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <div className="space-y-2">
                <motion.h1
                  className="text-2xl font-black text-white tracking-tight"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  你好，{user.nickname}
                </motion.h1>
                <motion.div
                  className="flex items-center space-x-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <span
                    className="px-3 py-1 rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: `${teamColor}80` }}
                  >
                    {user.team}
                  </span>
                  <span className="text-white/60 text-sm font-medium">{getRegionName(user.region)}</span>
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 150 }}
            >
              <div className="relative">
                <motion.div
                  className="w-24 h-24 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${teamColor} 0%, ${teamColor}70 100%)`,
                    boxShadow: `0 12px 32px ${teamColor}50`,
                  }}
                  whileHover={{ scale: 1.1, rotate: 10 }}
                >
                  <div className="text-xs text-white/80 font-semibold">LEVEL</div>
                  <div className="text-2xl font-black text-white">{levelInfo.level}</div>

                  <motion.div
                    className="absolute inset-0 opacity-10"
                    style={{
                      background: `radial-gradient(circle at var(--x, 70%) var(--y, 30%), white 0%, transparent 50%)`,
                    }}
                    animate={{
                      "--x": ["70%", "30%", "70%", "100%", "70%"],
                      "--y": ["30%", "70%", "100%", "30%", "30%"],
                    }}
                    transition={{
                      duration: 10,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                  />
                </motion.div>
              </div>
            </motion.div>
          </div>

          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${teamColor}40` }}
                >
                  <Zap className="w-5 h-5" style={{ color: teamColor }} />
                </div>
                <span className="text-lg font-bold text-white">經驗值</span>
              </div>
              <motion.span
                className="text-2xl font-black text-white font-mono"
                key={animatedExp}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {(() => {
                  const displayValue = (animatedExp || 0).toLocaleString()
                  console.log("[v0] Displaying animated exp:", animatedExp, "Formatted:", displayValue)
                  return displayValue
                })()}
              </motion.span>
            </div>

            <div className="relative">
              <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: `${teamColor}20` }}>
                <motion.div
                  className="h-full rounded-full relative"
                  style={{
                    background: `linear-gradient(90deg, ${teamColor} 0%, ${teamColor}90 100%)`,
                    boxShadow: `0 0 20px ${teamColor}60`,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(levelInfo.currentExp / levelInfo.nextLevelExp) * 100}%` }}
                  transition={{ delay: 0.8, duration: 2, ease: "easeOut" }}
                >
                  {showProgressAnimation && (
                    <motion.div
                      className="absolute inset-0 rounded-full opacity-10 backdrop-brightness-150"
                      style={{
                        background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)`,
                      }}
                      animate={{ x: ["-100%", "0%"] }}
                      transition={{ duration: 3, repeat: 5, ease: "easeInOut" }}
                      onAnimationComplete={() => setShowProgressAnimation(false)}
                    />
                  )}
                </motion.div>
              </div>
            </div>

            <div className="flex justify-between items-center text-white/70">
              <span className="text-sm font-medium">
                {levelInfo.currentExp} / {levelInfo.nextLevelExp}
              </span>
              <motion.span
                className="text-sm font-medium cursor-help hover:text-white transition-colors"
                title={`升級還需 ${levelInfo.nextLevelExp - levelInfo.currentExp} 經驗值升級`}
                whileHover={{ scale: 1.05 }}
              >
                升級還需 {Math.max(0, levelInfo.nextLevelExp - levelInfo.currentExp)} EXP
              </motion.span>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
