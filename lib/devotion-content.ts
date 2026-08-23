import type { BibleVersionKey } from "@/lib/bible"

export type DevotionEntry = {
  // 穩定 id，給路由／討論串 root key 用（day 是給人看的中文文案，不適合當
  // 網址／資料庫 key——文案之後可能會改，id 不會）。
  id: "day2" | "day3"
  day: string
  title: string
  // 經文參照，USFM 格式（例如 "NEH.2.11-20"），交給聖經模組（lib/bible）
  // 即時查詢顯示，不在這裡寫死經文全文——見 components/bible/。
  reference: string
  // 預設顯示的版本，讀者可以自己在畫面上切換（見 passage-card.tsx 的版本
  // 下拉選單），這裡只是初始值。
  version: BibleVersionKey
  intro?: string
  questions: string[]
  closing?: string
  // 內容公布時間，在這之前畫面只顯示「尚未公布」佔位，不會提早爆雷。
  revealISO: string
}

// root post 第一次建立時的初始 content（markdown）——只有那一次會用到，
// 之後 admin 要改內文就直接在畫面上編輯，不會再回頭讀這裡（見
// lib/discussion/root.ts 的 getOrCreateDevotionRoot）。closing 用 **粗體**
// 呼應原本「結語加粗」的排版。
export function buildDevotionContent(entry: DevotionEntry): string {
  return [entry.intro, entry.closing ? `**${entry.closing}**` : null].filter(Boolean).join("\n\n")
}

// 靈修內容目前只拿到部分場次的資料（第二、三天早上），先放已經確定的，
// 其餘（例如第一天早上）等資料到齊再補進這個陣列，不要編造內容。
// 導言／問題／結語來自 2026第一篇晨更.docx／2026第二篇晨更-若芸.docx。
export const DEVOTION_ENTRIES: DevotionEntry[] = [
  {
    id: "day2",
    day: "第二天早上",
    title: "勇敢是：選擇神看為正確的事",
    reference: "NEH.2.11-20",
    version: "tcv2019",
    revealISO: "2026-08-26T00:00:00+08:00",
    intro:
      "耶路撒冷城牆被毀、百姓被擄後，這座聖城開始被外族影響，在罪惡與紛亂中，剩餘的以色列人甚至也離棄了神。當被擄的以色列人終於有機會回到耶路撒冷時，他們先重建了聖殿、恢復對神的敬拜，但是當他們一想到家園殘破不堪、街頭充滿異教的文化，內心仍很無力。也有過修復城牆的念頭，卻也因為擔心建了城牆會被敵人阻擋而放棄，城牆的荒廢使得外族的偶像與文化持續影響神的百姓。尼希米深深明白：城牆不只是一道防禦工事，更代表神百姓「分別為聖」的生命與界線。若生命失去了屬神的界線，即使仍有敬拜的形式，人也可能漸漸遠離神的心意。因此，當尼希米開始重建城牆，並面對他人的質疑與攔阻時，仍勇敢宣告神百姓對這座聖城的使命與身份。\n面對生活與信仰時，不只是停留在抱怨或指出問題，我們也能選擇像尼希米一樣，與神一起勇敢，把祂看為對的事情重新建立起來。",
    questions: [
      "對你來說，做事麼事情最需要勇氣？",
      "尼希米在最艱困的現狀中仍堅定的信靠神，你期許自己在「哪些地方/哪些時刻」也能效法尼希米對神的信心與勇氣呢？",
    ],
    closing: "勇敢是：即便面對掙扎/還沒看見結果，我們仍然做神看為正確的事情。",
  },
  {
    id: "day3",
    day: "第三天早上",
    title: "勇敢是：相信耶穌已經得勝",
    reference: "JHN.16.25-33",
    version: "tcv2019",
    revealISO: "2026-08-27T00:00:00+08:00",
    questions: [
      "在約翰福音的故事中，你聽見/看見了什麼？有沒有哪一段內容或是哪一節經文特別提醒你？",
      "這段經文中，耶穌告訴門徒會遇到哪些事情？耶穌希望門徒記住什麼？（讓他們看見「有苦難」和「我已經勝了世界」）",
    ],
  },
]
