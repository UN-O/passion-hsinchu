import { getActiveStories } from "@/lib/instagram-stories"

// 官方帳號目前沒有限時動態、或還沒設定 IG_ACCESS_TOKEN／IG_BUSINESS_ACCOUNT_ID
// 時，getActiveStories() 一律回傳空陣列，這裡就顯示這行文字，不特別區分兩種情況
// （對使用者來說看起來一樣，都是「現在沒有東西可看」）。
export async function IgStoriesSection() {
  const stories = await getActiveStories()

  if (stories.length === 0) {
    return <p className="text-base text-muted-foreground">目前沒有限時動態。</p>
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {stories.map((story) => (
        <a
          key={story.id}
          href={story.permalink}
          target="_blank"
          rel="noreferrer"
          className="aspect-[9/16] w-24 shrink-0 overflow-hidden rounded-2xl border border-border bg-muted/40 sm:w-28"
        >
          {story.mediaType === "VIDEO" ? (
            <video src={story.mediaUrl} muted playsInline preload="metadata" className="size-full object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- 動態外部網址（IG CDN），next/image 優化不到
            <img src={story.mediaUrl} alt="限時動態" className="size-full object-cover" />
          )}
        </a>
      ))}
    </div>
  )
}
