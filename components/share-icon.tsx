// 分享圖示是純黑色實心 PNG（見 public/images/share-icon.webp），用 CSS mask
// 把它當形狀模板套上 currentColor，跟著文字顏色走——分享按鈕在 camp（淺色底）
// 跟 conference（深色底）都有用到，不用另外做兩份不同顏色的素材。
export function ShareIcon({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={className}
      style={{
        display: "inline-block",
        backgroundColor: "currentColor",
        WebkitMaskImage: "url(/images/share-icon.webp)",
        maskImage: "url(/images/share-icon.webp)",
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
