"use server"

import { redirect } from "next/navigation"
import { markOpeningComplete } from "@/lib/fake-session"

export async function completeOpening() {
  await markOpeningComplete()
  redirect("/")
}
