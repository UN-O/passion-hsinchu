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
//
// 卡片跟介紹兩個區塊「一直都掛在 DOM 上」，只是用 transform 移進移出可視範圍——
// 不能依 current 條件式地決定要 render 哪一個再互相替換，那樣換頁時卡片會被整個
// 卸載又重新掛載，CampProfileCard 內建的抽卡入場動畫（camp-card-draw）就會重播。
export function CampHeroCardPanel({ heroName, result }: { heroName: string; result: CampProfileResult }) {
  const [current, setCurrent] = useState<0 | 1>(1)
  const [dragX, setDragX] = useState(0)
  const [instant, setInstant] = useState(true)
  const [width, setWidth] = useState(320)
  const containerRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef<number | null>(null)
  // 卡片跟介紹兩塊在換頁時會「同時」各自跑一次 transform transition（一個滑出去、
  // 一個滑進來），onTransitionEnd 掛在外層容器上會收到兩邊各自冒泡上來的事件——
  // 不擋住的話 setCurrent 的 toggle 會被觸發兩次，等於直接切回原本那頁，等於沒切。
  const settledRef = useRef(true)

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
    settledRef.current = false
    setDragX((value) => (Math.abs(value) > SWIPE_THRESHOLD_PX ? (value < 0 ? -width : width) : 0))
  }

  const handleTransitionEnd = (event: React.TransitionEvent) => {
    if (event.propertyName !== "transform") return
    if (settledRef.current) return
    if (Math.abs(dragX) < width) return
    settledRef.current = true
    setInstant(true)
    setCurrent((prev) => (prev === 0 ? 1 : 0))
    setDragX(0)
  }

  // 非目前頁的位移：跟著目前的拖曳方向從對應那一側進場，靜止時隨便放哪一側都好
  // （反正在可視範圍外，overflow-hidden 會裁掉）。
  const otherOffset = dragX <= 0 ? width : -width
  const detailsX = current === 0 ? dragX : dragX + otherOffset
  const cardX = current === 1 ? dragX : dragX + otherOffset
  const transition = instant ? "none" : SETTLE_TRANSITION

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-[320px] touch-pan-y overflow-hidden select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onTransitionEnd={handleTransitionEnd}
    >
      <div
        className={
          current === 0
            ? "flex w-full flex-col items-center justify-center overflow-y-auto px-1"
            : "absolute inset-0 flex flex-col items-center justify-center overflow-y-auto px-1"
        }
        style={{ transform: `translateX(${detailsX}px)`, transition }}
      >
        <CampHeroDetails result={result} />
      </div>

      <div
        className={current === 1 ? "w-full px-1" : "absolute inset-0 px-1"}
        style={{ transform: `translateX(${cardX}px)`, transition }}
      >
        <CampProfileCard heroName={heroName} result={result} showUserInfo={false} />
      </div>
    </div>
  )
}
