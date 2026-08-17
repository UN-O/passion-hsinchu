import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

// iOS 會自己把方形圖裁成圓角，不用在這裡手動裁圓——裁了反而會在
// 四個角露出透明底變黑底。這裡就滿版鋪主題色，讓 iOS 自己套遮罩。
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#F6ED8E",
        }}
      />
    ),
    { ...size }
  )
}
