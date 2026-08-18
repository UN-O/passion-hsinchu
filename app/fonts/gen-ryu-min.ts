import localFont from "next/font/local"

// 源流明體（GenRyuMin2 TW-Bold），用在營會守則的內文。
// 檔案已用 fonttools 只抽出內文實際會用到的字，16.4MB 壓到 ~25KB；
// 之後如果文案加了新字，要重新跑一次 subset 再換掉這個檔案。
export const genRyuMin = localFont({
  src: "./GenRyuMin2TW-B.woff2",
  variable: "--font-genryu",
  display: "swap",
})
