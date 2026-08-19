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
}

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.orgName,
  url: siteConfig.url,
  logo: `${siteConfig.url}/images/passion-logo.png`,
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
