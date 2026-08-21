import localFont from "next/font/local"

// 源流明體（GenRyuMin2 TW-Bold），用在營會守則、靈修內容、CONF 開場經文／
// 禱告文等處。檔案已用 fonttools 只抽出這些地方實際會用到的字，19.7MB 壓到
// ~110KB；之後如果文案加了新字，要重新跑一次 subset 再換掉這個檔案（原始
// 完整字型檔在使用者 Font Book 的 GenRyuMin2-B.ttc 裡，第一個 face 就是
// GenRyuMin2TW-B）。
export const genRyuMin = localFont({
  src: "./GenRyuMin2TW-B.woff2",
  variable: "--font-genryu",
  display: "swap",
})
