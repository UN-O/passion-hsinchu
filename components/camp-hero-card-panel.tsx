"use client"

import { useRef, useState } from "react"

import { CampProfileCard } from "@/components/opening/camp-profile-card"
import { CampHeroDetails } from "@/components/opening/camp-hero-details"
import type { CampProfileResult } from "@/lib/opening-camp-content"

const SWIPE_THRESHOLD_PX = 50
const SETTLE_TRANSITION = "transform 250ms ease-out"

// 兩頁的可滑動視窗：不分方向，卡片往左或往右滑都翻到勇者屬性介紹，
// 介紹往左或往右滑都翻回卡片。畫面要跟著手指走（往左滑內容跟著往左移、往右滑跟著往右移），
// 所以拖曳中用即時 pointermove 追蹤位移；放開後再決定要滑過門檻（換頁，往拖曳方向滑出去，
// 另一頁跟著從同一側滑入）還是彈回原位。換頁完成的瞬間要關掉 transition 直接重置位移，
// 否則新內容會從剛剛滑出去的位置「彈回」中間，看起來像抖一下。
// width 存成 state 而不是 ref：incomingOffset 會在 render 裡用到它，讀 ref.current
// 算 render 期間讀 ref，React 會警告（refs 只該在 event handler／effect 裡讀）。
export function CampHeroCardPanel({ heroName, result }: { heroName: string; result: CampProfileResult }) {
  const [current, setCurrent] = useState<0 | 1>(1)
  const [dragX, setDragX] = useState(0)
  const [instant, setInstant] = useState(true)
  const [width, setWidth] = useState(320)
  const containerRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef<number | null>(null)

  const renderPage = (page: 0 | 1) =>
    page === 0 ? (
      <div className="flex w-full flex-col items-center justify-center overflow-y-auto px-1">
        <CampHeroDetails result={result} />
      </div>
    ) : (
      <div className="w-full px-1">
        <CampProfileCard heroName={heroName} result={result} showUserInfo={false} />
      </div>
    )

  const handlePointerDown = (event: React.PointerEvent) => {
    startXRef.current = event.clientX
    if (containerRef.current) setWidth(containerRef.current.clientWidth)
    setInstant(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: React.PointerEvent) => {
    if (startXRef.current === null) return
    setDragX(event.clientX - startXRef.current)
  }

  const endDrag = () => {
    if (startXRef.current === null) return
    startXRef.current = null
    setInstant(false)
    setDragX((value) => (Math.abs(value) > SWIPE_THRESHOLD_PX ? (value < 0 ? -width : width) : 0))
  }

  const handleTransitionEnd = () => {
    if (Math.abs(dragX) < width) return
    setInstant(true)
    setCurrent((prev) => (prev === 0 ? 1 : 0))
    setDragX(0)
  }

  const incomingOffset = dragX === 0 ? null : dragX < 0 ? width : -width

  return (
    <div ref={containerRef} className="relative w-full max-w-[320px] touch-pan-y overflow-hidden">
      <div
        style={{ transform: `translateX(${dragX}px)`, transition: instant ? "none" : SETTLE_TRANSITION }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onTransitionEnd={handleTransitionEnd}
      >
        {renderPage(current)}
      </div>

      {incomingOffset !== null && (
        <div
          className="absolute inset-0"
          style={{
            transform: `translateX(${dragX + incomingOffset}px)`,
            transition: instant ? "none" : SETTLE_TRANSITION,
          }}
        >
          {renderPage(current === 0 ? 1 : 0)}
        </div>
      )}
    </div>
  )
}
