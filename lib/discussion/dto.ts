export type UserRole = "attendee" | "staff" | "admin"

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
