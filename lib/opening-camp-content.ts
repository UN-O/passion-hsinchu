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
      { key: "A", label: "無所畏懼的勇敢之人", imageSrc: "/images/無所畏懼的勇敢之人.png" },
      { key: "B", label: "很害怕但仍繼續前行的人", imageSrc: "/images/很害怕但仍繼續前行的人.png" },
    ],
  },
  {
    id: "boss",
    question: "最難對付的「魔王」，通常來自哪裡？",
    options: [
      { key: "A", label: "前方聲勢兇猛的野獸", imageSrc: "/images/前方聲勢兇猛的野獸.png" },
      { key: "B", label: "來自地底深淵的怪物", imageSrc: "/images/來自地底深淵的怪物.png" },
    ],
  },
  {
    id: "weapon",
    question: "請選擇我的主要武器。",
    options: [
      { key: "A", label: "勇者之劍", imageSrc: "/images/勇者之劍.png" },
      { key: "B", label: "無敵之盾", imageSrc: "/images/無敵之盾.png" },
    ],
  },
  {
    id: "support",
    question: "請選擇我的輔助武器。",
    options: [
      { key: "A", label: "補血藥水", imageSrc: "/images/補血藥水.png" },
      { key: "B", label: "隱形藥水", imageSrc: "/images/隱形藥水.png" },
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

// 營會守則之後的「介紹 3 區」段落：一頁放三格資訊，先放佔位文字＋預設視覺
// （跟營會守則那 6 頁是不同視覺風格，使用者說之後會另外給設計），
// icon 已經是使用者提供的吉祥物圖。
export type CampZoneScreen = { title: string; body: string; icon: string }

export const campZoneScreens: CampZoneScreen[] = [
  { title: "土撥鼠區", body: "這裡先放佔位文字，等使用者提供這個區域的實際介紹內容。", icon: "/images/zone-icon-1.png" },
  { title: "小丑魚區", body: "這裡先放佔位文字，等使用者提供這個區域的實際介紹內容。", icon: "/images/zone-icon-2.png" },
  { title: "熊蜂區", body: "這裡先放佔位文字，等使用者提供這個區域的實際介紹內容。", icon: "/images/zone-icon-3.png" },
]

// 首頁倒數卡片用的逐場聚會時間表，跟 lib/opening-conference-content.ts 的
// conferenceSessions／getNextConferenceSession 同一套邏輯。時間來自營會流程表。
export type CampSession = {
  id: string
  label: string
  startISO: string
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
    image: "/images/camp-session-day1-opening.jpg",
    infoImage: "/images/camp-session-day1-opening-info.jpg",
  },
  {
    id: "day1-evening",
    label: "晚場聚會",
    startISO: "2026-08-25T19:00:00+08:00",
    image: "/images/camp-session-day1-evening.jpg",
    infoImage: "/images/camp-session-day1-evening-info.jpg",
  },
  {
    id: "day2-game",
    label: "大地競賽",
    startISO: "2026-08-26T09:20:00+08:00",
    image: "/images/camp-session-day2-game.jpg",
    infoImage: "/images/camp-session-day2-game-info.jpg",
  },
  {
    id: "day2-debate",
    label: "勇者辯論場",
    startISO: "2026-08-26T14:00:00+08:00",
    image: "/images/camp-session-day2-debate.jpg",
    infoImage: "/images/camp-session-day2-debate-info.jpg",
  },
  {
    id: "day2-evening",
    label: "晚場聚會",
    startISO: "2026-08-26T19:00:00+08:00",
    image: "/images/camp-session-day2-evening.jpg",
    infoImage: "/images/camp-session-day2-evening-info.jpg",
  },
  {
    id: "day3-podcast",
    label: "Live Podcast",
    startISO: "2026-08-27T09:20:00+08:00",
    image: "/images/camp-session-day3-podcast.jpg",
    infoImage: "/images/camp-session-day3-podcast-info.jpg",
  },
  {
    id: "day3-closing",
    label: "閉幕聚會",
    startISO: "2026-08-27T13:30:00+08:00",
    image: "/images/camp-session-day3-closing.jpg",
    infoImage: "/images/camp-session-day3-closing-info.jpg",
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
