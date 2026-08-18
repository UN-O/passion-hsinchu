import Image from "next/image"

// 一般深色頁面頂端的 PASSION logo，白色版本（跟 camp-profile-card.tsx 用法一致）。
// rightSlot 可以放個人資料按鈕之類的東西，會貼齊 logo 那一行的右側、垂直置中對齊 logo。
export function PassionLogoHeader({ rightSlot }: { rightSlot?: React.ReactNode } = {}) {
  return (
    <div className="pt-6">
      <div className="relative flex justify-center">
        <Image
          src="/images/passion-logo.png"
          alt="PASSION®"
          width={979}
          height={178}
          className="h-6 w-auto brightness-0 invert"
        />
        {rightSlot && <div className="absolute top-1/2 right-0 -translate-y-1/2">{rightSlot}</div>}
      </div>
    </div>
  )
}
