import type { MetadataRoute } from "next"
import { siteConfig } from "@/lib/site-config"

export default function robots(): MetadataRoute.Robots {
  return {
    // 只開放行銷頁面。/signin/camp 會查資料庫撈教會清單，讓爬蟲隨意抓等於
    // 拿資料庫額度餵爬蟲；其餘也都是登入後才有意義的頁面，沒有索引價值。
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/signin", "/claim", "/camp", "/conference", "/opening"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  }
}
