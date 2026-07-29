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

// TODO: 使用者尚未提供這三個分區的實際內容，先放合理佔位文案
export const campOnboardingZones: { title: string; body: string }[] = [
  { title: "訓練場", body: "在這裡認識你的小隊夥伴，一起熟悉營會的節奏。" },
  { title: "補給站", body: "報到、住宿、餐飲等生活資訊都在這裡説明。" },
  { title: "集合廣場", body: "每天的大堂聚會與宣布事項，都會在這裡進行。" },
]
