import { redirect } from "next/navigation"

import { getNextConferenceSession } from "@/lib/opening-conference-content"

export default function ConferenceMeetingPlaygroundIndexPage() {
  redirect(`/playground/conference-meeting/${getNextConferenceSession().id}`)
}
