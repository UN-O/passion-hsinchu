export type QuizOption = {
  key: "A" | "B"
  label: string
  imageSrc?: string
}

export type QuizQuestion = {
  id: string
  question: string
  options: [QuizOption, QuizOption]
}

export const campQuizQuestions: QuizQuestion[] = [
  {
    id: "identity",
    question: "對我來說，什麼是「勇者」？",
    options: [
      { key: "A", label: "無所畏懼的勇敢之人", imageSrc: "/images/無所畏懼的勇敢之人.webp" },
      { key: "B", label: "很害怕但仍繼續前行的人", imageSrc: "/images/很害怕但仍繼續前行的人.webp" },
    ],
  },
  {
    id: "boss",
    question: "最難對付的「魔王」，通常來自哪裡？",
    options: [
      { key: "A", label: "前方聲勢兇猛的野獸", imageSrc: "/images/前方聲勢兇猛的野獸.webp" },
      { key: "B", label: "來自地底深淵的怪物", imageSrc: "/images/來自地底深淵的怪物.webp" },
    ],
  },
  {
    id: "weapon",
    question: "請選擇我的主要武器。",
    options: [
      { key: "A", label: "勇者之劍", imageSrc: "/images/勇者之劍.webp" },
      { key: "B", label: "無敵之盾", imageSrc: "/images/無敵之盾.webp" },
    ],
  },
  {
    id: "support",
    question: "請選擇我的輔助武器。",
    options: [
      { key: "A", label: "補血藥水", imageSrc: "/images/補血藥水.webp" },
      { key: "B", label: "隱形藥水", imageSrc: "/images/隱形藥水.webp" },
    ],
  },
]

export type CampProfileResult = {
  aCount: number
  name: string
  quote: string
  description: string
  traits: string[]
  reminder: string
}

// aCount = 4 題中選 A 的次數，0~4 對應 5 種勇者結果
export const campProfileResults: CampProfileResult[] = [
  {
    aCount: 4,
    name: "衝鋒勇者",
    quote: "讓我為著小隊夥伴，劈開前方的道路！",
    description: "你相信勇敢就是迎面而上。當危機來臨，你拔出武器直接面對，不喜歡逃避，也不容易退縮。",
    traits: ["行動力高", "喜歡挑戰", "有領袖魅力", "願意保護別人"],
    reminder: "真正的勇者不會只靠自己，也會知道何時停下來、接受幫助。",
  },
  {
    aCount: 3,
    name: "信念勇者",
    quote: "我最強大的力量，來自我的內心！",
    description: "因為心中有重要的人、有重要的信念，所以選擇前進。",
    traits: ["重視感情", "願意犧牲", "不容易放棄"],
    reminder: "不要總是把所有責任都扛在自己身上。",
  },
  {
    aCount: 2,
    name: "智慧勇者",
    quote: "站得最久的人，才能走得最遠！",
    description:
      "你是最高兼容性勇者。知道何時該衝、何時該停。你不會因為熱血而失去理智，也不會因為害怕而放棄前進。",
    traits: ["適應能力高", "能兼顧自己與他人", "常成為團隊核心"],
    reminder: "不要因為想兼顧所有人，最後忘記自己的方向。",
  },
  {
    aCount: 1,
    name: "策略勇者",
    quote: "小隊中的頂配大腦，才是一切的解答！",
    description: "你喜歡先分析行動，再勇敢出手。",
    traits: ["擅長規劃", "思考周全", "常找到別人沒想到的方法"],
    reminder: "有些事情，想得再多，也需要跨出第一步。",
  },
  {
    aCount: 0,
    name: "守護勇者",
    quote: "就用我的背影，來保護我的夥伴吧！",
    description: "你相信真正的勇敢，是懂得等待、觀察、選擇最好的時機。",
    traits: ["很有耐心", "擅長保護人", "重視安全感", "很有同理心"],
    reminder: "不要因為害怕失敗，反而一直停在原地。",
  },
]

export function getCampProfileResult(aCount: number): CampProfileResult {
  const match = campProfileResults.find((result) => result.aCount === aCount)
  return match ?? campProfileResults[2]
}

// 營會守則：onboarding 的開場段落，標題頁 + 守則一～五，共 6 頁文字排版
// （標題／標籤用饅頭黑體，內文用源流明體）。
export const campRulesTitle = "營會守則"

export type CampRuleScreen = {
  label: string
  lines: string[]
}

export const campRuleScreens: CampRuleScreen[] = [
  {
    label: "守則一",
    lines: ["我愛我的小隊長，", "我愛我的小隊員！", "我絕對不會棄他們不顧，", "置他們於水火！"],
  },
  {
    label: "守則二",
    lines: ["我會用盡全心全力！", "不放過一分一秒，", "充滿熱情投入在", "PASSION CAMP裡面！"],
  },
  {
    label: "守則三",
    lines: ["雖然身邊夥伴超可愛，", "但我會專心聚會！", "真的啦！", "我今年有在努力啦！"],
  },
  {
    label: "守則四",
    lines: ["我會用心愛護", "上帝所創造的地球，", "吃完飯做好垃圾分類！", "不亂吐痰打嗝！"],
  },
  {
    label: "守則五",
    lines: ["如果營會中", "我有任何的身體不適，", "我會即時回報給小隊長，", "安全第一！"],
  },
]

// 營會守則之後的「介紹 3 區」段落：一頁放三格資訊。icon 是吉祥物圖，
// onboarding 那一步（camp-zones-reveal.tsx 的 CampZonesGrid）跟首頁三區
// 入口（camp-zone-icons.tsx）共用同一份資料，各自只挑自己要的欄位——
// leaderName／body／quote 只有 onboarding 那一步的文字介紹用，cardImage
// （區長提供的 4:5 直式卡片圖，900×1125）是首頁三區入口本身的卡片圖，
// posterImage（區長提供的完整介紹圖，區長照片＋小隊分組＋區名，
// 3600×2025）是點下去彈窗顯示的大圖，三張圖各自獨立、用途不同。
export type CampZoneScreen = {
  title: string
  leaderName: string
  body: string
  quote: string
  icon: string
  cardImage: string
  posterImage: string
}

export const campZoneScreens: CampZoneScreen[] = [
  {
    title: "土撥鼠區",
    leaderName: "士民",
    body: "土撥鼠是很有群體意識的動物。當牠發現危險時，會發出叫聲警告同伴提高警覺，但卻也可能在這過程中讓自己成為天敵的攻擊焦點。",
    quote: "勇敢，是看見危險時就算會犧牲自己，仍然願意提醒、保護身邊的人。",
    icon: "/images/zone-icon-1.webp",
    cardImage: "/images/zone-card-groundhog.webp",
    posterImage: "/images/zone-intro-groundhog.webp",
  },
  {
    title: "尼莫魚區",
    leaderName: "恩琪",
    body: "小丑魚尼莫通常生活在海葵附近，彼此之間形成合作關係。牠們會全力守護自己的家、照顧魚卵、維持生活的安全，對抗比自己大數倍的魚群。",
    // 兩句話刻意用換行分開（見 camp-zone-icons.tsx／camp-zones-reveal.tsx
    // 的 whiteSpace: pre-line），不靠瀏覽器自動斷行猜位置——這句話兩個
    // 分句語意獨立，固定在句號後面換行比較好讀。
    quote: "勇敢，是守護那最重要的。\n也讓彼此知道，你不是一個人。",
    icon: "/images/zone-icon-2.webp",
    cardImage: "/images/zone-card-clownfish.webp",
    posterImage: "/images/zone-intro-clownfish.webp",
  },
  {
    title: "熊蜂區",
    leaderName: "宇翔",
    body: "熊蜂身體圓胖、翅膀看起來根本不適合飛行，卻能靠快速拍動翅膀飛行，甚至在寒冷環境中活動。",
    quote: "勇敢，是不被外在的眼光所限制，依然願意跨出突破的那一步。",
    icon: "/images/zone-icon-3.webp",
    cardImage: "/images/zone-card-bee.webp",
    posterImage: "/images/zone-intro-bee.webp",
  },
]

// 首頁倒數卡片用的逐場聚會時間表，跟 lib/opening-conference-content.ts 的
// conferenceSessions／getNextConferenceSession 同一套邏輯。時間來自營會流程表。
export type CampSession = {
  id: string
  label: string
  startISO: string
  endISO: string
  // 16:9 無字視覺圖：首頁聚會內容卡片、倒數計時縮圖共用，跟 ConferenceSession.image
  // 同一個用法。
  image: string
  // 16:9 有字（場次名稱）視覺圖，只用在倒數卡片點下去的「營會資訊」彈窗頭圖，
  // 跟 conference-mission-home.tsx 工作坊的 image／infoImage 分工同一個做法。
  infoImage: string
}

export const campSessions: CampSession[] = [
  {
    id: "day1-opening",
    label: "開場聚會",
    startISO: "2026-08-25T14:00:00+08:00",
    endISO: "2026-08-25T17:30:00+08:00",
    image: "/images/camp-session-day1-opening.webp",
    infoImage: "/images/camp-session-day1-opening-info.webp",
  },
  {
    id: "day1-evening",
    label: "晚場聚會",
    startISO: "2026-08-25T19:00:00+08:00",
    endISO: "2026-08-25T21:20:00+08:00",
    image: "/images/camp-session-day1-evening.webp",
    infoImage: "/images/camp-session-day1-evening-info.webp",
  },
  {
    id: "day2-game",
    label: "大地競賽",
    startISO: "2026-08-26T09:20:00+08:00",
    endISO: "2026-08-26T11:10:00+08:00",
    image: "/images/camp-session-day2-game.webp",
    infoImage: "/images/camp-session-day2-game-info.webp",
  },
  {
    id: "day2-debate",
    label: "勇者辯論場",
    startISO: "2026-08-26T14:00:00+08:00",
    endISO: "2026-08-26T17:30:00+08:00",
    image: "/images/camp-session-day2-debate.webp",
    infoImage: "/images/camp-session-day2-debate-info.webp",
  },
  {
    id: "day2-evening",
    label: "晚場聚會",
    startISO: "2026-08-26T19:00:00+08:00",
    endISO: "2026-08-26T21:20:00+08:00",
    image: "/images/camp-session-day2-evening.webp",
    infoImage: "/images/camp-session-day2-evening-info.webp",
  },
  {
    id: "day3-podcast",
    label: "Live Podcast",
    startISO: "2026-08-27T09:20:00+08:00",
    endISO: "2026-08-27T12:00:00+08:00",
    image: "/images/camp-session-day3-podcast.webp",
    infoImage: "/images/camp-session-day3-podcast-info.webp",
  },
  {
    id: "day3-closing",
    label: "閉幕聚會",
    startISO: "2026-08-27T13:30:00+08:00",
    endISO: "2026-08-27T16:30:00+08:00",
    image: "/images/camp-session-day3-closing.webp",
    infoImage: "/images/camp-session-day3-closing-info.webp",
  },
]

// 下一場還沒開始的聚會。場次資料是小時等級的固定時間表，不像倒數計時每秒都變，
// 伺服器算出來的跟瀏覽器 hydrate 那一刻幾乎不會跨到下一場，直接算不用另外處理
// hydration mismatch（跟 getNextConferenceSession 同樣的考量）。
export function getNextCampSession(now: Date = new Date()): CampSession {
  const nowMs = now.getTime()
  const upcoming = campSessions.find((session) => new Date(session.startISO).getTime() > nowMs)
  return upcoming ?? campSessions[campSessions.length - 1]
}

// campSessions 裡 6 場開放場次頁選單切換＋逐場討論串（開場／兩場晚場／
// 閉幕＋勇者辯論場／Live Podcast），只有大地競賽不在裡面——大地競賽有
// 自己的場次頁（見 app/camp/meeting/[sessionId]/page.tsx），但只提供
// 聚會資訊、不開放留言，所以不需要（也不該）註冊討論串，見
// lib/discussion/root-registry.ts。
const CAMP_MEETING_SESSION_IDS = [
  "day1-opening",
  "day1-evening",
  "day2-debate",
  "day2-evening",
  "day3-podcast",
  "day3-closing",
] as const

export function isCampMeetingSession(id: string): boolean {
  return (CAMP_MEETING_SESSION_IDS as readonly string[]).includes(id)
}

export function getCampMeetingSessions(): CampSession[] {
  return campSessions.filter((session) => isCampMeetingSession(session.id))
}

export function getNextCampMeetingSession(now: Date = new Date()): CampSession {
  const nowMs = now.getTime()
  const sessions = getCampMeetingSessions()
  const upcoming = sessions.find((session) => new Date(session.startISO).getTime() > nowMs)
  return upcoming ?? sessions[sessions.length - 1]
}

const campMeetingDateFormatter = new Intl.DateTimeFormat("zh-TW", {
  timeZone: "Asia/Taipei",
  month: "numeric",
  day: "numeric",
  weekday: "short",
})

// 場次選單要顯示日期＋名稱（單純「晚場聚會」會撞名——day1、day2 各有一場）。
// 用 formatToParts 自己組字串，不直接吃 formatter.format() 的 literal 分隔字元
// ——原因見 components/discussion/post-row.tsx 的 formatAbsoluteTime 註解
// （Node 的 ICU 跟瀏覽器的 ICU 對分隔符號可能不一致，會觸發 hydration mismatch）。
export function formatCampMeetingDateLabel(iso: string): string {
  const parts = campMeetingDateFormatter.formatToParts(new Date(iso))
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ""
  return `${get("month")}/${get("day")}（${get("weekday")}）`
}

const campMeetingTimeFormatter = new Intl.DateTimeFormat("zh-TW", {
  timeZone: "Asia/Taipei",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
})

export function formatCampMeetingTimeLabel(iso: string): string {
  const parts = campMeetingTimeFormatter.formatToParts(new Date(iso))
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ""
  return `${get("hour")}:${get("minute")}`
}

// 「14:00-17:30」這種區間顯示，起訖都在同一天（場次目前沒有跨午夜的）。
export function formatCampMeetingTimeRangeLabel(startISO: string, endISO: string): string {
  return `${formatCampMeetingTimeLabel(startISO)}-${formatCampMeetingTimeLabel(endISO)}`
}
