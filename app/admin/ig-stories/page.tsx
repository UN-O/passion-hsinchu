import { listActiveIgStoriesForAdmin } from "@/lib/instagram-stories"
import { requireStaff } from "@/lib/session"
import { IgStoryUploadForm } from "./upload-form"
import { StoryRow } from "./story-row"

// 記錄列表要照時間排，時區固定用台北，不要用瀏覽器的（跟 /admin/points 同一套）。
const timeFormatter = new Intl.DateTimeFormat("zh-TW", {
  timeZone: "Asia/Taipei",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
})

export default async function AdminIgStoriesPage() {
  // layout 也擋了一層，但權限檢查要放在讀資料的地方，不要只靠上層 layout。
  await requireStaff()

  const stories = await listActiveIgStoriesForAdmin()

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">IG 限動上傳</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        上傳的截圖會顯示在 CAMP 首頁的「官方 IG 限時動態」，跟真正的限動一樣，24 小時後自動下架，不用手動清除。
      </p>

      <section className="mt-12">
        <IgStoryUploadForm />
      </section>

      <section className="mt-16">
        <h2 className="font-heading text-lg font-bold">
          目前顯示中 <span className="text-muted-foreground">（{stories.length}）</span>
        </h2>

        {stories.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">還沒有上傳任何限動。</p>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            {stories.map((story) => (
              <StoryRow
                key={story.id}
                id={story.id}
                image={story.image}
                uploadedByName={story.uploadedByName}
                uploadedAtLabel={timeFormatter.format(new Date(story.uploadedAt))}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
