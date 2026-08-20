"use server"

import { unstable_rethrow } from "next/navigation"

import { requireClaimedSession } from "@/lib/session"
import type { DiscussionResponse, DiscussionItem, MoreRepliesResponse, PollDTO } from "./dto"
import { getDiscussionPage, getMoreReplies, type SortMode } from "./queries"
import {
  createReply,
  editReply,
  likePost,
  pinReply,
  softDeleteReply,
  unlikePost,
  unpinReply,
  updateDiscussionSettings,
  votePoll,
  type DiscussionSettingsPatch,
} from "./mutations"
import { getOrCreateDiscussionRoot } from "./root"
import { isDiscussionAdmin } from "./permissions"
import { DiscussionError } from "./constants"

// 每個 client component 呼叫的 server action 都各自獨立驗證 session，
// 不依賴「這個元件是從哪個已經被 requireFlowAccess 擋過的頁面 render 出來的」
// ——server action 可以被直接呼叫，跟它被 render 在哪個頁面無關，這裡不擋
// 就等於沒擋（見 CLAUDE.md 資安規則）。
type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string }

function toResult<T>(promise: Promise<T>): Promise<ActionResult<T>> {
  return promise
    .then((data) => ({ ok: true as const, data }))
    .catch((error: unknown) => {
      // requireClaimedSession() 在沒有 session 時呼叫 redirect("/signin")，
      // 那是靠 throw 一個帶特殊 digest 的錯誤來運作的——如果在這裡被當成
      // 普通錯誤吞掉，導向就不會真的發生。redirect/notFound 一定要重新
      // throw 出去，只有其他錯誤才轉成一般的 error 訊息。
      unstable_rethrow(error)
      return {
        ok: false as const,
        error: error instanceof DiscussionError ? error.message : "操作失敗，請稍後再試",
      }
    })
}

export async function loadDiscussion(
  rootKey: string,
  sort: SortMode,
  cursor?: string | null
): Promise<ActionResult<DiscussionResponse & { rootPostId: string }>> {
  return toResult(
    (async () => {
      const session = await requireClaimedSession()
      const root = await getOrCreateDiscussionRoot(rootKey)
      const page = await getDiscussionPage({ rootPostId: root.id, viewerId: session.user.id, sort, cursor })
      return { ...page, rootPostId: root.id }
    })()
  )
}

export async function loadMoreReplies(
  parentPostId: string,
  cursor?: string | null
): Promise<ActionResult<MoreRepliesResponse>> {
  return toResult(
    (async () => {
      const session = await requireClaimedSession()
      return getMoreReplies({ parentPostId, viewerId: session.user.id, cursor })
    })()
  )
}

export async function submitReply(
  parentPostId: string,
  content: string,
  poll?: { allowMultiple: boolean; options: string[] }
): Promise<ActionResult<DiscussionItem>> {
  return toResult(
    (async () => {
      const session = await requireClaimedSession()
      const post = await createReply({
        parentPostId,
        authorId: session.user.id,
        authorRole: session.user.role,
        content,
        poll,
      })
      // 新貼文剛建立，讚數/回覆數都是 0，不需要再查一次 enrich。
      return {
        post: {
          id: post.id,
          authorId: post.authorId,
          authorName: session.user.name,
          authorRole: session.user.role,
          content: post.content,
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
          isDeleted: false,
          isPinned: false,
        },
        stats: { likeCount: 0, directReplyCount: 0 },
        viewer: { hasLiked: false },
        hiddenReplyCount: 0,
      } satisfies DiscussionItem
    })()
  )
}

export async function submitEditReply(postId: string, content: string): Promise<ActionResult<null>> {
  return toResult(
    (async () => {
      const session = await requireClaimedSession()
      await editReply(postId, session.user.id, content)
      return null
    })()
  )
}

export async function submitDeleteReply(postId: string): Promise<ActionResult<null>> {
  return toResult(
    (async () => {
      const session = await requireClaimedSession()
      await softDeleteReply(postId, session.user.id, isDiscussionAdmin(session))
      return null
    })()
  )
}

export async function submitLike(postId: string): Promise<ActionResult<{ likeCount: number }>> {
  return toResult(
    (async () => {
      const session = await requireClaimedSession()
      return likePost(postId, session.user.id)
    })()
  )
}

export async function submitUnlike(postId: string): Promise<ActionResult<{ likeCount: number }>> {
  return toResult(
    (async () => {
      const session = await requireClaimedSession()
      return unlikePost(postId, session.user.id)
    })()
  )
}

export async function submitPollVote(
  pollPostId: string,
  optionId: string
): Promise<ActionResult<Pick<PollDTO, "options" | "viewerOptionIds">>> {
  return toResult(
    (async () => {
      const session = await requireClaimedSession()
      const result = await votePoll(pollPostId, optionId, session.user.id)
      return {
        options: result.options.map((o) => ({ id: o.id, label: o.label, voteCount: o.voteCount })),
        viewerOptionIds: result.viewerOptionIds,
      }
    })()
  )
}

export async function submitPin(rootPostId: string, postId: string): Promise<ActionResult<null>> {
  return toResult(
    (async () => {
      const session = await requireClaimedSession()
      if (!isDiscussionAdmin(session)) throw new DiscussionError("沒有權限置頂")
      await pinReply(rootPostId, postId, session.user.id)
      return null
    })()
  )
}

export async function submitUnpin(rootPostId: string, postId: string): Promise<ActionResult<null>> {
  return toResult(
    (async () => {
      const session = await requireClaimedSession()
      if (!isDiscussionAdmin(session)) throw new DiscussionError("沒有權限取消置頂")
      await unpinReply(rootPostId, postId)
      return null
    })()
  )
}

export async function submitDiscussionSettings(
  rootPostId: string,
  patch: DiscussionSettingsPatch
): Promise<ActionResult<null>> {
  return toResult(
    (async () => {
      const session = await requireClaimedSession()
      if (!isDiscussionAdmin(session)) throw new DiscussionError("沒有權限修改討論設定")
      await updateDiscussionSettings(rootPostId, patch)
      return null
    })()
  )
}
