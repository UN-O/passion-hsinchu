"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { camp, conference, heroSwitchDate } from "@/lib/site-config"

export function HeroCta() {
  const [showSplitCta, setShowSplitCta] = useState(false)

  useEffect(() => {
    setShowSplitCta(new Date() >= new Date(heroSwitchDate))
  }, [])

  if (showSplitCta) {
    return (
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        {/* TODO: 營會期間應改連到參加者入口網站，目前先導向報名表單 */}
        <Button asChild size="xl" className="w-full sm:w-auto">
          <Link href={camp.formUrl} target="_blank" rel="noopener noreferrer">
            進入 CAMP
          </Link>
        </Button>
        <Button asChild size="xl" variant="secondary" className="w-full sm:w-auto">
          <Link href={conference.formUrl} target="_blank" rel="noopener noreferrer">
            進入 Conference
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <Button asChild size="xl" className="w-full sm:w-auto">
      <Link href="#register">立即報名</Link>
    </Button>
  )
}
