import localFont from "next/font/local"

// 源流明體（GenRyuMin2 TW-Bold），用在營會守則、靈修內容、首頁早晨靈修卡片、
// CONF 開場經文／禱告文等處。檔案已用 fonttools 只抽出這些地方實際會用到的
// 字，19.7MB 壓到 ~123KB；之後如果文案加了新字，要重新跑一次 subset 再換掉
// 這個檔案（原始完整字型檔在使用者 Font Book 的 GenRyuMin2TW-B.otf，或
// GenRyuMin2-B.ttc 的第一個 face）。重新產生指令：
//   python3 -m fontTools.subset <原始字型檔> \
//     --text="<這裡放所有會用 genRyuMin 顯示的文字，含新加的>" \
//     --flavor=woff2 --output-file=GenRyuMin2TW-B.woff2 --no-hinting
// 或用 --unicodes-file/--text-file 帶字元列表，記得先用現有 woff2 的
// cmap 撈出既有字元、跟新字聯集，才不會漏字。
export const genRyuMin = localFont({
  src: "./GenRyuMin2TW-B.woff2",
  variable: "--font-genryu",
  display: "swap",
})
