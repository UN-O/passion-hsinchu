import { genRyuMin } from "@/app/fonts/gen-ryu-min"

export function AboutSection() {
  return (
    <section id="about" className="border-t border-border px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-sm font-semibold tracking-[0.2em] text-primary">關於 PASSION</h2>
        {/* 這裡不套 w-[min(74%,28rem)] 那套慣例：那是給短句（例如經文、
            禱告文單行標題）用的，這段介紹文句子比較長，74% 寬度在窄螢幕上
            反而擠出很多只有兩三個字的孤行（例如「五年，」「意，」自己
            斷成一行），看起來像句子被硬切開。改成用滿版寬度（沿用外層
            max-w-2xl 容器本身的寬度），交給 body 上已經全站套用的
            text-wrap:pretty（見 globals.css）決定斷行點；沒有寬度限制時
            pretty 有更多空間找到不切在標點符號中間的斷法。 */}
        <p className={`${genRyuMin.className} mt-6 text-lg leading-relaxed sm:text-xl`}>
          五年，一場屬於新竹地區的營會。
          <br />
          當我們回望所踏的每一步路時，看見上帝親自顯明了對世代的心意，
          在我們還不理解祂的計劃時，祂已成就了一切。
        </p>
        <p className={`${genRyuMin.className} mt-10 text-lg font-medium sm:text-xl`}>
          2026，我們將持續回應祂的心意。
        </p>
      </div>
    </section>
  )
}
