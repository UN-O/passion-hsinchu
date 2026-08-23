"use client"

import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import { removeIgStory } from "./actions"
import { emptyDelete } from "./state"

export function StoryRow({
  id,
  image,
  uploadedByName,
  uploadedAtLabel,
}: {
  id: string
  image: string
  uploadedByName: string
  uploadedAtLabel: string
}) {
  const [state, action, pending] = useActionState(removeIgStory, emptyDelete)

  return (
    <div className="flex items-center gap-4 border-b border-border pb-4">
      {/* 縮圖走跟前台一樣的認證讀取端點，不是公開網址。 */}
      {/* eslint-disable-next-line @next/next/no-img-element -- 讀取端點回來的圖，next/image 優化不到 */}
      <img
        src={image}
        alt="限動截圖"
        className="h-24 w-14 shrink-0 rounded-lg border border-border object-cover"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-sm">{uploadedAtLabel}</p>
        <p className="text-sm text-muted-foreground">{uploadedByName}</p>
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      </div>

      <form action={action}>
        <input type="hidden" name="id" value={id} />
        <Button type="submit" size="sm" variant="destructive" disabled={pending}>
          {pending ? "刪除中…" : "刪除"}
        </Button>
      </form>
    </div>
  )
}
