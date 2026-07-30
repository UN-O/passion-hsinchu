export const siteConfig = {
  name: "2026 Passion Camp",
  orgName: "PASSION® 新竹青年火熱",
  themeZh: "勇者世代",
  themeEn: "THE COURAGE GENERATIONS",
  edition: "PASSION® 26",
  year: 2026,
  description:
    "五年，一場屬於新竹地區的營會。2026 PASSION 26《勇者世代》，8 月於新竹聖經書院／築聖館，火熱營會與火熱特會等你加入。",
  url: "https://passion-hsinchu.example.com",
  venue: "新竹聖經書院／築聖館",
  venueAddress: "新竹市東區高峰路56號",
  contactPhone: "(03)-5236737#213",
  contactAddress: "新竹市北大路202號",
}

// 一週前（活動開始前一週）：hero CTA 從「立即報名」切換成「進入 CAMP」／「進入 Conference」兩顆按鈕
export const heroSwitchDate = "2026-08-15T00:00:00+08:00"

export type Program = {
  name: string
  label: string
  audience: string
  dateLabel: string
  timeEntries: string[]
  durationLabel?: string
  feeLabel: string
  feeNote: string
  formUrl: string
}

export const camp: Program = {
  name: "PASSION CAMP",
  label: "火熱營會",
  audience: "國中至大學學生",
  dateLabel: "8.25 - 8.27（二）-（四）",
  timeEntries: ["8/25（二）13:00", "8/27（四）17:00"],
  durationLabel: "三天兩夜",
  feeLabel: "早鳥 3,300 元（4/25-5/31）／火熱報名 3,500 元（6/1-8/16）",
  feeNote: "費用包含住宿、膳食及紀念 T 恤",
  formUrl:
    "https://docs.google.com/forms/d/e/1FAIpQLSeymjgFHXkX1v94k8SzvVSaoa76vJ1dLavHsEMl2Q-Rwh33_w/viewform",
}

export const conference: Program = {
  name: "PASSION CONFERENCE",
  label: "火熱特會",
  audience: "20 歲以上社青",
  dateLabel: "8.28 - 8.29（五）-（六）",
  timeEntries: ["8/28（五）19:00-21:00", "8/29（六）14:00-21:00"],
  feeLabel: "早鳥 1,200 元（4/25-5/31）／火熱報名 1,500 元（6/1-8/16）",
  feeNote: "報名費用以繳費時間為計算基準",
  formUrl:
    "https://docs.google.com/forms/d/e/1FAIpQLSeaykp8oCVFCfwvFKCs7vTPvfVxwaEUA7M-iKATPd-Yrt_oog/viewform",
}

export const socialLinks = {
  instagram: "https://www.instagram.com/passion.hsinchu/",
  youtube: "https://www.youtube.com/@PASSION-HSINCHU",
  linktree: "https://linktr.ee/passion.hsinchu",
}

// TODO: 請提供完整聯名教會名單並取代下方佔位資料（目前僅為暫時佔位文字，非真實教會名稱）
export const partnerChurches = [
  "新竹浸信會",
  "長老教會 1",
  "長老教會 2",
  "長老教會 3",
  "長老教會 4",
  "長老教會 5",
]

export const galleryImages = [
  "00-1-1",
  "00-1-2",
  "00-2-1",
  "00-2-2",
  "00-2-3",
  "00-2-4",
  "00-2-5",
  "00-3-1",
  "00-3-2",
  "00-3-3",
  "00-3-4",
].map((name) => `/posts/${name}.webp`)
