import type React from "react"
import type { Metadata, Viewport } from "next"
import "./globals.css"
import { Inter, Noto_Sans_JP } from "next/font/google";
import { cn } from "@/lib/utils";
import { JsonLd } from "@/components/json-ld";
import { siteConfig, socialLinks } from "@/lib/site-config";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});
// 標題字體（--font-heading）。CJK 字符不是靠 subsets 參數挑的——Google Fonts
// 對這類大字集字型一律回傳整組 unicode-range 分片，瀏覽器只會按頁面實際用到
// 的字去抓對應分片，所以這裡的 subsets 只影響拉丁字，中文字照樣涵蓋。
const notoSansJP = Noto_Sans_JP({ subsets: ["latin"], weight: ["700"], variable: "--font-noto-jp", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.edition}《${siteConfig.themeZh}》`,
    template: `%s — ${siteConfig.edition}`,
  },
  description: siteConfig.description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "zh_TW",
    url: "/",
    siteName: siteConfig.orgName,
    title: `${siteConfig.edition}《${siteConfig.themeZh}》`,
    description: siteConfig.description,
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: `${siteConfig.edition}《${siteConfig.themeZh}》`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.edition}《${siteConfig.themeZh}》`,
    description: siteConfig.description,
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#F6ED8E",
  // 沒宣告 color-scheme 的話，部分瀏覽器（實測 Samsung Internet 最明顯）
  // 會用自己的「網頁自動深色模式」heuristic 硬套一層反色／變色濾鏡，
  // 想把它以為的「淺色網站」轉成深色，但這個網站本來就是深色為主
  // （只有 /camp/* 用 .camp-theme 覆寫成淺黃色），套上去的結果是整頁
  // 變成詭異的橘棕色（使用者截圖回報）。宣告 "light dark" 告訴瀏覽器
  // 這個網站兩種配色都是刻意設計的，不需要瀏覽器自己猜、自己套濾鏡。
  colorScheme: "light dark",
}

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.orgName,
  url: siteConfig.url,
  logo: `${siteConfig.url}/images/passion-logo.webp`,
  address: {
    "@type": "PostalAddress",
    streetAddress: siteConfig.contactAddress,
    addressLocality: "新竹市",
    addressCountry: "TW",
  },
  // 讓 Google 把這些社群帳號跟同一個 Organization 對起來（Knowledge Panel）。
  sameAs: [socialLinks.instagram, socialLinks.youtube, socialLinks.linktree],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-TW" className={cn("font-sans", inter.variable, notoSansJP.variable)}>
      <body className="antialiased">
        <JsonLd data={organizationJsonLd} />
        {children}
      </body>
    </html>
  )
}
