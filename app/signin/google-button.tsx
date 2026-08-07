"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

export function GoogleButton({ callbackURL = "/signin/redirect" }: { callbackURL?: string }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        size="lg"
        disabled={pending}
        onClick={async () => {
          setPending(true)
          setError(null)
          const { error } = await authClient.signIn.social({ provider: "google", callbackURL })
          if (error) {
            setError("無法連線到 Google，請稍後再試")
            setPending(false)
          }
        }}
      >
        {pending ? "前往 Google…" : "用 Google 登入"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
