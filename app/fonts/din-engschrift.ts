import localFont from "next/font/local"

// DINEngschrift LT，用在倒數計時的數字／冒號、小隊分數卡片的勇氣值數字。
// 字型檔已經用 fonttools 抽出 0-9、冒號、逗號（勇氣值用
// toLocaleString("en-US") 千分位逗號，例如「1,280」）這 12 個字元，
// 69KB 壓到 ~1KB；原始完整字型檔在使用者 Font Book 的
// 「DINEngschrift LT Regular.ttf」。之後如果又要用在別的地方、出現新
// 字元，記得重新跑一次 subset（--text="0123456789:,<新字元>"）再換掉
// 這個檔案，不然會悄悄退回瀏覽器預設字體。
export const dinEngschrift = localFont({
  src: "./DINEngschriftLT.woff2",
  variable: "--font-din-engschrift",
  display: "swap",
})
