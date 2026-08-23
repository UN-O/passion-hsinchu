// IG 限動截圖的瀏覽器端處理：保留原始解析度，只轉檔（WebP，不支援時退回
// JPEG）不裁切、不縮小、不為了壓到某個檔案大小而降畫質——這些是官方截圖，
// 前台會放大顯示，畫質比檔案大小重要，跟大頭貼／討論區附圖那種使用者
// 隨手拍、要顧到手機網路流量的圖不是同一回事。
//
// 跟 lib/avatar-compress.ts 分開的理由是那邊的規則不適用這裡——頭像一定要
// 裁成正方形，限動截圖是直式 9:16（見 ig-stories-section.tsx 的
// aspect-[9/16]），裁切會把畫面切掉，這裡完全不裁切。

// 高畫質但不是 100——100 幾乎不比 95 大幾 KB 就換來明顯更大的檔案，
// 划不來。
const QUALITY = 0.95

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      // from-image：套用 EXIF 方向，不然手機直拍的截圖會躺著。
      return await createImageBitmap(file, { imageOrientation: "from-image" })
    } catch {
      try {
        return await createImageBitmap(file)
      } catch {
        /* 再往下退到 <img> */
      }
    }
  }

  const url = URL.createObjectURL(file)
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error("讀不到這個圖片檔"))
      image.src = url
    })
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }
}

export async function compressIgStory(file: File): Promise<Blob> {
  const source = await decode(file)
  const width = "naturalWidth" in source ? source.naturalWidth : source.width
  const height = "naturalHeight" in source ? source.naturalHeight : source.height
  if (!width || !height) throw new Error("讀不到這個圖片檔")

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("這個瀏覽器不支援圖片壓縮")
  ctx.drawImage(source, 0, 0, width, height)
  if ("close" in source) source.close()

  const toBlob = (type: string) =>
    new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("圖片壓縮失敗"))), type, QUALITY)
    })

  let type = "image/webp"
  let blob = await toBlob(type)
  // canvas 不支援 WebP 編碼時規格規定它默默退回 PNG（例如 iOS 上所有
  // 瀏覽器都是同一顆不支援 WebP 編碼的 WebKit）——照片存成 PNG 會比原圖
  // 還大，所以偵測到就改用 JPEG 重編一次，跟 lib/discussion/image-compress.ts
  // 同一套退路。
  if (blob.type !== type) {
    type = "image/jpeg"
    blob = await toBlob(type)
    if (blob.type !== type) throw new Error("這個瀏覽器不支援圖片壓縮")
  }
  return blob
}
