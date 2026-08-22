"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Plus, X } from "lucide-react"

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
  // 這些圖已經被綁到貼文上了（送出／儲存成功），清掉本地狀態就好——
  // 不可以呼叫 discardAll，那會把剛存進貼文的圖從 R2 刪掉。
  clearLocal: () => void
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

  const clearLocal = useCallback(() => {
    for (const item of itemsRef.current) URL.revokeObjectURL(item.previewUrl)
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
    clearLocal,
  }
}

// 附圖編輯區。一排方格：已經在貼文上的圖、正在處理的圖，最後是一個圓角
// 方格的加號按鈕——「可以放圖片」這件事用一個看得到的空格子表達，比藏在
// header 的一顆 icon 明顯（發文、回覆、編輯 root 三個地方共用同一個元件）。
//
// existing 是已經存在於貼文上的圖（編輯時才有）；controller 管的是這次新
// 選、還沒綁上貼文的圖。兩種在畫面上長一樣，只是叉叉做的事不同：前者是
// 真的從貼文上刪掉（連 R2），後者是取消這次的上傳。
export function AttachmentEditor({
  controller,
  existing = [],
  onRemoveExisting,
  disabled,
}: {
  controller: ImageAttachmentsController
  existing?: PostImageDTO[]
  onRemoveExisting?: (imageId: string) => void
  disabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const total = existing.length + controller.items.length
  const canAddMore = total < MAX_POST_IMAGES

  return (
    <div className="flex shrink-0 flex-wrap gap-2">
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

      {existing.map((image) => (
        <Tile key={image.id} src={image.thumbUrl} onRemove={onRemoveExisting ? () => onRemoveExisting(image.id) : undefined} />
      ))}

      {controller.items.map((item) => (
        <Tile
          key={item.localId}
          src={item.previewUrl}
          onRemove={() => controller.remove(item.localId)}
          status={item.status}
          error={item.error}
        />
      ))}

      {canAddMore && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          aria-label="加入圖片"
          className="flex size-24 shrink-0 items-center justify-center rounded-2xl border border-border text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="size-6" strokeWidth={1.75} />
        </button>
      )}
    </div>
  )
}

// 一格圖片。壓縮／上傳中蓋一層半透明的底＋脈動的骨架條，完成之後那層就
// 消失——不是另外一顆轉圈圈的 spinner，格子的位置跟大小從頭到尾都一樣，
// 畫面不會跳。
function Tile({
  src,
  onRemove,
  status,
  error,
}: {
  src: string
  onRemove?: () => void
  status?: Attachment["status"]
  error?: string | null
}) {
  const busy = status === "compressing" || status === "uploading"

  return (
    <div
      className={cn(
        "relative size-24 shrink-0 overflow-hidden rounded-2xl border border-border bg-muted",
        status === "error" && "border-destructive"
      )}
    >
      {/* 預覽可能是本機檔案的 object URL，也可能是站上的讀取端點，
          兩種 next/image 都幫不上忙（專案本來就設定 images.unoptimized）。 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" loading="lazy" className="size-full object-cover" />

      {busy && (
        <div className="absolute inset-0 flex flex-col justify-end gap-1 bg-background/70 p-2">
          <div className="h-1 w-full animate-pulse rounded-full bg-muted-foreground/40" />
          <span className="text-[11px] text-muted-foreground">{status === "compressing" ? "壓縮中" : "上傳中"}</span>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex items-end bg-background/70 p-2">
          <span className="text-[11px] text-destructive">{error ?? "失敗"}</span>
        </div>
      )}

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="移除這張圖"
          className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full border border-border bg-background/90 text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}
