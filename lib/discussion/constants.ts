// 討論系統的固定常數。跟 lib/exp-regions.ts 一樣的理由：這個檔案刻意
// 不 import 任何伺服器端的東西（尤其是 @/db），因為 client component
// 也需要這些數字做前端驗證/UI 限制；真正查資料庫的部分都在
// lib/discussion/mutations.ts、queries.ts。

export const MAX_CONTENT_LENGTH = 2000

export const MIN_POLL_OPTIONS = 2
export const MAX_POLL_OPTIONS = 6
export const MAX_POLL_OPTION_LENGTH = 80

export class DiscussionError extends Error {}
