"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ImagePlus, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { MAX_POST_IMAGES } from "@/lib/discussion/constants"
import type { PostImageDTO } from "@/lib/discussion/dto"
import { compressImage } from "@/lib/discussion/image-compress"
import { discardImage } from "@/lib/discussion/actions"

// 編輯器裡的附圖區。三個階段各自有畫面，使用者永遠知道現在卡在哪一步：
//   compressing — 縮圖／轉檔（在 Worker 裡做，主執行緒不會卡）
//   uploading   — 上傳到站上的端點，端點再寫進 R2
//   ready       — 拿到 image id，可以送出貼文了
//
// 預覽用的是原始檔案的 object URL，選完圖就馬上看得到——不用等壓縮或上傳
// 完成，那兩件事只是在同一張圖上面蓋一層進度。

type Attachment = {
  localId: string
  previewUrl: string
  status: "compressing" | "uploading" | "ready" | "error"
  // 上傳完成後由伺服器回來的那筆（含讀取路徑跟尺寸）。網址一律由伺服器
  // 給，前端不自己拼——讀取路徑長什麼樣是 API 那邊的事。
  image: PostImageDTO | null
  error: string | null
}

export type ImageAttachmentsController = {
  items: Attachment[]
  readyImages: PostImageDTO[]
  busy: boolean
  canAddMore: boolean
  addFiles: (files: FileList | File[]) => void
  remove: (localId: string) => void
  // 取消發文時把已經上傳的圖片一起清掉（含 R2 上的檔案），不要留孤兒。
  discardAll: () => void
}

export function useImageAttachments(): ImageAttachmentsController {
  const [items, setItems] = useState<Attachment[]>([])
  // 卸載時要撤銷所有 object URL，但 cleanup 不該依賴 items（會變成每次
  // 新增圖片都跑一次清理），所以用 ref 保存目前這批。同一個 ref 也拿來
  // 算「還能再加幾張」——不能在 setItems 的 updater 裡算，updater 必須是
  // 純函式（React 會重複呼叫它），把上傳這種副作用寫進去會傳兩次。
  const itemsRef = useRef<Attachment[]>([])

  useEffect(() => {
    const current = itemsRef.current
    return () => {
      for (const item of current) URL.revokeObjectURL(item.previewUrl)
    }
  }, [])

  const patch = useCallback((localId: string, changes: Partial<Attachment>) => {
    itemsRef.current = itemsRef.current.map((item) => (item.localId === localId ? { ...item, ...changes } : item))
    setItems(itemsRef.current)
  }, [])

  const addFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList).filter((file) => file.type.startsWith("image/"))
      if (files.length === 0) return

      const room = Math.max(0, MAX_POST_IMAGES - itemsRef.current.length)
      const accepted = files.slice(0, room)
      if (accepted.length === 0) return

      const added: Attachment[] = accepted.map((file) => ({
        localId: crypto.randomUUID(),
        previewUrl: URL.createObjectURL(file),
        status: "compressing",
        image: null,
        error: null,
      }))

      itemsRef.current = [...itemsRef.current, ...added]
      setItems(itemsRef.current)

      // 每張圖各自跑自己的「壓縮 → 上傳」，互不等待：先壓好的先上傳，
      // 其中一張失敗也不影響其他張。
      accepted.forEach((file, index) => void process(file, added[index].localId))

      async function process(file: File, localId: string) {
        try {
          const compressed = await compressImage(file)
          // 壓縮期間被使用者按掉的話就不要再上傳了。
          if (!itemsRef.current.some((item) => item.localId === localId)) return
          patch(localId, { status: "uploading" })

          const form = new FormData()
          const ext = compressed.type === "image/webp" ? "webp" : "jpg"
          form.append("full", compressed.full, `image.${ext}`)
          form.append("thumb", compressed.thumb, `thumb.${ext}`)
          form.append("width", String(compressed.width))
          form.append("height", String(compressed.height))

          const response = await fetch("/api/discussion/images", { method: "POST", body: form })
          const payload = (await response.json()) as { ok: true; image: PostImageDTO } | { ok: false; error: string }

          if (!response.ok || !payload.ok) {
            patch(localId, { status: "error", error: payload.ok ? "上傳失敗" : payload.error })
            return
          }

          // 上傳途中被按掉：DB 裡已經有一筆待附加的圖了，直接清掉（含 R2）。
          if (!itemsRef.current.some((item) => item.localId === localId)) {
            void discardImage(payload.image.id)
            return
          }
          patch(localId, { status: "ready", image: payload.image })
        } catch {
          patch(localId, { status: "error", error: "圖片處理失敗" })
        }
      }
    },
    [patch]
  )

  const remove = useCallback((localId: string) => {
    const target = itemsRef.current.find((item) => item.localId === localId)
    if (!target) return
    URL.revokeObjectURL(target.previewUrl)
    // 已經上傳的要連 R2 的檔案一起刪，不然使用者按了叉叉、檔案卻還在。
    if (target.image) void discardImage(target.image.id)
    itemsRef.current = itemsRef.current.filter((item) => item.localId !== localId)
    setItems(itemsRef.current)
  }, [])

  const discardAll = useCallback(() => {
    for (const item of itemsRef.current) {
      URL.revokeObjectURL(item.previewUrl)
      if (item.image) void discardImage(item.image.id)
    }
    itemsRef.current = []
    setItems(itemsRef.current)
  }, [])

  return {
    items,
    readyImages: items.flatMap((item) => (item.status === "ready" && item.image ? [item.image] : [])),
    // 還在壓縮或上傳中就不讓送出——貼文送出時圖片必須已經有 id。
    busy: items.some((item) => item.status === "compressing" || item.status === "uploading"),
    canAddMore: items.length < MAX_POST_IMAGES,
    addFiles,
    remove,
    discardAll,
  }
}

// 「加入圖片」的按鈕（含隱藏的檔案選擇器）。放在編輯器的 header，跟送出
// 同一排——它跟投票一樣是「這篇貼文最終長怎樣」的決定。
export function AddImagesButton({
  controller,
  disabled,
}: {
  controller: ImageAttachmentsController
  disabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          if (event.target.files) controller.addFiles(event.target.files)
          // 清掉 value，同一個檔案連選兩次也會觸發 change。
          event.target.value = ""
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || !controller.canAddMore}
        aria-label={controller.canAddMore ? "加入圖片" : `最多 ${MAX_POST_IMAGES} 張圖`}
        className="text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ImagePlus className="size-5" strokeWidth={1.75} />
      </button>
    </>
  )
}

// 已選圖片的橫向清單。壓縮／上傳中的圖蓋一層半透明的底＋脈動的骨架條，
// 完成之後那層就消失——不是另外一顆轉圈圈的 spinner，位置跟大小從頭到尾
// 都一樣，畫面不會跳。
export function AttachmentStrip({ controller }: { controller: ImageAttachmentsController }) {
  if (controller.items.length === 0) return null

  return (
    <div className="flex shrink-0 gap-2 overflow-x-auto pb-1">
      {controller.items.map((item) => (
        <div
          key={item.localId}
          className={cn(
            "relative size-24 shrink-0 overflow-hidden rounded-2xl border border-border bg-muted",
            item.status === "error" && "border-destructive"
          )}
        >
          {/* 預覽是本機檔案的 object URL，不是遠端圖片，next/image 幫不上忙 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.previewUrl} alt="" className="size-full object-cover" />

          {(item.status === "compressing" || item.status === "uploading") && (
            <div className="absolute inset-0 flex flex-col justify-end gap-1 bg-background/70 p-2">
              <div className="h-1 w-full animate-pulse rounded-full bg-muted-foreground/40" />
              <span className="text-[11px] text-muted-foreground">
                {item.status === "compressing" ? "壓縮中" : "上傳中"}
              </span>
            </div>
          )}

          {item.status === "error" && (
            <div className="absolute inset-0 flex items-end bg-background/70 p-2">
              <span className="text-[11px] text-destructive">{item.error ?? "失敗"}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => controller.remove(item.localId)}
            aria-label="移除這張圖"
            className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full border border-border bg-background/90 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
