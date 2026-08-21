// 傳送圖示是純黑色實心 PNG（見 public/images/send-icon.webp），用 CSS mask
// 把它當形狀模板套上 currentColor，跟著文字顏色走——「傳送給官方 IG」按鈕在
// camp（淺色底）跟 conference（深色底）都有用到，不用另外做兩份不同顏色的素材。
export function SendIcon({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={className}
      style={{
        display: "inline-block",
        backgroundColor: "currentColor",
        WebkitMaskImage: "url(/images/send-icon.webp)",
        maskImage: "url(/images/send-icon.webp)",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  )
}
