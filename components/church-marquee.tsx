import { partnerChurches } from "@/lib/site-config"

// 寫死的清單，不查資料庫 —— 首頁是公開頁面，每次造訪都查一次是不必要的額度消耗。
export function ChurchMarquee() {
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
