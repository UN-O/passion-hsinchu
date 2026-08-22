"use server"

import { unstable_rethrow } from "next/navigation"

import { requireClaimedSession } from "@/lib/session"
import { removeAvatar, updateHeroName } from "@/lib/profile"

// 個人資料頁的 server actions。跟 lib/discussion/actions.ts 一樣：每一支都
// 自己驗 session，而且一律只能改「自己的」——userId 取自 session，不從
// 參數讀。
type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string }

function toResult<T>(promise: Promise<T>): Promise<ActionResult<T>> {
  return promise
    .then((data) => ({ ok: true as const, data }))
    .catch((error: unknown) => {
      unstable_rethrow(error)
      return { ok: false as const, error: error instanceof Error ? error.message : "操作失敗，請稍後再試" }
    })
}

export async function saveHeroName(name: string): Promise<ActionResult<string>> {
  return toResult(
    (async () => {
      const session = await requireClaimedSession()
      return updateHeroName(session.user.id, name)
    })()
  )
}

export async function clearAvatar(): Promise<ActionResult<null>> {
  return toResult(
    (async () => {
      const session = await requireClaimedSession()
      await removeAvatar(session.user.id)
      return null
    })()
  )
}
