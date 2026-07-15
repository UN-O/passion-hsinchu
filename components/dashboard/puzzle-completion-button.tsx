/**
 * 拼圖完成按鈕組件
 * 當用戶收集完該區域的三個拼圖時顯示
 */

"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Download, Puzzle } from "lucide-react"
import confetti from "canvas-confetti"

interface PuzzleCompletionButtonProps {
  regionPuzzles: Array<{
    piece_number: 1 | 2 | 3
    is_unlocked: boolean
  }>
}

export function PuzzleCompletionButton({ regionPuzzles }: PuzzleCompletionButtonProps) {
  const { user } = useAuth()
  const [showDialog, setShowDialog] = useState(false)

  if (!user) return null

  // Check if all 3 puzzles are collected
  const allPuzzlesCollected = regionPuzzles.length === 3 && regionPuzzles.every((puzzle) => puzzle.is_unlocked)

  if (!allPuzzlesCollected) return null

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

  const getRegionPhoto = (region: string) => {
    // Placeholder images - replace with actual region group photos
    switch (region) {
      case "R":
        return "/images/R-small.png"
      case "G":
        return "/images/G-small.png"
      case "O":
        return "/images/O-small.jpg"
      default:
        return "/diverse-group-photo.png"
    }
  }

  const handleDownload = () => {
    window.open("https://drive.google.com/drive/folders/1aIjZLbR3dxde19IwUzFpBw-dm9RvizPU?usp=sharing", "_blank")
  }

  const handleButtonClick = () => {
    // Trigger confetti celebration
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    })

    // Additional confetti burst from both sides
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      })
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      })
    }, 200)

    // Open the dialog
    setShowDialog(true)
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <Button
          onClick={handleButtonClick}
          className="w-full h-16 text-lg font-bold bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          style={{
            boxShadow: "0 8px 32px rgba(251, 191, 36, 0.4), 0 0 0 1px rgba(251, 191, 36, 0.2)",
          }}
        >
          <motion.div className="flex items-center space-x-3" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Puzzle className="w-6 h-6" />
            <span>一起完成拼圖</span>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            ></motion.div>
          </motion.div>
        </Button>
      </motion.div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              {getRegionName(user.region)} 完成拼圖！
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden">
              <img
                src={getRegionPhoto(user.region) || "/placeholder.svg"}
                alt={`${getRegionName(user.region)}合照`}
                className="w-full h-auto max-h-96 object-cover"
              />
            </div>

            <div className="flex justify-center pt-4">
              <Button onClick={handleDownload} variant="outline" className="flex items-center space-x-2 bg-transparent">
                <Download className="w-4 h-4" />
                <span>下載營隊照片</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
