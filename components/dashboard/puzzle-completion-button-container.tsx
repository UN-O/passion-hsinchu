/**
 * 拼圖完成按鈕容器組件
 * 負責獲取拼圖數據並傳遞給按鈕組件
 */

"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { PuzzleCompletionButton } from "./puzzle-completion-button"

interface RegionPuzzle {
  piece_number: 1 | 2 | 3
  is_unlocked: boolean
}

export function PuzzleCompletionButtonContainer() {
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

  return <PuzzleCompletionButton regionPuzzles={regionPuzzles} />
}
