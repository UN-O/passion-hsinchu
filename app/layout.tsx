import type React from "react"
import type { Metadata } from "next"
import { Noto_Sans_TC } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/auth-provider"

const notoSansTC = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-noto-sans-tc",
})

export const metadata: Metadata = {
  title: "2025 Passion Camp - Rebirth | 全新竹最火熱的營會",
  description:
    "全新竹最火熱的營會～PASSION CAMP點燃你人生的轉折點！加入我們的青年營會，體驗信仰、友誼與成長的精彩旅程。",
  keywords: ["Passion Camp", "青年營會", "新竹營會", "基督教營會", "青年活動", "信仰成長", "2025"],
  authors: [{ name: "Passion Camp Team" }],
  creator: "Passion Camp",
  publisher: "Passion Camp",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://passion-camp.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "2025 Passion Camp - Rebirth",
    description: "全新竹最火熱的營會～PASSION CAMP點燃你人生的轉折點！",
    url: "https://passion-camp.vercel.app",
    siteName: "Passion Camp",
    locale: "zh_TW",
    type: "website",
    images: [
      {
        url: "/og-rebirth.png",
        width: 1200,
        height: 630,
        alt: "Passion Camp 2025 - Rebirth",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "2025 Passion Camp - Rebirth",
    description: "全新竹最火熱的營會～PASSION CAMP點燃你人生的轉折點！",
    images: ["/og-rebirth.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-TW" className={`${notoSansTC.variable} dark`}>
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 fontSize=%2264%22>🔥</text></svg>"
        />
        <link
          rel="apple-touch-icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 fontSize=%2264%22>🔥</text></svg>"
        />
      </head>
      <body className="font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
