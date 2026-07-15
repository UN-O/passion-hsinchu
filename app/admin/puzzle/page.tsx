/**
 * 拼圖管理頁面
 * 管理三個區域的拼圖指派狀態
 */

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { GROUPS } from "@/lib/constants"
import { PuzzleIcon } from "lucide-react"

interface Puzzle {
  id: number
  region: string
  piece_number: number
  name: string
  is_unlocked: boolean
  unlocked_at: string | null
  created_at: string
  affected_teams: string[]
  affected_count: number
}

interface RegionPuzzle {
  region: string
  piece_1: boolean
  piece_2: boolean
  piece_3: boolean
}

export default function PuzzleManagementPage() {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchRegionPuzzles()
  }, [])

  const fetchRegionPuzzles = async () => {
    try {
      console.log("[v0] Fetching region puzzles...")
      const response = await fetch("/api/admin/puzzles")
      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Fetched region puzzles:", data)
        setPuzzles(data)
      } else {
        console.error("[v0] Failed to fetch region puzzles:", response.status, response.statusText)
      }
    } catch (error) {
      console.error("Failed to fetch region puzzles:", error)
    }
  }

  const handlePuzzleToggle = async (region: string, pieceNumber: number, isUnlocked: boolean) => {
    console.log("[v0] Toggling puzzle:", { region, pieceNumber, isUnlocked })
    setLoading(true)
    try {
      const response = await fetch("/api/admin/puzzles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region,
          piece_number: pieceNumber,
          is_unlocked: isUnlocked,
        }),
      })

      console.log("[v0] Update response status:", response.status)

      if (response.ok) {
        const result = await response.json()
        console.log("[v0] Update successful:", result)
        setPuzzles((prev) =>
          prev.map((puzzle) => {
            if (puzzle.region === region && puzzle.piece_number === pieceNumber) {
              return {
                ...puzzle,
                is_unlocked: isUnlocked,
                unlocked_at: isUnlocked ? new Date().toISOString() : null,
              }
            }
            return puzzle
          }),
        )
      } else {
        const errorText = await response.text()
        console.error("[v0] Update failed:", response.status, errorText)
        await fetchRegionPuzzles()
      }
    } catch (error) {
      console.error("Failed to update puzzle:", error)
      await fetchRegionPuzzles()
    } finally {
      setLoading(false)
    }
  }

  const getRegionData = (regionId: string): RegionPuzzle => {
    const regionPuzzles = puzzles.filter((p) => p.region === regionId)
    const piece1 = regionPuzzles.find((p) => p.piece_number === 1)?.is_unlocked || false
    const piece2 = regionPuzzles.find((p) => p.piece_number === 2)?.is_unlocked || false
    const piece3 = regionPuzzles.find((p) => p.piece_number === 3)?.is_unlocked || false

    return {
      region: regionId,
      piece_1: piece1,
      piece_2: piece2,
      piece_3: piece3,
    }
  }

  const getPuzzleName = (regionId: string, pieceNumber: number): string => {
    const puzzle = puzzles.find((p) => p.region === regionId && p.piece_number === pieceNumber)
    return puzzle?.name || `拼圖 ${pieceNumber}`
  }

  const getRegionProgress = (regionId: string) => {
    const data = getRegionData(regionId)
    const unlockedCount = [data.piece_1, data.piece_2, data.piece_3].filter(Boolean).length
    return { unlocked: unlockedCount, total: 3 }
  }

  const getRegionName = (regionId: string) => {
    switch (regionId) {
      case "R":
        return "信心區"
      case "G":
        return "盼望區"
      case "O":
        return "愛心區"
      default:
        return regionId
    }
  }

  const getRegionColor = (regionId: string) => {
    switch (regionId) {
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

  return (
    <div className="h-screen overflow-hidden">
      <div className="p-6 h-full flex flex-col">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center space-x-2">
            <PuzzleIcon className="w-6 h-6" />
            <span>拼圖管理</span>
          </h1>
          <p className="text-muted-foreground mt-1">管理三個區域的拼圖指派狀態（以區為單位）</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
          {["R", "G", "O"].map((regionId) => {
            const regionData = getRegionData(regionId)
            const progress = getRegionProgress(regionId)
            const completionRate = Math.round((progress.unlocked / progress.total) * 100)
            const regionColor = getRegionColor(regionId)

            return (
              <Card key={regionId} className="flex flex-col h-full">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: regionColor }} />
                      <span>{getRegionName(regionId)}</span>
                    </div>
                    <Badge variant={completionRate === 100 ? "default" : "secondary"}>
                      {progress.unlocked}/{progress.total}
                    </Badge>
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex-1 space-y-4 overflow-y-auto">
                  {[1, 2, 3].map((pieceNumber) => {
                    const isUnlocked = regionData[`piece_${pieceNumber}` as keyof RegionPuzzle] as boolean
                    const pieceName = getPuzzleName(regionId, pieceNumber)

                    return (
                      <div
                        key={pieceNumber}
                        className={`p-4 border rounded-lg transition-all ${
                          isUnlocked ? "border-primary bg-primary/5" : "border-border bg-muted/20"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div
                              className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                isUnlocked ? "text-white" : "bg-muted text-muted-foreground"
                              }`}
                              style={{
                                backgroundColor: isUnlocked ? regionColor : undefined,
                                opacity: isUnlocked ? 1 : 0.5,
                              }}
                            >
                              <PuzzleIcon className="w-6 h-6" />
                            </div>

                            <div className="flex-1">
                              <h4 className="font-medium">{pieceName}</h4>
                              <p className="text-sm text-muted-foreground">
                                第 {pieceNumber} 片 • {isUnlocked ? "已解鎖" : "未解鎖"}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">影響該區所有小隊</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={isUnlocked}
                              onCheckedChange={(checked) =>
                                handlePuzzleToggle(regionId, pieceNumber, checked as boolean)
                              }
                              disabled={loading}
                            />
                            <span className="text-sm text-muted-foreground">{isUnlocked ? "解鎖" : "鎖定"}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Region Summary */}
                  <div className="mt-6 p-3 bg-muted/30 rounded-lg">
                    <div className="text-center">
                      <p className="text-sm font-medium">{getRegionName(regionId)} 解鎖率</p>
                      <p className="text-2xl font-bold mt-1">{completionRate}%</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {progress.unlocked} / {progress.total} 片拼圖已解鎖
                      </p>
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground">
                          影響 {GROUPS.filter((g) => g.region === regionId).length} 個小隊
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
