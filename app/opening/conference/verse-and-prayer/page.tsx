import { redirect } from "next/navigation"
import { getSession } from "@/lib/fake-session"
import { VersePrayerScreen } from "./verse-prayer-screen"

export default async function VerseAndPrayerPage() {
  const session = await getSession()
  if (!session) {
    redirect("/signin")
  }

  return <VersePrayerScreen name={session.name} />
}
