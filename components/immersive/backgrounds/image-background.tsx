import Image from "next/image"

export type ImageBackgroundProps = {
  src: string
  alt?: string
  priority?: boolean
  objectPosition?: string
}

export function ImageBackground({ src, alt = "", priority, objectPosition }: ImageBackgroundProps) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes="100vw"
      className="object-cover"
      style={objectPosition ? { objectPosition } : undefined}
    />
  )
}
