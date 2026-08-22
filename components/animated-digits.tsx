"use client"

import type { CSSProperties } from "react"
import { useLayoutEffect, useState } from "react"

function readStored(key: string | undefined, fallback: number): number {
  if (!key || typeof window === "undefined") return fallback
  const raw = window.localStorage.getItem(key)
  return raw ? Number(raw) : fallback
}

function toDigits(value: number, length: number): number[] {
  const str = Math.max(0, Math.trunc(value)).toString().padStart(length, "0")
  return str.split("").map(Number)
}

// 單一位數的「轉輪」：10 個數字疊成一直行，用 translateY 把對到的那個
// 數字滾進 1 行高的可視窗口，換數字時交給 CSS transition 滑過去，
// 不是整串文字直接替換——像機場時刻表、體育記分板那種翻牌效果。
function Digit({ digit, className }: { digit: number; className?: string }) {
  // w-[1ch]：轉輪內容是 position:absolute（不會撐開外層寬度，absolute
  // 元素脫離文件流，不計入父層的 auto 寬度），外層一定要自己給寬度，
  // 不然整個 Digit 會被壓成 0 寬（實測發生過，數字整串消失）。ch 是
  // 目前字型「0」字元的寬度，配合 tabular-nums（每個數字等寬）剛好等於
  // 單一數字的視覺寬度。
  return (
    <span className={`relative inline-block h-[1em] w-[1ch] overflow-hidden align-bottom ${className ?? ""}`}>
      <span
        className="absolute top-0 left-0 flex flex-col transition-transform duration-700 ease-out"
        style={{ transform: `translateY(-${digit}em)` }}
      >
        {Array.from({ length: 10 }, (_, n) => (
          <span key={n} className="flex h-[1em] items-center justify-center">
            {n}
          </span>
        ))}
      </span>
    </span>
  )
}

// 分區積分、勇氣值這些數字用的滾動計數器。掛載時直接畫出 value（跟 SSR
// 一致，不會 hydration mismatch），接著用 useLayoutEffect 在瀏覽器真正
// 畫出來之前，把畫面「偷換」成 localStorage 存的上次數值（如果有的話），
// 下一個 frame 再切回 value——這個切回去的瞬間才是使用者看到的動畫，
// 每個數字各自的轉輪會用 CSS transition 滾到新位置。storageKey 沒給就
// 不做這個把戲，直接顯示 value（例如 SSR 或不需要動畫的地方）。
export function AnimatedDigits({
  value,
  storageKey,
  className,
  digitClassName,
  style,
}: {
  value: number
  storageKey?: string
  className?: string
  digitClassName?: string
  style?: CSSProperties
}) {
  const [display, setDisplay] = useState(value)

  useLayoutEffect(() => {
    const stored = readStored(storageKey, value)
    if (stored === value) {
      if (storageKey) window.localStorage.setItem(storageKey, String(value))
      return
    }
    // localStorage 只有瀏覽器才讀得到，這裡的 setState 是把「讀到的上次
    // 數值」同步進畫面當作動畫起點（在瀏覽器真的畫出來之前換掉，使用者
    // 不會看到這個中間值），不是可以搬進 render 期間算的衍生值，跟一般
    // 「effect 裡不要 setState」的情境不同——這跟 squad-courage-card.tsx
    // 判斷加分徽章是同一種例外。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplay(stored)
    // 寫回 localStorage 延到動畫真的觸發（rAF 這一刻）才做，不是一進
    // effect 就寫——開發模式的 React StrictMode 會把 effect 跑兩次
    // （模擬 mount→cleanup→remount）驗證是否符合 pure，第一次的 rAF
    // 會被 cleanup 的 cancelAnimationFrame 取消掉；如果一開始就寫入
    // localStorage，第二次 effect 重跑時讀到的 stored 會已經等於
    // value，誤判成「不用動畫」，數字就卡在起點永遠滾不過去（實測
    // 發生過）。延到 rAF 真正執行、且沒被取消的那次才寫，才不會被
    // 提前取消的那次污染。
    const frame = requestAnimationFrame(() => {
      setDisplay(value)
      if (storageKey) window.localStorage.setItem(storageKey, String(value))
    })
    return () => cancelAnimationFrame(frame)
  }, [value, storageKey])

  const targetFormatted = value.toLocaleString("en-US")
  const digitCount = targetFormatted.replace(/,/g, "").length
  const displayDigits = toDigits(display, digitCount)

  let digitIndex = 0
  return (
    // inline-flex 直接內建在這裡，呼叫端的 className 不用記得加 flex——
    // 之前有一次漏掉，數字整串因為子元素都是 absolute 定位撐不開寬度而
    // 消失不見。
    <span className={`inline-flex ${className ?? ""}`} style={style}>
      {targetFormatted.split("").map((ch, i) =>
        ch === "," ? (
          <span key={i}>,</span>
        ) : (
          <Digit key={i} digit={displayDigits[digitIndex++]} className={digitClassName} />
        )
      )}
    </span>
  )
}
