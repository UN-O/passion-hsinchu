export type UserRole = "attendee" | "staff" | "admin"

// 附圖。圖檔在私有的 R2 bucket 裡，所以這裡給的是站上讀取端點的路徑，
// 不是 R2 網址——外流一個 R2 直連網址等於外流一張沒有權限控管的照片
// （見 lib/r2.ts、app/api/discussion/images）。
// width/height 是原始比例，用來在圖片載入前先撐出正確大小的骨架，避免
// 圖載完之後整串貼文往下跳。
export type PostImageDTO = {
  id: string
  url: string
  thumbUrl: string
  width: number
  height: number
}

// 內文裡第一個網址的預覽卡片。imageUrl 一樣是站上的路徑，不是對方站台的
// 網址——見 lib/discussion/link-preview.ts 的說明。
export type LinkPreviewDTO = {
  url: string
  host: string
  title: string | null
  description: string | null
  siteName: string | null
  imageUrl: string | null
}

export type PostDTO = {
  id: string
  authorId: string | null
  authorName: string | null
  authorRole: UserRole | null
  content: string
  createdAt: string
  updatedAt: string
  isDeleted: boolean
  isPinned: boolean
  // 顯示旗標：畫面上把作者名稱／icon 換成「PASSION 官方」，貼文實際作者
  // （authorId）跟編輯／刪除權限都不受影響。
  isOfficial: boolean
  images: PostImageDTO[]
  // null＝還沒有快取（前端會自己補抓一次），或這個連結做不出卡片。
  linkPreview: LinkPreviewDTO | null
}

export type PollDTO = {
  postId: string
  allowMultiple: boolean
  closed: boolean
  options: { id: string; label: string; voteCount: number }[]
  viewerOptionIds: string[]
}

export type DiscussionEntry = {
  post: PostDTO
  stats: { likeCount: number; directReplyCount: number }
  viewer: { hasLiked: boolean }
  poll?: PollDTO
}

export type DiscussionItem = DiscussionEntry & {
  featuredChild?: DiscussionEntry
  hiddenReplyCount: number
}

export type DiscussionResponse = {
  replies: DiscussionItem[]
  nextCursor: string | null
  hasMore: boolean
}

export type MoreRepliesResponse = {
  replies: DiscussionItem[]
  nextCursor: string | null
  hasMore: boolean
}
