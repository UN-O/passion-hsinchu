/**
 * 拼圖收集條組件
 * 固定在底部顯示該區域的三個拼圖收集狀態
 */

"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { HelpCircle, PuzzleIcon } from "lucide-react"

interface UserPuzzle {
  id: number
  user_id: number
  puzzle_id: number
  collected_at: string
  region: "R" | "G" | "O"
  piece_number: 1 | 2 | 3
  name: string
}

interface RegionPuzzle {
  id: number
  region: "R" | "G" | "O"
  piece_number: 1 | 2 | 3
  name: string
  is_unlocked: boolean
  unlocked_at: string | null
  created_at: string
}

export function PuzzleBar() {
  const { user } = useAuth()
  const [regionPuzzles, setRegionPuzzles] = useState<RegionPuzzle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRegionPuzzles = async () => {
      if (!user) return

      try {
        const response = await fetch(`/api/user/${user.id}`)
        if (response.ok) {
          const data = await response.json()
          setRegionPuzzles(data.puzzles || [])
        }
      } catch (error) {
        console.error("Failed to fetch region puzzles:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRegionPuzzles()
  }, [user])

  if (!user || loading) return null

  const getRegionTheme = (region: string) => {
    switch (region) {
      case "R":
        return "text-region-r border-region-r bg-region-r"
      case "G":
        return "text-region-g border-region-g bg-region-g"
      case "O":
        return "text-region-o border-region-o bg-region-o"
      default:
        return ""
    }
  }

  const themeClass = getRegionTheme(user.region)

  // 創建三個拼圖片段的基礎資料
  const puzzlePieces = [
    {
      piece: 1,
      name: `${user.region === "R" ? "愛心" : user.region === "G" ? "盼望" : "信心"}拼圖 - 第一片`,
      icon: "puzzle",
    },
    {
      piece: 2,
      name: `${user.region === "R" ? "愛心" : user.region === "G" ? "盼望" : "信心"}拼圖 - 第二片`,
      icon: "puzzle",
    },
    {
      piece: 3,
      name: `${user.region === "R" ? "愛心" : user.region === "G" ? "盼望" : "信心"}拼圖 - 第三片`,
      icon: "puzzle",
    },
  ]

  const getIcon = (iconName: string, isUnlocked: boolean) => {
    if (!isUnlocked) {
      return <HelpCircle className="w-7 h-7 text-muted-foreground animate-pulse" />
    }

    return <PuzzleIcon className="w-7 h-7 text-white" />
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/50 backdrop-blur-sm border-t border-border z-50">
      <div className="max-w-md mx-auto p-4 pt-6 pb-12">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">拼圖收集</div>
          <div className="text-xs text-muted-foreground">
            {user.region === "R" ? "信心區" : user.region === "G" ? "盼望區" : "愛心區"}
          </div>
        </div>
        <div className="flex items-center justify-center space-x-6 mt-3">
          {puzzlePieces.map((piece) => {
            const puzzleData = regionPuzzles.find((p) => p.piece_number === piece.piece)
            const isUnlocked = puzzleData?.is_unlocked || false
            const puzzleName = puzzleData?.name || piece.name

            return (
              <div key={piece.piece} className="flex flex-col items-center space-y-2">
                <div className="w-fit h-fit rounded-lg flex items-center justify-center overflow-hidden relative">
                  <div
                    className={`w-12 h-12 rounded-md flex items-center justify-center transition-all duration-300 ${
                      isUnlocked
                        ? `${themeClass} bg-opacity-20 hover:scale-110`
                        : "border border-dashed border-muted-foreground/30 bg-muted/20 hover:border-muted-foreground/50"
                    }`}
                    style={
                      isUnlocked
                        ? {
                            boxShadow: `0 0 12px ${
                              user.region === "R" ? "#ef4444" : user.region === "G" ? "#22c55e" : "#f97316"
                            }60, inset 0 1px 0 rgba(255,255,255,0.2)`,
                          }
                        : {}
                    }
                  >
                    {getIcon(piece.icon, isUnlocked)}
                    {isUnlocked && (
                      <div
                        className="absolute inset-0 rounded-md opacity-30 pointer-events-none"
                        style={{
                          background: `linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 50%, rgba(255,255,255,0.3) 100%)`,
                        }}
                      />
                    )}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-xs font-medium text-foreground">{isUnlocked ? puzzleName : "未解鎖"}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
