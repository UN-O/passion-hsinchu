import localFont from "next/font/local"

// DINEngschrift LT，只用在 flip-card.tsx 翻牌時鐘的數字／冒號。字型檔已經用
// fonttools 只抽出 0-9 跟冒號這 11 個字元，69KB 壓到 ~3KB；原始完整字型檔在
// 使用者 Font Book 的「DINEngschrift LT Regular.ttf」。
export const dinEngschrift = localFont({
  src: "./DINEngschriftLT.woff2",
  variable: "--font-din-engschrift",
  display: "swap",
})
