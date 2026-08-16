import Link from "next/link"
import { Button } from "@/components/ui/button"
import { camp, conference, siteConfig, type Program } from "@/lib/site-config"

function ProgramCard({ id, program }: { id: string; program: Program }) {
  return (
    <div
      id={id}
      className="flex h-full flex-col justify-between gap-6 rounded-2xl border border-border bg-card p-6 sm:p-8"
    >
      <div className="flex flex-col gap-4">
        <span className="w-fit rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
          {program.label}
        </span>

        <h3 className="text-2xl font-bold text-balance sm:text-3xl">{program.name}</h3>
        <p className="text-sm text-muted-foreground sm:text-base">{program.audience}</p>

        <dl className="mt-2 grid gap-3 text-sm sm:text-base">
          <div className="flex flex-col gap-0.5">
            <dt className="text-muted-foreground">時間</dt>
            {program.durationLabel ? (
              <dd>
                <div className="overflow-hidden rounded-lg border border-border">
                  <p className="border-b border-border px-3 py-1.5 text-center text-xs text-muted-foreground">
                    {program.durationLabel}
                  </p>
                  <div className="grid grid-cols-2 divide-x divide-border">
                    <div className="flex flex-col gap-0.5 px-3 py-2">
                      <span className="text-xs text-muted-foreground">開始</span>
                      <span>{program.timeEntries[0]}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 px-3 py-2">
                      <span className="text-xs text-muted-foreground">結束</span>
                      <span>{program.timeEntries[1]}</span>
                    </div>
                  </div>
                </div>
              </dd>
            ) : (
              <dd>
                <ol className="flex flex-col gap-1.5 border-l border-border pl-3">
                  {program.timeEntries.map((entry) => (
                    <li key={entry}>{entry}</li>
                  ))}
                </ol>
              </dd>
            )}
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
      </div>

      <Button asChild size="xl" className="w-full sm:w-auto">
        <Link href={program.signInPath}>登入 {program.name.replace("PASSION ", "")}</Link>
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
