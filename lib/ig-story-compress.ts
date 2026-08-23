// IG 限動截圖的瀏覽器端處理：等比例縮到長邊 1600、轉 WebP。
//
// 跟 lib/avatar-compress.ts 分開的理由是那邊的規則不適用這裡——頭像一定要
// 裁成正方形，限動截圖是直式 9:16（見 ig-stories-section.tsx 的
// aspect-[9/16]），裁切會把畫面切掉，這裡只能等比例縮小，不裁切。

const MAX_EDGE = 1600
const TARGET_BYTES = 350 * 1024

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

  const scale = Math.min(1, MAX_EDGE / Math.max(width, height))
  const outWidth = Math.max(1, Math.round(width * scale))
  const outHeight = Math.max(1, Math.round(height * scale))

  const canvas = document.createElement("canvas")
  canvas.width = outWidth
  canvas.height = outHeight
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("這個瀏覽器不支援圖片壓縮")
  ctx.drawImage(source, 0, 0, outWidth, outHeight)
  if ("close" in source) source.close()

  const toBlob = (quality: number) =>
    new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("圖片壓縮失敗"))), "image/webp", quality)
    })

  let quality = 0.85
  let blob = await toBlob(quality)
  // canvas 不支援 WebP 編碼時規格規定它默默退回 PNG。伺服器只收 WebP
  // （檔頭會驗），所以這裡就直接說清楚，不要送一個一定會被退回的檔案。
  if (blob.type !== "image/webp") throw new Error("這個瀏覽器不支援 WebP，請換一個瀏覽器上傳")

  while (blob.size > TARGET_BYTES && quality > 0.5) {
    quality -= 0.15
    blob = await toBlob(quality)
  }
  return blob
}
