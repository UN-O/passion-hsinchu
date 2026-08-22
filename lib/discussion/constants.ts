// 討論系統的固定常數。跟 lib/exp-regions.ts 一樣的理由：這個檔案刻意
// 不 import 任何伺服器端的東西（尤其是 @/db），因為 client component
// 也需要這些數字做前端驗證/UI 限制；真正查資料庫的部分都在
// lib/discussion/mutations.ts、queries.ts。

export const MAX_CONTENT_LENGTH = 2000

export const MIN_POLL_OPTIONS = 2
export const MAX_POLL_OPTIONS = 6
export const MAX_POLL_OPTION_LENGTH = 80

export class DiscussionError extends Error {}

// 一則貼文最多幾張圖。前端擋、上傳端點擋、附加到貼文時再擋一次。
export const MAX_POST_IMAGES = 10

// 壓縮之後的目標。原圖長邊 1600px 足夠放大檢視（手機 3x DPI 也還可以），
// 縮圖 480px 給列表的方格用——列表 10 張全部載原圖會是好幾 MB。
export const IMAGE_MAX_EDGE = 1600
export const IMAGE_THUMB_MAX_EDGE = 480

// 壓縮時逐步降畫質，直到檔案小於這個大小為止（見 image-compress.ts）。
export const IMAGE_TARGET_BYTES = 260 * 1024
export const IMAGE_THUMB_TARGET_BYTES = 48 * 1024

// 上傳端點的硬上限。壓縮是在瀏覽器做的，但端點不能相信前端——直接打
// API 的人可以送任何東西進來。
export const IMAGE_MAX_UPLOAD_BYTES = 2 * 1024 * 1024

// 只收這兩種。webp 是主要格式；jpeg 是給 canvas 不支援 webp 編碼的舊
// Safari 的退路。
export const IMAGE_ALLOWED_TYPES = ["image/webp", "image/jpeg"] as const
export type ImageContentType = (typeof IMAGE_ALLOWED_TYPES)[number]

// 沒被附加到任何貼文的上傳（使用者選了圖但最後沒送出）超過這個時間就回收。
export const IMAGE_ORPHAN_TTL_MS = 6 * 60 * 60 * 1000

// 討論 root（含大綱內文）被 unstable_cache 包了 1 小時（見
// lib/discussion/root.ts）。管理員改完大綱之後要讓其他人立刻看到新內容，
// 就得把那份快取打掉——tag 放在這裡而不是 root.ts，是為了避免
// mutations.ts ↔ root.ts 互相 import（root.ts 已經 import 了 mutations.ts
// 的 seedOfficialQuestions）。
export const DISCUSSION_ROOT_TAG = "discussion-root"
