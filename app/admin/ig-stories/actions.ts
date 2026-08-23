"use server"

import { revalidatePath } from "next/cache"

import { deleteIgStory } from "@/lib/instagram-stories"
import { requireStaff } from "@/lib/session"
import { emptyDelete, type DeleteState } from "./state"

export async function removeIgStory(_prevState: DeleteState, formData: FormData): Promise<DeleteState> {
  await requireStaff()

  const id = String(formData.get("id") ?? "").trim()
  if (!id) return { ...emptyDelete, error: "找不到這筆記錄" }

  try {
    const deleted = await deleteIgStory(id)
    if (!deleted) return { ...emptyDelete, error: "這筆記錄已經不在了，請重新整理" }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { ...emptyDelete, error: `刪除失敗：${message}` }
  }

  // 上傳走 API route（見 app/api/ig-stories/route.ts），成功後前端自己
  // router.refresh()；刪除走這個 server action，要自己 revalidate 才會
  // 讓伺服器端的列表重新查一次。
  revalidatePath("/admin/ig-stories")
  return { error: null, message: "已刪除" }
}
