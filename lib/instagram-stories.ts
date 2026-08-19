// 官方 IG 帳號限時動態。用 Instagram Graph API 讀取目前還沒過期（24 小時內）的限時動態。
//
// 需要兩個環境變數（放 .env，不要寫進程式碼）：
//   IG_ACCESS_TOKEN         — 長效 access token（60 天效期，過期要重新產生）
//   IG_BUSINESS_ACCOUNT_ID  — 官方帳號的 Instagram 商業帳號 ID
//
// 設定步驟（要有官方 IG 帳號的管理權限才能做）：
//   1. 官方帳號要是「商業帳號」或「創作者帳號」，並連結一個 Facebook 粉專
//   2. 去 https://developers.facebook.com/apps 建立一個 Meta App
//   3. 在 App 的「Instagram」設定裡，把管理官方帳號的人加為「Instagram 測試者」
//      （開發模式下這樣就夠用了，不需要送 App Review——這個網站只是顯示官方自己
//      帳號的內容，不是幫別人存取資料）
//   4. 用 Graph API Explorer 產生一組長效 access token
//   5. 查 IG_BUSINESS_ACCOUNT_ID：呼叫 GET /me/accounts 找到連結的粉專，
//      粉專物件裡的 instagram_business_account.id 欄位就是這個值
//
// 沒有設定這兩個環境變數，或帳號目前沒有限時動態時，一律回傳空陣列，
// UI 那邊會顯示「目前沒有限時動態」，不會噴錯。
export type IgStory = {
  id: string
  mediaType: "IMAGE" | "VIDEO"
  mediaUrl: string
  permalink: string
}

export async function getActiveStories(): Promise<IgStory[]> {
  const accessToken = process.env.IG_ACCESS_TOKEN
  const igUserId = process.env.IG_BUSINESS_ACCOUNT_ID
  if (!accessToken || !igUserId) return []

  const url = new URL(`https://graph.facebook.com/v21.0/${igUserId}/stories`)
  url.searchParams.set("fields", "media_type,media_url,permalink")
  url.searchParams.set("access_token", accessToken)

  const res = await fetch(url, { next: { revalidate: 300 } })
  if (!res.ok) return []

  const data: { data?: { id: string; media_type: string; media_url: string; permalink: string }[] } =
    await res.json()

  return (data.data ?? [])
    .filter((item) => item.media_type === "IMAGE" || item.media_type === "VIDEO")
    .map((item) => ({
      id: item.id,
      mediaType: item.media_type as "IMAGE" | "VIDEO",
      mediaUrl: item.media_url,
      permalink: item.permalink,
    }))
}
