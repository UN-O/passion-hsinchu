import {
  IMAGE_MAX_EDGE,
  IMAGE_TARGET_BYTES,
  IMAGE_THUMB_MAX_EDGE,
  IMAGE_THUMB_TARGET_BYTES,
} from "./constants"

// 瀏覽器端的圖片壓縮。相機拍出來的原圖動輒 4~8MB，直接傳上去對手機網路
// 是災難，所以在送出之前先縮到長邊 1600px、轉成 WebP，並且逐步降畫質直到
// 檔案小於目標大小為止。同時再產一張 480px 的縮圖給列表用。
//
// 為什麼要開 Worker：encode 一張 4000x3000 的圖大約要幾十到上百毫秒，
// 一次選 10 張就是好幾秒。在主執行緒做的話輸入框會整個卡住（打字、捲動、
// 動畫全部停），這正是需求裡「不能卡住」要避免的。Worker 裡做的話主執行緒
// 只負責畫骨架跟進度。
//
// Worker 用 Blob URL 建立，不走打包器的 worker 入口——這樣不必為了一支
// 40 行的腳本去處理 bundler 設定，而且拿不到 Worker／OffscreenCanvas 的
// 環境（舊的 iOS Safari）可以無痛退回主執行緒版本。

export type CompressedImage = {
  full: Blob
  thumb: Blob
  width: number
  height: number
  type: string
}

// 縮放後的尺寸：長邊不超過 maxEdge，本來就比較小的圖不放大。
function fitSize(width: number, height: number, maxEdge: number): { width: number; height: number } {
  const longest = Math.max(width, height)
  if (longest <= maxEdge) return { width, height }
  const scale = maxEdge / longest
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

const WORKER_SOURCE = `
const fitSize = ${fitSize.toString()};

async function decode(file) {
  try {
    // from-image：讓瀏覽器套用 EXIF 方向，不然手機直拍的照片會躺著。
    return await createImageBitmap(file, { imageOrientation: "from-image" })
  } catch {
    return await createImageBitmap(file)
  }
}

async function encode(bitmap, maxEdge, targetBytes, startQuality) {
  const size = fitSize(bitmap.width, bitmap.height, maxEdge)
  const canvas = new OffscreenCanvas(size.width, size.height)
  const ctx = canvas.getContext("2d")
  ctx.drawImage(bitmap, 0, 0, size.width, size.height)

  let type = "image/webp"
  let blob = await canvas.convertToBlob({ type, quality: startQuality })
  // 這個瀏覽器的 canvas 不會編 WebP 時，規格規定它默默退回 PNG——照片
  // 存成 PNG 會比原圖還大，所以偵測到就改用 JPEG 重編一次。
  if (blob.type !== type) {
    type = "image/jpeg"
    blob = await canvas.convertToBlob({ type, quality: startQuality })
    if (blob.type !== type) throw new Error("這個瀏覽器不支援圖片壓縮")
  }

  // 還是太大就一路降畫質。降到 0.45 還不夠小就接受——再降畫質就會開始
  // 出現明顯色塊，寧可檔案大一點。
  let quality = startQuality
  while (blob.size > targetBytes && quality > 0.45) {
    quality -= 0.15
    blob = await canvas.convertToBlob({ type, quality })
  }
  return { blob, width: size.width, height: size.height }
}

self.onmessage = async (event) => {
  const { id, file, maxEdge, thumbEdge, targetBytes, thumbTargetBytes } = event.data
  try {
    const bitmap = await decode(file)
    const full = await encode(bitmap, maxEdge, targetBytes, 0.82)
    const thumb = await encode(bitmap, thumbEdge, thumbTargetBytes, 0.7)
    bitmap.close()
    self.postMessage({
      id,
      ok: true,
      full: full.blob,
      thumb: thumb.blob,
      width: full.width,
      height: full.height,
      type: full.blob.type,
    })
  } catch (error) {
    self.postMessage({ id, ok: false, error: error && error.message ? error.message : "圖片處理失敗" })
  }
}
`

type WorkerReply =
  | { id: number; ok: true; full: Blob; thumb: Blob; width: number; height: number; type: string }
  | { id: number; ok: false; error: string }

function canUseWorker(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof Worker !== "undefined" &&
    typeof OffscreenCanvas !== "undefined" &&
    typeof createImageBitmap !== "undefined"
  )
}

let workerHandle: { worker: Worker; url: string } | null = null
let nextJobId = 1
const pending = new Map<number, (reply: WorkerReply) => void>()

function getWorker(): Worker | null {
  if (workerHandle) return workerHandle.worker
  if (!canUseWorker()) return null
  try {
    const url = URL.createObjectURL(new Blob([WORKER_SOURCE], { type: "text/javascript" }))
    const worker = new Worker(url)
    worker.onmessage = (event: MessageEvent<WorkerReply>) => {
      const resolve = pending.get(event.data.id)
      if (resolve) {
        pending.delete(event.data.id)
        resolve(event.data)
      }
    }
    workerHandle = { worker, url }
    return worker
  } catch {
    return null
  }
}

// 主執行緒版本（沒有 Worker／OffscreenCanvas 的環境）。做的事情一樣，
// 只是會佔用主執行緒——所以呼叫端一次只處理一張，中間讓瀏覽器有機會
// 重繪骨架。
async function compressOnMainThread(file: File): Promise<CompressedImage> {
  const url = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error("讀不到這個圖片檔"))
      element.src = url
    })

    const draw = async (maxEdge: number, targetBytes: number, startQuality: number) => {
      const size = fitSize(image.naturalWidth, image.naturalHeight, maxEdge)
      const canvas = document.createElement("canvas")
      canvas.width = size.width
      canvas.height = size.height
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("這個瀏覽器不支援圖片壓縮")
      ctx.drawImage(image, 0, 0, size.width, size.height)

      const toBlob = (type: string, quality: number) =>
        new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("圖片壓縮失敗"))), type, quality)
        })

      let type = "image/webp"
      let blob = await toBlob(type, startQuality)
      if (blob.type !== type) {
        type = "image/jpeg"
        blob = await toBlob(type, startQuality)
        if (blob.type !== type) throw new Error("這個瀏覽器不支援圖片壓縮")
      }

      let quality = startQuality
      while (blob.size > targetBytes && quality > 0.45) {
        quality -= 0.15
        blob = await toBlob(type, quality)
      }
      return { blob, width: size.width, height: size.height }
    }

    const full = await draw(IMAGE_MAX_EDGE, IMAGE_TARGET_BYTES, 0.82)
    const thumb = await draw(IMAGE_THUMB_MAX_EDGE, IMAGE_THUMB_TARGET_BYTES, 0.7)
    return { full: full.blob, thumb: thumb.blob, width: full.width, height: full.height, type: full.blob.type }
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function compressImage(file: File): Promise<CompressedImage> {
  const worker = getWorker()
  if (!worker) return compressOnMainThread(file)

  const id = nextJobId++
  const reply = await new Promise<WorkerReply>((resolve) => {
    pending.set(id, resolve)
    worker.postMessage({
      id,
      file,
      maxEdge: IMAGE_MAX_EDGE,
      thumbEdge: IMAGE_THUMB_MAX_EDGE,
      targetBytes: IMAGE_TARGET_BYTES,
      thumbTargetBytes: IMAGE_THUMB_TARGET_BYTES,
    })
  })

  if (!reply.ok) throw new Error(reply.error)
  return { full: reply.full, thumb: reply.thumb, width: reply.width, height: reply.height, type: reply.type }
}
