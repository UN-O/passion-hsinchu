import { siteConfig } from "@/lib/site-config"

// 維護腳本（sync-roster.ts、rename-churches.ts）是獨立跑的 node process，
// 直接寫資料庫、跳過網站所有的 server action，所以也跳過了 updateTag——
// 在這種腳本裡直接呼叫 revalidateTag/updateTag 完全沒有效果，因為它們不連
// 著任何一個 Next.js server instance。這支函式改成打 app/api/revalidate
// 這個 route handler，讓真正跑著的 Next.js server 去呼叫 revalidateTag。
//
// 失敗只印警告、不丟出去讓呼叫端的腳本整個中斷：資料庫的寫入這時候已經
// 成功了，快取頂多等 TTL 到期才更新，不是非成功不可的一步。
export async function triggerRevalidate(tag: string): Promise<void> {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret) {
    console.warn(`\n沒有設定 REVALIDATE_SECRET，跳過即時清快取（${tag} 要等 TTL 到期才會更新）`)
    return
  }

  try {
    const res = await fetch(`${siteConfig.url}/api/revalidate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
      body: JSON.stringify({ tag }),
    })
    if (!res.ok) {
      console.warn(`\n清快取失敗：HTTP ${res.status}（${tag} 要等 TTL 到期才會更新，不影響剛剛的資料庫寫入）`)
      return
    }
    console.log(`\n已清掉快取：${tag}`)
  } catch (error) {
    console.warn(
      `\n清快取時發生連線錯誤：${error instanceof Error ? error.message : String(error)}（不影響剛剛的資料庫寫入）`
    )
  }
}
