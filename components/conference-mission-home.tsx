"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Check, X } from "lucide-react"

import { ConferenceCountdown } from "@/components/conference-countdown"
import { ConferenceLiquidGlassFilter } from "@/components/conference-liquid-glass-filter"
import { LocationPinIcon } from "@/components/location-pin-icon"
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useDialogBackClose } from "@/hooks/use-dialog-back-close"
import {
  conferenceSessions,
  conferenceWorkshops,
  getConferenceSession,
  getConferenceWorkshop,
  getNextConferenceCountdownTarget,
  getNextConferenceSession,
  getRegisteredWorkshopRounds,
  workshopDateLabel,
  workshopRoundLabels,
  workshopRoundTimeLabels,
  type ConferenceSession,
} from "@/lib/opening-conference-content"
import { siteConfig } from "@/lib/site-config"

// 工作坊資訊欄的標題全部從第一個逗號後面換行，例如「預備自己成為對的人，
// 其實很需要勇氣！」變成兩行。沒有逗號（例如講員名字當標題的 fallback）
// 就照原樣單行顯示。
function breakAfterFirstComma(text: string) {
  const commaIndex = text.indexOf("，")
  if (commaIndex === -1) return text
  return (
    <>
      {text.slice(0, commaIndex + 1)}
      <br />
      {text.slice(commaIndex + 1)}
    </>
  )
}

// 聚會卡片（照片＋場次名稱，連去聚會內容頁對應場次）抽成獨立元件：工作坊
// 卡片列插在午場聚會跟 DAY2 晚場聚會中間（跟流程表順序一致：午場→
// 工作坊→晚場），不是三張卡片單純用 .map 連續排列，抽出來才不用複製貼上
// 同一段 Link 兩次。
function ConferenceSessionCard({ session, meetingHref }: { session: ConferenceSession; meetingHref: string }) {
  return (
    <Link
      href={`${meetingHref}/${session.id}`}
      className="relative mt-6 flex aspect-video w-full flex-col justify-end overflow-hidden rounded-3xl p-6"
    >
      <Image
        src={session.image}
        alt=""
        fill
        sizes="(min-width: 640px) 640px, 100vw"
        className="object-cover"
        style={{ objectPosition: "50% 30%" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <p className="relative z-10 text-sm text-white/80">
        {session.dateLabel}・{session.sessionLabel}
      </p>
      <p className="relative z-10 mt-2 text-2xl font-bold text-white">{session.typeLabel}</p>
    </Link>
  )
}

export function ConferenceMissionHome({
  meetingHref = "/conference/meeting",
}: {
  meetingHref?: string
} = {}) {
  const [activeWorkshopId, setActiveWorkshopId] = useState<string | null>(null)
  const activeWorkshop = activeWorkshopId ? getConferenceWorkshop(activeWorkshopId) : undefined
  // 報名通知要照場次顯示「已報名場次一」「已報名場次二」，不是單純顯示
  // 「已報名」，所以要知道具體報了哪幾場，不只是報名與否。
  const registeredRounds = activeWorkshop ? getRegisteredWorkshopRounds(activeWorkshop.id) : []
  // 三場聚會都各自顯示卡片，但彈窗仍然可能點到任何一張，所以用場次 id 記住
  // 點的是哪一張卡片，跟上面 activeWorkshopId 同一個做法。
  const [activeMeetingSessionId, setActiveMeetingSessionId] = useState<string | null>(null)
  const activeMeetingSession = activeMeetingSessionId ? getConferenceSession(activeMeetingSessionId) : undefined
  // 倒數計時只留一個、獨立放在最上面，不是每場聚會卡片各自一個：下一場還沒
  // 開始的聚會＋跟它相關的倒數目標（比「下一場聚會」更細，還包含工作坊場次）。
  const nextSession = getNextConferenceSession()
  const nextCountdownTarget = getNextConferenceCountdownTarget()

  // App 化之後，讓系統返回鍵／手勢可以先關掉彈窗，而不是直接離開頁面
  useDialogBackClose(activeWorkshop !== undefined, () => setActiveWorkshopId(null))
  useDialogBackClose(activeMeetingSession !== undefined, () => setActiveMeetingSessionId(null))

  return (
    <main className="relative z-0 min-h-svh bg-[#0458e2]">
      <ConferenceLiquidGlassFilter filterId="conf-liquid-glass-filter" />

      {/* 背景圖改用 fixed（不是 absolute）：不隨頁面捲動，捲動時內容從它
          上面滑過去，畫面上看起來像被往上滑走的是內容，不是背景本身，
          一路釘在原地直到被後面不透明的內容（工作坊卡片、聚會卡，最後
          是滿版的流程表圖）蓋過去才「消失」。position:fixed 是相對
          viewport 計算，不受 main 的 relative 影響；top-0 剛好對齊
          viewport 最頂端，跟 sticky 的 PASSION LOGO 列（同樣釘在
          viewport 頂端）疊在同一個位置，LOGO 列的不透明底色會自然蓋掉
          背景圖，所以背景圖不用另外算「從 LOGO 列下面開始」的偏移量，
          兩者都固定在 viewport 頂端、順序疊起來就是對的。背景圖只鋪
          一個螢幕高的範圍：圖片本身下緣已經漸層融合成跟 bg-[#0458e2]
          一樣的純藍色，蓋到 100svh 之後直接接回 main 本身的純色底，
          銜接處不會看出接縫。-z-10 讓背景圖蓋在 main 的純色底之上、
          後面正常排版的內容之下（main 一定要有 z-0，見下面 sticky 那段
          註解）。backgroundSize 刻意寫死 "auto 100%"（不是 cover）：
          cover 會依螢幕比例自己選裁切的軸，寬螢幕時反而會裁到上下；
          auto 100% 強制高度永遠等於容器高度（上下永遠滿版、不裁切），
          寬度依圖片比例等比縮放，比容器寬的部分才裁左右，比容器窄時
          兩側露出跟圖片色調很接近的純色底。圖片直接用原始解析度，沒有
          另外壓縮，避免裁到最寬的機型時因為放大而模糊。 */}
      <div
        className="fixed inset-x-0 top-0 -z-10 h-[100svh] bg-no-repeat"
        style={{
          backgroundImage: "url('/images/conference-background.webp')",
          backgroundSize: "auto 100%",
          backgroundPosition: "center",
        }}
        aria-hidden
      />

      {/* sticky 這條 PASSION LOGO 列的藍底刻意脫離 max-w-2xl 置中容器、
          左右貼齊螢幕邊緣（寬螢幕時才不會兩側露出背景照片，看起來像沒
          裁乾淨），LOGO 本身還是用內層 max-w-2xl + px 內距置中，尺寸跟
          位置維持原本樣子。上方額外加 env(safe-area-inset-top)：App 化後
          全螢幕沒有網址列，iPhone 瀏海／動態島或 Android 狀態列不然會直接
          疊在主視覺上面。z-20（比下面聚會卡片文字的 z-10 高一階）：sticky
          定位本身不會自動疊在後面的內容上面，兩邊 z-index 打平時是看 DOM
          順序決定，聚會卡片在主視覺後面反而會贏，往上捲動時卡片文字會
          透出來蓋在主視覺上，所以主視覺一定要明確比任何會捲到它下面的
          內容都高一階。main 本身也一定要有 z-0（不能只有 relative）：
          relative 沒有搭配 z-index 的話不會建立新的 stacking context，
          子層的 -z-10 就不是相對 main 局部計算，而是直接跳到更外層
          （body）的疊層順序裡競爭，結果整張背景圖沉到 main 自己的純色底
          下面、完全被蓋住看不見。底色改成上藍下透明的漸層，跟後面的
          背景照片融合得更柔和，不是一條硬邊的實色色塊。 */}
      <div className="sticky top-0 z-20 bg-gradient-to-b from-[#0458e2] to-transparent">
        <div
          className="mx-auto max-w-2xl px-[6%] pb-2 sm:px-8"
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.5rem)" }}
        >
          <Link href="https://www.passion-hsinchu.com/" target="_blank" rel="noopener noreferrer">
            <Image
              src="/images/conference-hero-logo.webp"
              alt="PASSION"
              width={3356}
              height={630}
              priority
              className="mx-auto h-auto w-full"
            />
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-2xl">
        <div className="px-[6%] pt-6 sm:px-8">
          {/* 主視覺標題圖（THE COURAGE GENERATIONS! 勇者世代＋
              WORSHIP / RELATION / EXPERIENCE 標語）跟上面 sticky 的 PASSION
              LOGO 是兩張獨立圖，不隨捲動縮放、正常捲動離開畫面。 */}
          <Image
            src="/images/conference-title-visual.webp"
            alt="THE COURAGE GENERATIONS 勇者世代 WORSHIP RELATION EXPERIENCE"
            width={3364}
            height={2888}
            className="h-auto w-full"
          />

          {/* 倒數計時只留一個、放在最上面（不是每場聚會卡片各自一個）。視覺圖
              用下一場還沒開始的聚會（nextSession.image），倒數目標比「下一場
              聚會」更細，還包含工作坊場次（nextCountdownTarget）。點縮圖彈出
              下一場聚會的 16:9 大圖預覽，跟下面聚會卡片共用同一個彈窗。 */}
          <div className="mt-6 rounded-3xl bg-slate-300 p-6">
            <p className="font-[family-name:var(--font-noto-jp)] text-lg font-bold text-black/70">
              距離{nextCountdownTarget.label}開始，還剩...
            </p>

            <button
              type="button"
              onClick={() => setActiveMeetingSessionId(nextSession.id)}
              aria-label={`${nextSession.typeLabel}視覺預覽`}
              className="relative mt-3 aspect-video w-full overflow-hidden rounded-2xl bg-white/70"
            >
              <Image
                src={nextSession.image}
                alt={`${nextSession.typeLabel}視覺`}
                fill
                sizes="(min-width: 640px) 640px, 100vw"
                className="object-cover"
                style={{ objectPosition: "50% 30%" }}
              />
              <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                <ConferenceCountdown targetISO={nextCountdownTarget.startISO} />
              </div>
            </button>
          </div>

          {/* 標語圖放在倒數計時區塊下面（不是主視覺標題圖後面），白字透明底，
              直接疊在頁面藍色底上。 */}
          <Image
            src="/images/conference-slogan.webp"
            alt="我們相信，每個人都會在這裡遇見神。WE BELIEVE EVERYONE WILL EXPERIENCE GOD'S PRESENCE HERE."
            width={2434}
            height={257}
            className="mt-6 h-auto w-full"
          />

          {/* 三場聚會（同一批 session 也是聚會流程表印的三場）各自一張卡片，
              左右邊跟工作坊那排卡片切齊（同一層 px 內距），不是貼齊螢幕邊緣。
              視覺圖依場次換成 session.image（還沒拿到真圖的場次先共用佔位圖，
              見 lib/opening-conference-content.ts）；疊一層由下往上的黑色
              漸層，確保文字在任何圖片上都維持可讀。點卡片連去聚會內容頁對應
              的場次（/${session.id} 路徑，不是 query string）。倒數計時只有
              最上面那一個，卡片本身不重複顯示。工作坊卡片列插在午場聚會
              （session-2）跟 DAY2 晚場聚會（session-3）中間，對齊流程表本身
              的順序（午場→工作坊→晚場），conferenceSessions 固定就是
              [session-1, session-2, session-3] 這個順序，用索引取代 .map
              才能把工作坊插進中間。 */}
          <ConferenceSessionCard session={conferenceSessions[0]} meetingHref={meetingHref} />
          <ConferenceSessionCard session={conferenceSessions[1]} meetingHref={meetingHref} />

          {/* 工作坊方框底是真正的液態玻璃折射（.conf-glass-surface，SVG
              feDisplacementMap 讓背景真的扭曲，不是單純模糊；濾鏡定義掛在
              上面的 ConferenceLiquidGlassFilter，這裡直接引用同一個 id），
              照片是去背 PNG（有 alpha），疊在玻璃上面，透明的部分會透出
              玻璃折射效果。點卡片彈出視窗顯示介紹，不跳頁。
              overscroll-x-contain：滑到這排的頭尾邊界時，捲動不會「溢出」去觸發
              App 外層的返回手勢（iOS／Android 邊緣滑動＝返回），滑動效果留在這排裡面。 */}
          <div
            className="mt-6 flex gap-4 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {conferenceWorkshops.map((workshop) => (
              <button
                key={workshop.id}
                type="button"
                onClick={() => setActiveWorkshopId(workshop.id)}
                aria-label={workshop.topic || workshop.speaker}
                className="relative aspect-[4/5] w-[118px] shrink-0 overflow-hidden rounded-3xl border border-white/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_1px_4px_rgba(0,0,0,0.12)] sm:w-[151px]"
                style={{ scrollSnapAlign: "start" }}
              >
                <div className="conf-glass-surface absolute inset-0 bg-white/10" />
                <Image src={workshop.image} alt="" fill sizes="151px" className="object-cover" />
              </button>
            ))}
          </div>

          <ConferenceSessionCard session={conferenceSessions[2]} meetingHref={meetingHref} />
        </div>
      </div>

      {/* 聚會流程表整張圖脫離上面 max-w-2xl 置中容器，左右直接貼齊螢幕邊緣佔滿版面，
          跟倒數計時卡片之間留 mt-12 的空隙，沒有圓角、下面不留白，圖片底部就是頁面底部。 */}
      <div className="relative mt-12">
        <Image
          src="/images/conference-schedule.webp"
          alt="PASSION CONFERENCE 特會流程表"
          width={2250}
          height={4688}
          className="h-auto w-full"
        />
      </div>

      <Dialog open={activeWorkshop !== undefined} onOpenChange={(next) => !next && setActiveWorkshopId(null)}>
        <DialogContent
          showCloseButton={false}
          className="flex max-w-[calc(100%-2rem)] flex-col gap-0 rounded-3xl border-none bg-card p-0 sm:max-w-md"
        >
          <DialogTitle className="sr-only">{activeWorkshop?.topic || activeWorkshop?.speaker}</DialogTitle>
          <DialogClose className="absolute top-4 left-4 z-10 text-white/80 hover:text-white">
            <X className="size-5" />
            <span className="sr-only">關閉</span>
          </DialogClose>

          {/* 工作坊資訊欄的頭圖跟上面卡片縮圖是不同兩張圖，使用者說之後會另外
              上傳，先用色塊佔位。overflow-hidden 放在這裡（不是外層 DialogContent）
              只裁圖片本身的圓角，外層才能保留 overflow-y-auto 讓內容過長時可以
              捲動，不會在小螢幕手機上被切掉。 */}
          <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-t-3xl bg-[#3B82F6]">
            {activeWorkshop?.infoImage && (
              <Image
                src={activeWorkshop.infoImage}
                alt=""
                fill
                sizes="(min-width: 640px) 448px, 100vw"
                className="object-cover"
              />
            )}
          </div>

          <div className="flex flex-col gap-2 p-6">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium">
                <LocationPinIcon className="size-4" />
                {activeWorkshop?.location}
              </span>
              {registeredRounds.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-medium text-green-400">
                  <Check className="size-3.5 rounded-full bg-green-400 p-0.5 text-card" strokeWidth={3} />
                  已報名{registeredRounds.map((round) => workshopRoundLabels[round]).join("、")}
                </span>
              )}
            </div>
            <p className="text-xl font-bold">
              {activeWorkshop && breakAfterFirstComma(activeWorkshop.topic || activeWorkshop.speaker)}
            </p>
            {activeWorkshop?.topic && (
              <p className="text-base text-muted-foreground">{activeWorkshop.speaker}</p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {activeWorkshop?.rounds.map((round) => (
                <span key={round}>
                  {workshopRoundLabels[round]}｜{workshopRoundTimeLabels[round]}
                </span>
              ))}
              <span>{workshopDateLabel}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={activeMeetingSession !== undefined}
        onOpenChange={(next) => !next && setActiveMeetingSessionId(null)}
      >
        <DialogContent
          showCloseButton={false}
          className="flex max-w-[calc(100%-2rem)] flex-col gap-0 rounded-3xl border-none bg-card p-0 sm:max-w-md"
        >
          <DialogTitle className="sr-only">{activeMeetingSession?.typeLabel}視覺</DialogTitle>
          <DialogClose className="absolute top-4 right-4 z-10 text-white/80 hover:text-white">
            <X className="size-5" />
            <span className="sr-only">關閉</span>
          </DialogClose>

          {/* 聚會視覺依點的是哪張卡片換成 activeMeetingSession.image。
              overflow-hidden 放在這裡裁圖片圓角，外層 DialogContent 保留
              可捲動。 */}
          <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-t-3xl">
            {activeMeetingSession && (
              <Image
                src={activeMeetingSession.image}
                alt={`${activeMeetingSession.typeLabel}視覺`}
                fill
                sizes="(min-width: 640px) 448px, 100vw"
                className="object-cover"
                style={{ objectPosition: "50% 30%" }}
              />
            )}
          </div>

          {/* 圖片下面放聚會資訊，跟工作坊彈窗同樣的排版方式 */}
          <div className="flex flex-col gap-2 p-6">
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium">
              <LocationPinIcon className="size-4" />
              {siteConfig.venueShortName}
            </span>
            <p className="text-xl font-bold">{activeMeetingSession?.typeLabel}</p>
            <p className="text-base">
              {activeMeetingSession?.dateLabel}・{activeMeetingSession?.sessionLabel}
            </p>
            <p className="text-sm text-muted-foreground">
              {activeMeetingSession?.doorsOpenTime} 開放入場
              <span className="hidden sm:inline">・</span>
              <br className="sm:hidden" />
              {activeMeetingSession?.startTime} 聚會開始
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
