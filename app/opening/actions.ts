"use server"

import { redirect } from "next/navigation"

import { getAppSession, markFlowComplete, type Flow } from "@/lib/session"

export async function completeOpening(formData: FormData) {
  const session = await getAppSession()
  if (!session) redirect("/signin")

  const flow = String(formData.get("flow") ?? "")
  if (flow !== "camp" && flow !== "conference") redirect("/")

  await markFlowComplete(session.user.id, flow as Flow)
  redirect("/")
}
