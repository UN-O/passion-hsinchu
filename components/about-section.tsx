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
            斷。最後一句「在我們還不理解祂的計劃時，祂已成就了一切。」
            原本想交給 text-wrap:pretty 在窄螢幕自己找斷點，但實測 iOS
            Safari 跟這裡測試用的 Chromium 斷法不一樣——Safari 真機上會
            斷成「…她已成就了一」／「切。」，切。單獨孤行（使用者截圖
            回報），pretty 不可靠。改成 sm 以下也用 <br> 強制斷在逗號後，
            sm 以上藏起來維持一行（桌機寬度夠，不需要再斷）。 */}
        <p className={`${genRyuMin.className} mt-6 text-lg leading-relaxed sm:text-xl`}>
          五年，一場屬於新竹地區的營會。
          <br />
          當我們回望所踏的每一步路時，
          <br />
          看見上帝親自顯明了對世代的心意，
          <br />
          在我們還不理解祂的計劃時，
          <br className="sm:hidden" />
          祂已成就了一切。
        </p>
        <p className={`${genRyuMin.className} mt-10 text-lg font-medium sm:text-xl`}>
          2026，我們將持續回應祂的心意。
        </p>
      </div>
    </section>
  )
}
