import Image from "next/image"
import { HeroCta } from "@/components/hero-cta"
import { HeroSessionCta } from "@/components/hero-session-cta"
import SideRays from "@/components/side-rays"
import type { AppSession } from "@/lib/session"
import { siteConfig } from "@/lib/site-config"

export function HeroSection({ session }: { session: AppSession | null }) {
  return (
    <section
      id="top"
      className="relative flex min-h-[calc(100svh-57px)] flex-col items-center justify-center overflow-hidden px-4 py-16 text-center sm:px-6"
    >
      <div className="absolute inset-0 z-0">
        <SideRays
          rayColor1="#F6ED8E"
          rayColor2="#C9B85E"
          speed={0.6}
          intensity={1.2}
          spread={1.2}
          origin="top-right"
          saturation={1}
          blend={0.5}
          falloff={2}
          opacity={0.5}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* 主視覺圖已經把 PASSION 標準字、「勇者世代」中英文標題都畫進圖裡
            了，不用再另外疊 logo／文字。h1 保留但用 sr-only 藏起來——整頁
            少了這個會少一個 heading，SEO／螢幕閱讀器都會抓不到頁面主標題。 */}
        <h1 className="sr-only">
          PASSION《{siteConfig.themeZh}》{siteConfig.themeEn}
        </h1>
        {/* max-w-xs sm:max-w-2xl 跟底下按鈕容器（see 下方 max-w-xs
            sm:max-w-none）手機寬度對齊——圖片本身沒有留白邊界（bbox
            量過整張圖 0~2200px 都是實際內容），純粹是容器寬度沒對齊，
            手機版原本圖片跟著整個內距寬度撐開，比按鈕的 max-w-xs 還寬，
            左右邊緣才會超出按鈕。桌面版按鈕改成一排、寬度不固定，圖片
            用 max-w-2xl 抓一個合理大小就好，不用硬要像素對齊。 */}
        <Image
          src="/images/hero-title-visual.webp"
          alt={`PASSION《${siteConfig.themeZh}》${siteConfig.themeEn}`}
          width={2200}
          height={333}
          priority
          className="h-auto w-full max-w-xs sm:max-w-2xl"
        />

        <p className="mt-6 text-base text-muted-foreground sm:text-lg">
          {siteConfig.year}.8 @{siteConfig.venue}
        </p>

        <div className="mt-10 w-full max-w-xs sm:max-w-none">
          {session ? <HeroSessionCta session={session} /> : <HeroCta />}
        </div>
      </div>
    </section>
  )
}
