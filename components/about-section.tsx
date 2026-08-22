import { genRyuMin } from "@/app/fonts/gen-ryu-min"

export function AboutSection() {
  return (
    <section id="about" className="border-t border-border px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-sm font-semibold tracking-[0.2em] text-primary">關於 PASSION</h2>
        {/* 不套 w-[min(74%,28rem)]：那是給短句（經文、禱告文單行標題）
            用的，這段介紹文句子比較長，74% 寬度在窄螢幕上會擠出很多
            兩三個字的孤行。改用滿版寬度（沿用外層 max-w-2xl 容器）。
            前三個逗號用使用者指定的斷句點強制換行，不管螢幕寬窄都這樣
            斷——pretty 是 best-effort heuristic，不保證每次都切在使用者
            想要的位置，這裡直接用 <br /> 精確對齊。最後一句「在我們還不
            理解祂的計劃時，祂已成就了一切。」比較長，不強制斷行，交給
            text-wrap:pretty（見 globals.css）在螢幕真的窄到放不下時自己
            找斷點，避免畫面被切到。 */}
        <p className={`${genRyuMin.className} mt-6 text-lg leading-relaxed sm:text-xl`}>
          五年，一場屬於新竹地區的營會。
          <br />
          當我們回望所踏的每一步路時，
          <br />
          看見上帝親自顯明了對世代的心意，
          <br />
          在我們還不理解祂的計劃時，祂已成就了一切。
        </p>
        <p className={`${genRyuMin.className} mt-10 text-lg font-medium sm:text-xl`}>
          2026，我們將持續回應祂的心意。
        </p>
      </div>
    </section>
  )
}
