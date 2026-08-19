"use server"

import { redirect } from "next/navigation"

import { getAppSession, markFlowComplete, type Flow } from "@/lib/session"

export async function completeOpening(formData: FormData) {
  const session = await getAppSession()
  if (!session) redirect("/signin")

  const flow = String(formData.get("flow") ?? "")
  if (flow !== "camp" && flow !== "conference") redirect("/")

  const rawPayload = formData.get("payload")
  let payload: unknown
  if (typeof rawPayload === "string" && rawPayload.length > 0) {
    try {
      payload = JSON.parse(rawPayload)
    } catch {
      payload = undefined
    }
  }

  await markFlowComplete(session.user.id, flow as Flow, payload)
  redirect("/")
}
