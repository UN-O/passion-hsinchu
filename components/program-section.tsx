import Link from "next/link"
import { Button } from "@/components/ui/button"
import { camp, conference, siteConfig } from "@/lib/site-config"

type Program = typeof camp

function ProgramCard({ id, program }: { id: string; program: Program }) {
  return (
    <div id={id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 sm:p-8">
      <span className="w-fit rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
        {program.label}
      </span>

      <h3 className="text-2xl font-bold sm:text-3xl">{program.name}</h3>
      <p className="text-sm text-muted-foreground sm:text-base">{program.audience}</p>

      <dl className="mt-2 grid gap-3 text-sm sm:text-base">
        <div className="flex flex-col gap-0.5">
          <dt className="text-muted-foreground">時間</dt>
          <dd>{program.timeLabel}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-muted-foreground">地點</dt>
          <dd>{siteConfig.venue}／{siteConfig.venueAddress}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-muted-foreground">費用</dt>
          <dd>{program.feeLabel}</dd>
          <dd className="text-xs text-muted-foreground">{program.feeNote}</dd>
        </div>
      </dl>

      <Button asChild size="xl" className="mt-2 w-full sm:w-auto">
        <Link href={program.formUrl} target="_blank" rel="noopener noreferrer">
          進入 {program.name.replace("PASSION ", "")}
        </Link>
      </Button>
    </div>
  )
}

export function ProgramSection() {
  return (
    <section id="register" className="border-t border-border px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center text-sm font-semibold tracking-[0.2em] text-primary">立即火熱報名</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <ProgramCard id="camp" program={camp} />
          <ProgramCard id="conference" program={conference} />
        </div>
      </div>
    </section>
  )
}
