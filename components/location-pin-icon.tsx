// 設計組提供的定位圖示是純黑色實心 PNG（見 public/images/pin-icon.png），
// 用 CSS mask 把它當形狀模板套上白色，取代 lucide 的 MapPin，全站地點標籤統一用這個。
export function LocationPinIcon({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={className}
      style={{
        display: "inline-block",
        backgroundColor: "#fff",
        WebkitMaskImage: "url(/images/pin-icon.png)",
        maskImage: "url(/images/pin-icon.png)",
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
