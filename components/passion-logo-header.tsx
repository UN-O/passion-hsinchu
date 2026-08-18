import Image from "next/image"

// 一般深色頁面頂端的 PASSION logo，白色版本（跟 camp-profile-card.tsx 用法一致）。
export function PassionLogoHeader() {
  return (
    <div className="flex justify-center pt-6">
      <Image
        src="/images/passion-logo.png"
        alt="PASSION®"
        width={979}
        height={178}
        className="h-6 w-auto brightness-0 invert"
      />
    </div>
  )
}
