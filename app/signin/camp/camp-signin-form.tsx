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
import { campSignIn, type SigninState } from "../actions"

const initialState: SigninState = { error: null }

export function CampSigninForm({ churches }: { churches: string[] }) {
  const [state, formAction, isPending] = useActionState(campSignIn, initialState)
  const [church, setChurch] = useState("")
  const [name, setName] = useState("")

  const canSubmit = church !== "" && name.trim() !== ""

  if (churches.length === 0) {
    return (
      <p className="mt-8 text-sm text-muted-foreground">
        名冊尚未匯入，請洽現場工作人員。
      </p>
    )
  }

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-5">
      <input type="hidden" name="church" value={church} />

      <div className="flex flex-col gap-2">
        <label className="text-sm text-muted-foreground" htmlFor="church-trigger">
          教會
        </label>
        <Select value={church} onValueChange={setChurch}>
          <SelectTrigger id="church-trigger" className="w-full">
            <SelectValue placeholder="選擇你的教會" />
          </SelectTrigger>
          <SelectContent>
            {churches.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm text-muted-foreground" htmlFor="name">
          姓名
        </label>
        <p className="text-xs text-muted-foreground">請填寫報名表單上填寫的完整姓名</p>
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
        {isPending ? "報到中…" : "開始"}
      </Button>
    </form>
  )
}
