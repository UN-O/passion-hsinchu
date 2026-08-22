import { DeleteObjectsCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"

// Cloudflare R2 的 S3 相容介面。bucket 是私有的：這個檔案是唯一會拿到
// 金鑰的地方，前端永遠拿不到任何可以直接存取 R2 的網址（見 CLAUDE.md
// 資安規則：「知道連結就能存取的網址」本身就是一把不用密碼的鑰匙）。
//
// 環境變數在模組載入時不檢查、而是在真的要用的時候才檢查——沒設定 R2 的
// 開發環境（例如只想跑 lint／typecheck，或本機沒有金鑰）不應該因為
// import 到這個檔案就整個炸掉。

let cached: { client: S3Client; bucket: string } | null = null

function r2(): { client: S3Client; bucket: string } {
  if (cached) return cached

  const endpoint = process.env.R2_ENDPOINT
  const bucket = process.env.R2_BUCKET
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error("缺少 R2 設定（R2_ENDPOINT／R2_BUCKET／R2_ACCESS_KEY_ID／R2_SECRET_ACCESS_KEY），請參考 .env.example")
  }

  cached = {
    // R2 沒有 region 的概念，但 SigV4 一定要有一個值，官方文件指定 "auto"。
    client: new S3Client({
      region: "auto",
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    }),
    bucket,
  }
  return cached
}

export async function putObject(key: string, body: Uint8Array, contentType: string): Promise<void> {
  const { client, bucket } = r2()
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      // 圖片內容不可變（每次上傳都是新的 key），可以讓瀏覽器長時間快取；
      // private 是因為讀取端點會驗身分，中間的共用快取不可以留一份。
      CacheControl: "private, max-age=31536000, immutable",
    })
  )
}

export async function getObject(key: string): Promise<{ body: ReadableStream; contentType: string | null; contentLength: number | null } | null> {
  const { client, bucket } = r2()
  try {
    const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
    if (!result.Body) return null
    return {
      body: result.Body.transformToWebStream(),
      contentType: result.ContentType ?? null,
      contentLength: result.ContentLength ?? null,
    }
  } catch (error) {
    // 物件不存在（例如 R2 那邊已經被刪掉、DB 還沒同步）當成找不到，不是 500。
    if (isNotFound(error)) return null
    throw error
  }
}

// 一次刪多個 key。刪除是「盡力而為」：R2 回錯不該讓刪貼文整個失敗，
// 呼叫端會把錯誤記下來但繼續（見 lib/discussion/images.ts）。
export async function deleteObjects(keys: string[]): Promise<void> {
  if (keys.length === 0) return
  const { client, bucket } = r2()
  // DeleteObjects 一次最多 1000 個 key。
  for (let i = 0; i < keys.length; i += 1000) {
    const batch = keys.slice(i, i + 1000)
    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true },
      })
    )
  }
}

function isNotFound(error: unknown): boolean {
  if (!error || typeof error !== "object") return false
  const name = (error as { name?: string }).name
  const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode
  return name === "NoSuchKey" || name === "NotFound" || status === 404
}
