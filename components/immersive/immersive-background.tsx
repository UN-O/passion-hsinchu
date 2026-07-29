import { ImageBackground, type ImageBackgroundProps } from "./backgrounds/image-background"
import { ShaderBackground, type ShaderBackgroundProps } from "./backgrounds/shader-background"
import { CanvasBackground, type CanvasBackgroundProps } from "./backgrounds/canvas-background"

export type ImmersiveBackgroundConfig =
  | ({ type: "image" } & ImageBackgroundProps)
  | ({ type: "shader" } & ShaderBackgroundProps)
  | ({ type: "canvas" } & CanvasBackgroundProps)

export function ImmersiveBackground({ background }: { background: ImmersiveBackgroundConfig }) {
  switch (background.type) {
    case "image":
      return <ImageBackground {...background} />
    case "shader":
      return <ShaderBackground {...background} />
    case "canvas":
      return <CanvasBackground {...background} />
  }
}
