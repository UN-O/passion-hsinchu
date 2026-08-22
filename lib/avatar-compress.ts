// 大頭貼的瀏覽器端處理：置中裁成正方形、縮到 512px、轉 WebP。
//
// 跟 lib/discussion/image-compress.ts 分開的理由是這裡的規則不一樣——頭像
// 一定要是正方形（畫面上是圓的），而且只有一張圖、沒有縮圖，用不到那邊的
// Worker 排程；一張圖的編碼在主執行緒大約幾十毫秒，看得到的只有按鈕上的
// 「處理中」。

export const AVATAR_SIZE = 512
const TARGET_BYTES = 160 * 1024

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      // from-image：套用 EXIF 方向，不然手機直拍的照片會躺著。
      return await createImageBitmap(file, { imageOrientation: "from-image" })
    } catch {
      // 某些瀏覽器不吃 options，退回沒有 options 的版本
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
    // 圖片已經 decode 完，物件網址可以立刻釋放
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }
}

export async function compressAvatar(file: File): Promise<Blob> {
  const source = await decode(file)
  const width = "naturalWidth" in source ? source.naturalWidth : source.width
  const height = "naturalHeight" in source ? source.naturalHeight : source.height
  if (!width || !height) throw new Error("讀不到這個圖片檔")

  // 置中裁切成正方形：取短邊，從中間切。
  const edge = Math.min(width, height)
  const sx = (width - edge) / 2
  const sy = (height - edge) / 2

  const canvas = document.createElement("canvas")
  canvas.width = AVATAR_SIZE
  canvas.height = AVATAR_SIZE
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("這個瀏覽器不支援圖片壓縮")
  ctx.drawImage(source, sx, sy, edge, edge, 0, 0, AVATAR_SIZE, AVATAR_SIZE)
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
