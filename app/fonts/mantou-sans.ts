import localFont from "next/font/local"

// 饅頭黑體（MantouSans），先只用在營會守則的標題上做測試
export const mantouSans = localFont({
  src: "./MantouSans-Regular.ttf",
  variable: "--font-mantou",
  display: "swap",
})
