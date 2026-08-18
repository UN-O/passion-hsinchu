import { ImageBackground, type ImageBackgroundProps } from "./backgrounds/image-background"
import { ShaderBackground, type ShaderBackgroundProps } from "./backgrounds/shader-background"
import { CanvasBackground, type CanvasBackgroundProps } from "./backgrounds/canvas-background"
import { ColorBackground, type ColorBackgroundProps } from "./backgrounds/color-background"

export type ImmersiveBackgroundConfig =
  | ({ type: "image" } & ImageBackgroundProps)
  | ({ type: "shader" } & ShaderBackgroundProps)
  | ({ type: "canvas" } & CanvasBackgroundProps)
  | ({ type: "color" } & ColorBackgroundProps)

export function ImmersiveBackground({ background }: { background: ImmersiveBackgroundConfig }) {
  switch (background.type) {
    case "image":
      return <ImageBackground {...background} />
    case "shader":
      return <ShaderBackground {...background} />
    case "canvas":
      return <CanvasBackground {...background} />
    case "color":
      return <ColorBackground {...background} />
  }
}
