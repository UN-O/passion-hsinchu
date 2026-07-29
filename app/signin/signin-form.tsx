"use client"

import { useActionState, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fakeChurches } from "@/lib/fake-attendees"
import { camp, conference } from "@/lib/site-config"
import { signIn, type SigninState } from "./actions"

const initialState: SigninState = { error: null }

export function SigninForm() {
  const [state, formAction, isPending] = useActionState(signIn, initialState)
  const [church, setChurch] = useState("")
  const [sessionType, setSessionType] = useState<"camp" | "conference" | "">("")
  const [name, setName] = useState("")

  const canSubmit = church !== "" && sessionType !== "" && name.trim() !== ""

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-5">
      <input type="hidden" name="church" value={church} />
      <input type="hidden" name="sessionType" value={sessionType} />

      <div className="flex flex-col gap-2">
        <label className="text-sm text-muted-foreground" htmlFor="church-trigger">
          教會
        </label>
        <Select value={church} onValueChange={setChurch}>
          <SelectTrigger id="church-trigger" className="w-full">
            <SelectValue placeholder="選擇你的教會" />
          </SelectTrigger>
          <SelectContent>
            {fakeChurches.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm text-muted-foreground" htmlFor="session-trigger">
          場次
        </label>
        <Select
          value={sessionType}
          onValueChange={(value) => setSessionType(value as "camp" | "conference")}
        >
          <SelectTrigger id="session-trigger" className="w-full">
            <SelectValue placeholder="選擇場次" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="camp">{camp.label}</SelectItem>
            <SelectItem value="conference">{conference.label}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm text-muted-foreground" htmlFor="name">
          姓名
        </label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="請輸入姓名"
          autoComplete="name"
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" size="lg" disabled={!canSubmit || isPending} className="mt-2">
        {isPending ? "簽到中…" : "開始"}
      </Button>
    </form>
  )
}
