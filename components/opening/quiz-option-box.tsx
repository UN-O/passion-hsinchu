import Image from "next/image"

export function QuizOptionBox({ imageSrc, alt }: { imageSrc?: string; alt: string }) {
  if (!imageSrc) {
    return <div className="aspect-square w-full max-w-24 rounded-xl border border-white/30" />
  }

  return (
    <div className="relative aspect-square w-full max-w-24 overflow-hidden rounded-xl border border-white/30 bg-white/10">
      <div className="absolute inset-0 -m-[5px] overflow-hidden rounded-lg">
        <Image src={imageSrc} alt={alt} fill className="object-contain mix-blend-screen" />
      </div>
    </div>
  )
}
