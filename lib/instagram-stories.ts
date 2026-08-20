// 官方 IG 限時動態原本串 Instagram Graph API 自動抓，需要商業帳號＋Meta App
// 驗證流程，先關掉改成手動維護：把截圖存進 public/images/，這裡指到那個檔案。
//
// 還沒有圖片可放的時候維持 null，首頁那一欄會整個隱藏（見
// components/ig-stories-section.tsx）；之後要換圖，直接覆蓋圖片檔案，
// 檔名不同的話記得同步改這裡的路徑。
export const IG_STORY_IMAGE: string | null = null
