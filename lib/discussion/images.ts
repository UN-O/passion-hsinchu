import { randomUUID } from "node:crypto"
import { and, eq, inArray, isNull, lt } from "drizzle-orm"

import { db } from "@/db"
import { postImages, posts } from "@/db/schema/discussion"
import { deleteObjects, putObject } from "@/lib/r2"
import type { PostImageDTO } from "./dto"
import {
  DiscussionError,
  IMAGE_ALLOWED_TYPES,
  IMAGE_MAX_UPLOAD_BYTES,
  IMAGE_ORPHAN_TTL_MS,
  MAX_POST_IMAGES,
  type ImageContentType,
} from "./constants"

// 圖片的 R2 key。用不可猜的 uuid（不是 postId／流水號）——就算之後有人
// 把讀取端點的權限改鬆了，key 本身也不該是可以枚舉出來的。
function keysFor(id: string, contentType: ImageContentType): { storageKey: string; thumbKey: string } {
  const ext = contentType === "image/webp" ? "webp" : "jpg"
  return {
    storageKey: `discussion/${id}.${ext}`,
    thumbKey: `discussion/${id}-thumb.${ext}`,
  }
}

// 圖片的公開識別只有 image id；真正的 R2 key 不會出現在任何回應裡。
export function toImageDTO(row: typeof postImages.$inferSelect): PostImageDTO {
  return {
    id: row.id,
    url: `/api/discussion/images/${row.id}`,
    thumbUrl: `/api/discussion/images/${row.id}?v=thumb`,
    width: row.width,
    height: row.height,
  }
}

// 檔頭 magic bytes 檢查。宣稱的 content-type 是前端寫的，不能拿來當真——
// 端點必須自己確認 bytes 真的是它說的那種圖片。
function sniffContentType(bytes: Uint8Array): ImageContentType | null {
  // RIFF....WEBP
  if (
    bytes.length > 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp"
  }
  // JPEG: FF D8 FF
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg"
  return null
}

export type UploadImageInput = {
  uploaderId: string
  full: Uint8Array
  thumb: Uint8Array
  declaredType: string
  width: number
  height: number
}

// 上傳一張圖：先寫 R2，成功之後才寫 DB（順序反過來的話，DB 會留下一筆
// 指向不存在物件的列）。這時候還沒有 postId——貼文要等使用者按送出才會
// 存在，見 db/schema/discussion.ts 的 post_images 說明。
export async function uploadPendingImage(input: UploadImageInput): Promise<PostImageDTO> {
  if (input.full.byteLength === 0) throw new DiscussionError("圖片是空的")
  if (input.full.byteLength > IMAGE_MAX_UPLOAD_BYTES) throw new DiscussionError("圖片太大了")
  if (input.thumb.byteLength > IMAGE_MAX_UPLOAD_BYTES) throw new DiscussionError("縮圖太大了")

  const sniffed = sniffContentType(input.full)
  const thumbSniffed = sniffContentType(input.thumb)
  if (!sniffed || !thumbSniffed) throw new DiscussionError("只接受 WebP 或 JPEG 圖片")
  if (!IMAGE_ALLOWED_TYPES.includes(input.declaredType as ImageContentType) || input.declaredType !== sniffed) {
    throw new DiscussionError("圖片格式跟宣告的不一致")
  }
  if (!Number.isFinite(input.width) || !Number.isFinite(input.height) || input.width <= 0 || input.height <= 0) {
    throw new DiscussionError("圖片尺寸無效")
  }

  const id = randomUUID()
  const { storageKey, thumbKey } = keysFor(id, sniffed)

  await Promise.all([putObject(storageKey, input.full, sniffed), putObject(thumbKey, input.thumb, thumbSniffed)])

  try {
    const [row] = await db
      .insert(postImages)
      .values({
        id,
        uploadedBy: input.uploaderId,
        storageKey,
        thumbKey,
        contentType: sniffed,
        width: Math.round(input.width),
        height: Math.round(input.height),
        byteSize: input.full.byteLength,
      })
      .returning()
    return toImageDTO(row)
  } catch (error) {
    // DB 寫失敗就把剛丟上去的物件收回來，不要留孤兒物件在 R2。
    await deleteObjects([storageKey, thumbKey]).catch(() => {})
    throw error
  }
}

// 把「待附加」的圖片綁到剛建立的貼文上。
//
// WHERE 條件同時卡 uploadedBy 跟 post_id IS NULL：image id 是別人的、
// 或已經被綁到別的貼文上的，一律綁不動——不能靠前端只送自己的 id
// （見 CLAUDE.md：API 本身沒擋就等於沒擋）。
export async function attachImagesToPost(
  tx: { update: typeof db.update },
  postId: string,
  imageIds: string[],
  uploaderId: string
): Promise<void> {
  if (imageIds.length === 0) return
  if (imageIds.length > MAX_POST_IMAGES) throw new DiscussionError(`一則貼文最多 ${MAX_POST_IMAGES} 張圖`)

  const unique = [...new Set(imageIds)]
  let attached = 0
  for (const [position, imageId] of unique.entries()) {
    const rows = await tx
      .update(postImages)
      .set({ postId, position })
      .where(and(eq(postImages.id, imageId), eq(postImages.uploadedBy, uploaderId), isNull(postImages.postId)))
      .returning({ id: postImages.id })
    attached += rows.length
  }
  if (attached !== unique.length) throw new DiscussionError("有圖片已經失效，請重新上傳")
}

// 讀某些貼文的圖片，一次查完（列表渲染時是批次的，不能一則一次）。
export async function fetchImagesByPostIds(postIds: string[]): Promise<Map<string, PostImageDTO[]>> {
  if (postIds.length === 0) return new Map()

  const rows = await db
    .select()
    .from(postImages)
    .where(inArray(postImages.postId, postIds))
    .orderBy(postImages.position)

  const result = new Map<string, PostImageDTO[]>()
  for (const row of rows) {
    if (!row.postId) continue
    const list = result.get(row.postId) ?? []
    list.push(toImageDTO(row))
    result.set(row.postId, list)
  }
  return result
}

// 讀取端點要用的：拿 image id 換 R2 key，順便把它所屬的貼文帶出來給
// 呼叫端做權限檢查。
export async function getImageForRead(imageId: string) {
  const [row] = await db
    .select({
      storageKey: postImages.storageKey,
      thumbKey: postImages.thumbKey,
      contentType: postImages.contentType,
      postId: postImages.postId,
      uploadedBy: postImages.uploadedBy,
    })
    .from(postImages)
    .where(eq(postImages.id, imageId))
    .limit(1)
  return row ?? null
}

// 刪圖：R2 物件跟 DB 列一起清掉。
//
// 貼文本身是 soft delete（posts.deleted_at），但圖片不是——「刪除圖片也
// 要清掉 R2 資料」是明確的需求，留著檔案等於沒刪。R2 刪失敗時仍然把 DB
// 列刪掉並記錄錯誤：DB 留著一筆指向不存在物件的列，只會讓畫面出現一張
// 永遠載不出來的破圖。
async function purgeImageRows(rows: { id: string; storageKey: string; thumbKey: string }[]): Promise<void> {
  if (rows.length === 0) return
  const keys = rows.flatMap((row) => [row.storageKey, row.thumbKey])
  try {
    await deleteObjects(keys)
  } catch (error) {
    console.error("[discussion] R2 刪除失敗，DB 列仍然清除", error)
  }
  await db.delete(postImages).where(
    inArray(
      postImages.id,
      rows.map((row) => row.id)
    )
  )
}

// 一則貼文（含它所有子孫貼文，因為刪除是連帶的）的圖片全部清掉。
export async function deleteImagesForPost(postId: string): Promise<void> {
  const rows = await db
    .select({ id: postImages.id, storageKey: postImages.storageKey, thumbKey: postImages.thumbKey })
    .from(postImages)
    .where(eq(postImages.postId, postId))
  await purgeImageRows(rows)
}

// 使用者在編輯貼文時移除某幾張圖。只有貼文作者能移除自己貼文上的圖
// （跟 editReply 一樣：管理員不能代編他人的發言內容）。
export async function removeImagesFromPost(postId: string, imageIds: string[], actingUserId: string): Promise<void> {
  if (imageIds.length === 0) return

  const [post] = await db.select({ authorId: posts.authorId }).from(posts).where(eq(posts.id, postId)).limit(1)
  if (!post) throw new DiscussionError("找不到這則貼文")
  if (post.authorId !== actingUserId) throw new DiscussionError("沒有權限編輯這則貼文")

  const rows = await db
    .select({ id: postImages.id, storageKey: postImages.storageKey, thumbKey: postImages.thumbKey })
    .from(postImages)
    .where(and(eq(postImages.postId, postId), inArray(postImages.id, imageIds)))
  await purgeImageRows(rows)
}

// 使用者上傳了圖但最後沒送出貼文（關掉編輯器、換頁、當掉）——這些列
// 永遠不會被綁上 postId，要定期回收，不然 R2 會慢慢長出一堆沒人看的檔案。
// 由上傳端點順手觸發（見 app/api/discussion/images/route.ts），不需要另外
// 排程：會產生孤兒的人就是會上傳的人。
export async function sweepOrphanImages(): Promise<void> {
  const cutoff = new Date(Date.now() - IMAGE_ORPHAN_TTL_MS)
  const rows = await db
    .select({ id: postImages.id, storageKey: postImages.storageKey, thumbKey: postImages.thumbKey })
    .from(postImages)
    .where(and(isNull(postImages.postId), lt(postImages.createdAt, cutoff)))
    .limit(100)
  await purgeImageRows(rows)
}

// 使用者自己按叉叉移除還沒送出的圖：立刻連 R2 一起清掉，不用等孤兒回收。
export async function discardPendingImage(imageId: string, uploaderId: string): Promise<void> {
  const rows = await db
    .select({ id: postImages.id, storageKey: postImages.storageKey, thumbKey: postImages.thumbKey })
    .from(postImages)
    .where(and(eq(postImages.id, imageId), eq(postImages.uploadedBy, uploaderId), isNull(postImages.postId)))
  await purgeImageRows(rows)
}
