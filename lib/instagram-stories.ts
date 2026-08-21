// 官方 IG 限時動態原本串 Instagram Graph API 自動抓，需要商業帳號＋Meta App
// 驗證流程，先關掉改成手動維護：把截圖存進 public/images/，這裡登記路徑跟
// 上傳時間。跟真正的 IG 限動一樣，每張圖從上傳時間起算 24 小時後自動下架
// （見 getActiveIgStories），不用手動刪除／記得清掉舊圖。
export type IgStory = {
  image: string
  // 上傳時間（ISO），從這個時間起算 24 小時後這張圖就不會再顯示。
  uploadedAt: string
}

// 手動維護的限動清單，最新上傳的排最前面（首頁縮圖固定顯示第一筆）。
// 之後要上新圖：把檔案放進 public/images/，在這裡加一筆，時間填實際
// 上傳的當下時間；24 小時一到舊的那筆會自動被 getActiveIgStories 濾掉，
// 不用手動移除這筆資料（留著也沒差，只是不會再顯示）。
export const IG_STORIES: IgStory[] = [
  { image: "/images/camp-ig-story.webp", uploadedAt: "2026-08-21T13:00:00+08:00" },
]

const STORY_TTL_MS = 24 * 60 * 60 * 1000

// 只回傳還在 24 小時效期內的限動，超過的自動濾掉。伺服器端算好整包傳給
// client（見 camp-mission-home.tsx），不用讓 client 自己重算過期邏輯。
export function getActiveIgStories(now: Date = new Date()): IgStory[] {
  const nowMs = now.getTime()
  return IG_STORIES.filter((story) => nowMs - new Date(story.uploadedAt).getTime() < STORY_TTL_MS)
}
