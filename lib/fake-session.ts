import { cookies } from "next/headers"

export const SESSION_COOKIE_NAME = "pc_session"

export type FakeSession = {
  church: string
  sessionType: "camp" | "conference"
  name: string
  hasCompletedOpening: boolean
}

export function parseSessionCookie(raw: string | undefined | null): FakeSession | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.church === "string" &&
      (parsed.sessionType === "camp" || parsed.sessionType === "conference") &&
      typeof parsed.name === "string" &&
      typeof parsed.hasCompletedOpening === "boolean"
    ) {
      return parsed as FakeSession
    }
    return null
  } catch {
    return null
  }
}

export async function getSession(): Promise<FakeSession | null> {
  const store = await cookies()
  return parseSessionCookie(store.get(SESSION_COOKIE_NAME)?.value)
}

export async function setSessionCookie(session: FakeSession) {
  const store = await cookies()
  store.set(SESSION_COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })
}

export async function markOpeningComplete() {
  const session = await getSession()
  if (!session) return
  await setSessionCookie({ ...session, hasCompletedOpening: true })
}

export async function clearSession() {
  const store = await cookies()
  store.delete(SESSION_COOKIE_NAME)
}
