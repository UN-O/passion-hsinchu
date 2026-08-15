import { listPartnerChurches } from "@/lib/enrollment"

export async function ChurchMarquee() {
  // 名冊上真的有人報名的教會，不是寫死的清單
  const partnerChurches = await listPartnerChurches()

  // 名冊還沒匯入時整段不顯示，免得跑出一條空的跑馬燈
  if (partnerChurches.length === 0) return null

  return (
    <section aria-label="聯名教會" className="border-t border-border bg-card py-10">
      <h2 className="px-4 text-center text-sm font-semibold tracking-[0.2em] text-primary sm:px-6">
        聯名教會
      </h2>

      <div className="mt-6 overflow-hidden">
        <div className="flex w-max animate-[marquee_30s_linear_infinite] motion-reduce:animate-none">
          {[0, 1].map((copy) => (
            <ul
              key={copy}
              aria-hidden={copy === 1}
              className="flex shrink-0 items-center gap-8 pr-8 text-base font-medium text-muted-foreground sm:text-lg"
            >
              {partnerChurches.map((church) => (
                <li key={church} className="flex items-center gap-8 whitespace-nowrap">
                  {church}
                  <span className="text-border">•</span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  )
}
