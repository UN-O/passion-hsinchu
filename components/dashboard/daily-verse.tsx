/**
 * 本日經文組件
 * 根據當前日期顯示對應的聖經經文
 */

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen } from "lucide-react"
import { CAMP_DATES } from "@/lib/constants"

export function DailyVerse() {
  const today = new Date().toISOString().split("T")[0]
  const verse = CAMP_DATES.verses[today as keyof typeof CAMP_DATES.verses] || CAMP_DATES.default

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-lg">
          <BookOpen className="w-5 h-5" />
          <span>本日經文</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <blockquote className="text-sm leading-relaxed italic border-l-4 border-primary pl-4">{verse}</blockquote>
      </CardContent>
    </Card>
  )
}
