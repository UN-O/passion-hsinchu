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
      key={src}
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes="100vw"
      className="object-cover animate-in fade-in-0 duration-500"
      style={objectPosition ? { objectPosition } : undefined}
    />
  )
}
