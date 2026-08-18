import localFont from "next/font/local"

// 饅頭黑體（MantouSans），用在營會守則的標題／守則標籤上。
// 檔案已用 fonttools 只抽出實際會用到的字（營會守則一二三四五＋下一步完成），
// 2.6MB 壓到 ~2KB；之後如果文案加了新字，要重新跑一次 subset 再換掉這個檔案。
export const mantouSans = localFont({
  src: "./MantouSans-Regular.woff2",
  variable: "--font-mantou",
  display: "swap",
})
