"use server"

import { unstable_rethrow } from "next/navigation"

import { assertFlowAccess, requireClaimedSession, type AppSession } from "@/lib/session"
import { fetchPublicProfile } from "@/lib/profile"
import type {
  DiscussionResponse,
  DiscussionItem,
  LinkPreviewDTO,
  MoreRepliesResponse,
  PollDTO,
  PostImageDTO,
} from "./dto"
import { getDiscussionPage, getMoreReplies, getPostContext, getReplyChain, type SortMode } from "./queries"
import { flowForRootKey } from "./root-registry"
import {
  createReply,
  editReply,
  editRootContent,
  likePost,
  pinReply,
  softDeleteReply,
  toggleOfficial,
  unlikePost,
  unpinReply,
  updateDiscussionSettings,
  votePoll,
  type DiscussionSettingsPatch,
} from "./mutations"
import {
  discardPendingImage,
  fetchImagesByPostIds,
  fetchImagesForPost,
  removeImagesFromPost,
} from "./images"
import { ensureLinkPreview } from "./link-preview"
import { getOrCreateDiscussionRoot } from "./root"
import { isDiscussionAdmin } from "./permissions"
import { clearRootBibleReading, getRootBiblePassage, setRootBibleReading } from "./bible-reading"
import { DiscussionError } from "./constants"
import type { BiblePassage, BibleReference, BibleVersionKey } from "@/lib/bible"

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

// 用 post id 指定要讀哪一段討論的端點，除了 session 之外還要確認呼叫者有
// 資格看那則貼文所屬的活動。
//
// loadDiscussion 走的是 rootKey，rootKey 只能是註冊表裡的白名單，呼叫端頁面
// 已經被 requireFlowAccess 擋過；但吃 post id 的端點沒有這層保護——只擋
// requireClaimedSession() 的話，只報名 CONFERENCE 的人拿到一個 CAMP 的
// post id 就能把整串討論讀出來（見 CLAUDE.md：API 本身沒擋就等於沒擋）。
async function requirePostFlowAccess(session: AppSession, postId: string): Promise<void> {
  const context = await getPostContext(postId)
  const flow = context ? flowForRootKey(context.rootKey) : null
  // 查不到、或 root_key 沒註冊過，一律當成不存在，不可以 fallback 成放行。
  if (!flow) throw new DiscussionError("找不到這則討論")
  assertFlowAccess(session, flow)
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
  cursor?: string | null,
  excludePostId?: string
): Promise<ActionResult<MoreRepliesResponse>> {
  return toResult(
    (async () => {
      const session = await requireClaimedSession()
      await requirePostFlowAccess(session, parentPostId)
      return getMoreReplies({ parentPostId, viewerId: session.user.id, cursor, excludePostId })
    })()
  )
}

// 展開某則貼文底下的「主幹」（規則 4：展開只顯示一條往下的鏈，不是攤開
// 整層子回覆）。要再往下接的時候，呼叫端把鏈尾那則的 id 當 parentPostId
// 再叫一次就好——查詢本身沒有游標，因為它每次都只走 best_direct_child_id
// 這條 O(K) 的指標鏈。
export async function loadReplyChain(
  parentPostId: string,
  excludeSeedId?: string | null
): Promise<ActionResult<DiscussionItem[]>> {
  return toResult(
    (async () => {
      const session = await requireClaimedSession()
      await requirePostFlowAccess(session, parentPostId)
      return getReplyChain(parentPostId, session.user.id, undefined, excludeSeedId)
    })()
  )
}

// 討論串頁（/discussion/[postId]）的直接子回覆，支援熱門／最新排序與分頁。
// getDiscussionPage 的 rootPostId 參數實際上就是「要列出誰底下的直接子回覆」，
// 對一般貼文一樣成立——置頂只有 root 會有，非 root 查出來本來就是空的。
export async function loadThreadReplies(
  parentPostId: string,
  sort: SortMode,
  cursor?: string | null
): Promise<ActionResult<DiscussionResponse>> {
  return toResult(
    (async () => {
      const session = await requireClaimedSession()
      await requirePostFlowAccess(session, parentPostId)
      return getDiscussionPage({ rootPostId: parentPostId, viewerId: session.user.id, sort, cursor })
    })()
  )
}

export async function submitReply(
  parentPostId: string,
  content: string,
  poll?: { allowMultiple: boolean; options: string[] },
  // 已經上傳完成的圖片 id（上傳走 /api/discussion/images，發文時才綁定）
  imageIds?: string[]
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
        imageIds,
      })
      const [images, profile] = await Promise.all([
        fetchImagesByPostIds([post.id]),
        fetchPublicProfile(session.user.id),
      ])
      // 新貼文剛建立，讚數/回覆數都是 0，不需要再查一次 enrich。
      return {
        post: {
          id: post.id,
          authorId: post.authorId,
          authorName: profile?.displayName ?? session.user.name,
          authorRole: session.user.role,
          authorAvatarUrl: profile?.avatarUrl ?? null,
          authorZone: profile?.zone ?? null,
          content: post.content,
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
          isDeleted: false,
          isPinned: false,
          isOfficial: false,
          images: images.get(post.id) ?? [],
          linkPreview: null,
        },
        stats: { likeCount: 0, directReplyCount: 0 },
        viewer: { hasLiked: false },
        hiddenReplyCount: 0,
      } satisfies DiscussionItem
    })()
  )
}

export async function submitEditReply(
  postId: string,
  content: string,
  imageIds?: string[]
): Promise<ActionResult<null>> {
  return toResult(
    (async () => {
      const session = await requireClaimedSession()
      await editReply(postId, session.user.id, content, imageIds ?? [])
      return null
    })()
  )
}

// root 沒有作者，不能像 submitEditReply 那樣讓「作者本人」編輯——只有
// discussion admin 能編輯 root 的大綱文字。
export async function submitEditRootContent(
  rootPostId: string,
  content: string,
  imageIds?: string[]
): Promise<ActionResult<PostImageDTO[]>> {
  return toResult(
    (async () => {
      const session = await requireClaimedSession()
      if (!isDiscussionAdmin(session)) throw new DiscussionError("沒有權限")
      await editRootContent(rootPostId, content, imageIds ?? [], session.user.id)
      // root 的顯示不是走 enrichRows（那幾頁是 server component 各自查的），
      // 所以編輯完直接把最新的圖片清單回給呼叫端，不用整頁重新整理。
      return fetchImagesForPost(rootPostId)
    })()
  )
}

// 閱讀模式：只有 discussion admin 能設定／清除 root 的固定段落——跟
// submitEditRootContent 同一個權限模型（root 沒有作者，不能比對 authorId）。
export async function submitSetRootBibleReading(
  rootPostId: string,
  version: BibleVersionKey,
  reference: BibleReference
): Promise<ActionResult<BiblePassage | null>> {
  return toResult(
    (async () => {
      const session = await requireClaimedSession()
      if (!isDiscussionAdmin(session)) throw new DiscussionError("沒有權限")
      await setRootBibleReading(rootPostId, version, reference, session.user.id)
      return getRootBiblePassage(rootPostId)
    })()
  )
}

export async function submitClearRootBibleReading(rootPostId: string): Promise<ActionResult<null>> {
  return toResult(
    (async () => {
      const session = await requireClaimedSession()
      if (!isDiscussionAdmin(session)) throw new DiscussionError("沒有權限")
      await clearRootBibleReading(rootPostId)
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

// 只有 discussion admin 能切換官方顯示旗標，而且只能切自己發的貼文——
// mutations.ts 的 toggleOfficial 再擋一次 authorId，這裡先擋角色。
export async function submitToggleOfficial(postId: string, next: boolean): Promise<ActionResult<null>> {
  return toResult(
    (async () => {
      const session = await requireClaimedSession()
      if (!isDiscussionAdmin(session)) throw new DiscussionError("沒有權限")
      await toggleOfficial(postId, session.user.id, next)
      return null
    })()
  )
}

// 使用者在編輯器裡把還沒送出的圖片按掉：立刻連 R2 的檔案一起刪，不用等
// 孤兒回收（uploadedBy 卡在 WHERE 裡，只能刪自己上傳的）。
export async function discardImage(imageId: string): Promise<ActionResult<null>> {
  return toResult(
    (async () => {
      const session = await requireClaimedSession()
      await discardPendingImage(imageId, session.user.id)
      return null
    })()
  )
}

// 編輯已發布的貼文時移除某幾張圖。只有作者本人可以（跟 submitEditReply
// 一樣，管理員不能代編他人的發言內容），R2 的檔案一起刪掉。
export async function submitRemovePostImages(postId: string, imageIds: string[]): Promise<ActionResult<null>> {
  return toResult(
    (async () => {
      const session = await requireClaimedSession()
      await requirePostFlowAccess(session, postId)
      await removeImagesFromPost(postId, imageIds, session.user.id, isDiscussionAdmin(session))
      return null
    })()
  )
}

// 內文裡的連結還沒有快取過的預覽時，由前端補打這一支（畫面上先顯示骨架）。
// 抓取本身在 lib/discussion/link-preview.ts，那裡會擋掉指向內網的網址
// ——這支端點等於「讓登入者叫伺服器去連一個他給的網址」，沒有那層防護就是
// 一個 SSRF 洞。
export async function loadLinkPreview(url: string): Promise<ActionResult<LinkPreviewDTO | null>> {
  return toResult(
    (async () => {
      await requireClaimedSession()
      return ensureLinkPreview(url)
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
