export const CAMP_STEPS = ["welcome", "quiz", "result", "onboarding", "zones"] as const
export type CampStep = (typeof CAMP_STEPS)[number]

export function resolveCampStep(slug: string[] | undefined): CampStep | null {
  if (!slug || slug.length === 0) return "welcome"
  if (slug.length > 1) return null
  return (CAMP_STEPS as readonly string[]).includes(slug[0]) ? (slug[0] as CampStep) : null
}

export function campStepFromPath(path: string): CampStep {
  const segment = path.split("/").pop()
  return (CAMP_STEPS as readonly string[]).includes(segment ?? "") ? (segment as CampStep) : "welcome"
}

export const CONFERENCE_STEPS = ["welcome", "heart-select", "verse-and-prayer", "onboarding"] as const
export type ConferenceStep = (typeof CONFERENCE_STEPS)[number]

export function resolveConferenceStep(slug: string[] | undefined): ConferenceStep | null {
  if (!slug || slug.length === 0) return "welcome"
  if (slug.length > 1) return null
  return (CONFERENCE_STEPS as readonly string[]).includes(slug[0]) ? (slug[0] as ConferenceStep) : null
}

export function conferenceStepFromPath(path: string): ConferenceStep {
  const segment = path.split("/").pop()
  return (CONFERENCE_STEPS as readonly string[]).includes(segment ?? "")
    ? (segment as ConferenceStep)
    : "welcome"
}
