import { createAuthClient } from "better-auth/react"
import { inferAdditionalFields } from "better-auth/client/plugins"

import type { auth } from "./auth"

export const authClient = createAuthClient({
  // 讓 client 端也認得 user 上的 role / enrollmentId
  plugins: [inferAdditionalFields<typeof auth>()],
})

export const { signIn, signOut, useSession } = authClient
