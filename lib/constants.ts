/**
 * Passion Camp 系統常數定義
 * 包含組別資訊、區域配置、密碼對應等核心資料
 */

export interface Group {
  id: string
  name: string
  region: "R" | "G" | "O"
  color: string
}

export interface Region {
  id: "R" | "G" | "O"
  name: string
  password: string
  verse: string
  theme: string
}

// 組別資訊
export const GROUPS: Group[] = [
  { id: "R1", name: "粉確信", region: "R", color: "#FF0080" },
  { id: "R2", name: "信心行動", region: "R", color: "#750000" },
  { id: "R3", name: "信心腸", region: "R", color: "#EA0000" },
  { id: "G1", name: "望得福", region: "G", color: "#9AFF02" },
  { id: "G2", name: "星天使", region: "G", color: "#00BB00" },
  { id: "G3", name: "萌芽小火苗", region: "G", color: "#73BF00" },
  { id: "O1", name: "愛不單行", region: "O", color: "#FF8040" },
  { id: "O2", name: "神愛光照", region: "O", color: "#FF5809" },
  { id: "O3", name: "愛人如己", region: "O", color: "#F75000" },
]

// 區域資訊
export const REGIONS: Region[] = [
  {
    id: "R",
    name: "信心區",
    password: "hebrews11:1",
    verse: "信就是所望之事的實底，是未見之事的確據。",
    theme: "region-r",
  },
  {
    id: "G",
    name: "盼望區",
    password: "romans15:13",
    verse: "但願使人有盼望的神，因信將諸般的喜樂、平安充滿你們的心，使你們藉著聖靈的能力大有盼望！",
    theme: "region-g",
  },
  {
    id: "O",
    name: "愛心區",
    password: "john13:34",
    verse: "我賜給你們一條新命令，乃叫你們彼此相愛；我怎樣愛你們，你們也要怎樣相愛。",
    theme: "region-o",
  },
]

// 管理者帳號
export const ADMIN_CREDENTIALS = {
  username: "system",
  password: "REDACTED_PASSWORD",
}

// 邀請碼
export const INVITE_CODE = "#rebirth"

// 營會日期
export const CAMP_DATES = {
  start: "2025-08-21",
  end: "2025-08-23",
  verses: {
    "2025-08-21": "希伯來書 11:1 信是所望之事的實底，是未見之事的確據。",
    "2025-08-22": "林多後書 5:17 若有人在基督裡，他就是新造的人，舊事已過，都變成新的了。",
    "2025-08-23": "哥林多前書 13:13 如今常存的有信、有望、有愛；這三樣，其中最大的是愛。",
  },
  default: "詩篇 46:10 你們要休息，要知道我是神！我必在外邦中被尊崇",
}

// 成就系統定義
export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  type: "scheduled" | "assign"
  exp: number
  scheduled?: string
  unlocked?: boolean
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "test",
    name: "測試者讚",
    description: "歡迎加入測試",
    icon: "badge-check",
    type: "scheduled",
    exp: 1000,
    scheduled: "2025-08-17 06:00:00",
  },
  {
    id: "s1_done",
    name: "新手報到",
    description: "S1聚會後獲得",
    icon: "badge-check",
    type: "scheduled",
    exp: 100,
    scheduled: "2025-08-21 15:00:00",
  },
  {
    id: "day_1_clean",
    name: "整潔溜溜",
    description: "第一天晚餐完成垃圾回收後獲得",
    icon: "trash",
    type: "assign",
    exp: 200,
  },
  {
    id: "s2_done",
    name: "信心副本",
    description: "S2聚會後獲得",
    icon: "shield",
    type: "scheduled",
    exp: 100,
    scheduled: "2025-08-21 20:00:00",
  },
  {
    id: "team_game",
    name: "鬥陣信望愛",
    description: "二早完成大地競賽後獲得",
    icon: "users",
    type: "assign",
    exp: 150,
  },
  {
    id: "s3_done",
    name: "盼望副本",
    description: "S3聚會後獲得",
    icon: "heart",
    type: "scheduled",
    exp: 100,
    scheduled: "2025-08-22 14:00:00",
  },
  {
    id: "s4_done",
    name: "最後一夜",
    description: "S4聚會後獲得",
    icon: "moon",
    type: "scheduled",
    exp: 100,
    scheduled: "2025-08-22 21:00:00",
  },
  {
    id: "s5_done",
    name: "愛心副本",
    description: "S5聚會後獲��",
    icon: "heart-handshake",
    type: "scheduled",
    exp: 100,
    scheduled: "2025-08-23 09:00:00",
  },
  {
    id: "prayer_warrior",
    name: "城市代禱者",
    description: "S5聚會後獲得",
    icon: "church",
    type: "assign",
    exp: 150,
  },
  {
    id: "video_master",
    name: "剪輯大師",
    description: "中午交出影片檔案後獲得",
    icon: "video",
    type: "assign",
    exp: 200,
  },
  {
    id: "puzzle_collector",
    name: "拼圖收藏家",
    description: "收集完3片拼圖後獲得",
    icon: "puzzle",
    type: "assign",
    exp: 300,
  },
  {
    id: "perfect_ending",
    name: "完美結局",
    description: "所有區完成拼圖收集，順利開啟完美結局後獲得",
    icon: "crown",
    type: "assign",
    exp: 500,
  },
]

// 拼圖系統定義
export interface Puzzle {
  id: string
  name: string
  region: "R" | "G" | "O"
  icon: string
  unlocked?: boolean
}

export const PUZZLES: Record<"R" | "G" | "O", Puzzle[]> = {
  R: [
    { id: "partner", name: "夥伴拼圖", region: "R", icon: "users" },
    { id: "fire", name: "火熱拼圖", region: "R", icon: "flame" },
    { id: "faith", name: "信心拼圖", region: "R", icon: "shield" },
  ],
  G: [
    { id: "creation", name: "創造拼圖", region: "G", icon: "sparkles" },
    { id: "sheep", name: "綿羊拼圖", region: "G", icon: "sheep" },
    { id: "hope", name: "盼望拼圖", region: "G", icon: "sunrise" },
  ],
  O: [
    { id: "earth", name: "地球拼圖", region: "O", icon: "globe" },
    { id: "volleyball", name: "排球拼圖", region: "O", icon: "volleyball" },
    { id: "love", name: "愛心拼圖", region: "O", icon: "heart" },
  ],
}

// 外部連結
export const EXTERNAL_LINKS = {
  schedule: "https://drive.google.com/file/d/example-schedule",
  workshop: "https://forms.gle/Za7aBoUmwGHUXRBF9",
}

export const TEAMS: Record<string, string[]> = {
  R: ["粉確信", "信心行動", "信心腸"],
  G: ["望得福", "星天使", "萌芽小火苗"],
  O: ["愛不單行", "神愛光照", "愛人如己"],
}

export const PASSWORDS: Record<string, string> = {
  R: "john13:34",
  G: "romans15:13",
  O: "hebrews11:1",
}

export const TEAM_COLORS = GROUPS
