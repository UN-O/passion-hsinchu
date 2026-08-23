import { randomUUID } from "node:crypto"
import { desc, eq, gt, inArray, lt } from "drizzle-orm"

import { db } from "@/db"
import { igStory } from "@/db/schema/app"
import { deleteObjects, putObject } from "@/lib/r2"

// 官方 IG 限時動態：後台 /admin/ig-stories 上傳（見 db/schema/app.ts 的
// ig_story 表說明），這裡負責前台顯示要用的查詢跟上傳/刪除的實際邏輯。
// 跟真正的 IG 限動一樣，每張圖從上傳時間起算 24 小時後自動下架，
// 不用手動清理（見 getActiveIgStories）。

export type IgStory = {
  id: string
  image: string
  uploadedAt: string
}

// 只有這個錯誤類別的 message 可以直接顯示給使用者——其他錯誤（例如 DB
// 驅動丟出的原始例外）可能夾帶內部細節，呼叫端要退回一句通用訊息，
// 跟討論區附圖的 DiscussionError 同一個理由。
export class IgStoryError extends Error {}

const STORY_TTL_MS = 24 * 60 * 60 * 1000

// 前台只需要「還在效期內的圖」；圖片本身走認證過的讀取端點
// （/api/ig-stories/[id]，bucket 是私有的，不會有任何人拿連結就能看到）。
export async function getActiveIgStories(now: Date = new Date()): Promise<IgStory[]> {
  const cutoff = new Date(now.getTime() - STORY_TTL_MS)
  const rows = await db
    .select({ id: igStory.id, createdAt: igStory.createdAt })
    .from(igStory)
    .where(gt(igStory.createdAt, cutoff))
    .orderBy(desc(igStory.createdAt))

  return rows.map((row) => ({
    id: row.id,
    image: `/api/ig-stories/${row.id}`,
    uploadedAt: row.createdAt.toISOString(),
  }))
}

export type AdminIgStory = {
  id: string
  image: string
  uploadedAt: string
  uploadedByName: string
}

// 後台管理列表：只列還在效期內的（過期的已經自動下架，沒有「補刪」的必要），
// 多帶上傳者姓名跟時間，方便工作人員確認是誰、什麼時候上傳的。
export async function listActiveIgStoriesForAdmin(now: Date = new Date()): Promise<AdminIgStory[]> {
  const cutoff = new Date(now.getTime() - STORY_TTL_MS)
  const rows = await db
    .select({ id: igStory.id, createdAt: igStory.createdAt, uploadedByName: igStory.uploadedByName })
    .from(igStory)
    .where(gt(igStory.createdAt, cutoff))
    .orderBy(desc(igStory.createdAt))

  return rows.map((row) => ({
    id: row.id,
    image: `/api/ig-stories/${row.id}`,
    uploadedAt: row.createdAt.toISOString(),
    uploadedByName: row.uploadedByName,
  }))
}

// 讀取端點要用的：拿 id 換 R2 key。
export async function getIgStoryForRead(id: string): Promise<{ storageKey: string; contentType: string } | null> {
  const [row] = await db
    .select({ storageKey: igStory.storageKey, contentType: igStory.contentType })
    .from(igStory)
    .where(eq(igStory.id, id))
    .limit(1)
  return row ?? null
}

// 前端不再縮小尺寸、不再為了壓到某個檔案大小而降畫質（見
// lib/ig-story-compress.ts），所以上限要跟著放寬——手機截圖原始解析度
// 轉存 webp／jpeg 常見落在 3~6MB。這條路只有工作人員能打（requireStaff），
// 不是公開端點，放寬上限不會被拿來灌爆 R2。
export const IG_STORY_MAX_UPLOAD_BYTES = 8 * 1024 * 1024

// 檔頭 magic bytes 檢查，跟大頭貼／討論區附圖同一套規則：宣稱的
// content-type 是前端寫的，不能拿來當真。webp 是主要格式；jpeg 是給
// canvas 不支援 webp 編碼的 iOS／舊 Safari 的退路（見 lib/ig-story-compress.ts）。
function sniffContentType(bytes: Uint8Array): "image/webp" | "image/jpeg" | null {
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
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg"
  return null
}

export type UploadIgStoryInput = {
  uploaderId: string
  uploaderName: string
  bytes: Uint8Array
}

// 上傳一張限動：先寫 R2，成功之後才寫 DB（順序反過來的話 DB 會留下一筆
// 指向不存在物件的列，跟討論區附圖同一個理由）。
export async function uploadIgStory(input: UploadIgStoryInput): Promise<{ id: string }> {
  if (input.bytes.byteLength === 0) throw new IgStoryError("圖片是空的")
  if (input.bytes.byteLength > IG_STORY_MAX_UPLOAD_BYTES) throw new IgStoryError("圖片太大了")
  const contentType = sniffContentType(input.bytes)
  if (!contentType) throw new IgStoryError("只接受 WebP 或 JPEG 圖片")

  const id = randomUUID()
  const ext = contentType === "image/webp" ? "webp" : "jpg"
  const storageKey = `ig-story/${id}.${ext}`
  await putObject(storageKey, input.bytes, contentType)

  try {
    await db.insert(igStory).values({
      id,
      storageKey,
      contentType,
      byteSize: input.bytes.byteLength,
      uploadedBy: input.uploaderId,
      uploadedByName: input.uploaderName,
    })
  } catch (error) {
    // DB 寫失敗就把剛丟上去的物件收回來，不要留孤兒物件在 R2。
    await deleteObjects([storageKey]).catch(() => {})
    throw error
  }

  return { id }
}

// 貼錯圖時工作人員手動刪除：R2 物件跟 DB 列一起清掉，不用等 24 小時。
export async function deleteIgStory(id: string): Promise<boolean> {
  const [row] = await db.select({ storageKey: igStory.storageKey }).from(igStory).where(eq(igStory.id, id)).limit(1)
  if (!row) return false

  await deleteObjects([row.storageKey]).catch((error) => {
    console.error("[ig-story] R2 刪除失敗，DB 列仍然清除", error)
  })
  await db.delete(igStory).where(eq(igStory.id, id))
  return true
}

// 已經過期超過一段時間的舊列一起清掉（R2 物件＋DB 列），避免 bucket
// 一直長出用不到的檔案。由上傳端點順手觸發（見 app/api/ig-stories/route.ts），
// 不需要另外排程——會產生新資料的人就是會上傳的人。多留 7 天寬限期，
// 純粹是保守：萬一 TTL 常數之後要調整，不希望舊資料已經被物理刪除。
const SWEEP_GRACE_MS = 7 * 24 * 60 * 60 * 1000

export async function sweepExpiredIgStories(): Promise<void> {
  const cutoff = new Date(Date.now() - STORY_TTL_MS - SWEEP_GRACE_MS)
  const rows = await db
    .select({ id: igStory.id, storageKey: igStory.storageKey })
    .from(igStory)
    .where(lt(igStory.createdAt, cutoff))
    .limit(100)
  if (rows.length === 0) return

  await deleteObjects(rows.map((row) => row.storageKey)).catch((error) => {
    console.error("[ig-story] 過期清除的 R2 刪除失敗，DB 列仍然清除", error)
  })
  await db.delete(igStory).where(
    inArray(
      igStory.id,
      rows.map((row) => row.id)
    )
  )
}
