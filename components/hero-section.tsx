import Image from "next/image"
import { HeroCta } from "@/components/hero-cta"
import SideRays from "@/components/side-rays"
import { siteConfig } from "@/lib/site-config"

export function HeroSection() {
  return (
    <section
      id="top"
      className="relative flex min-h-[calc(100svh-57px)] flex-col items-center justify-center overflow-hidden px-4 py-16 text-center sm:px-6"
    >
      <div className="absolute inset-0 z-0">
        <SideRays
          rayColor1="#F6ED8E"
          rayColor2="#C9B85E"
          speed={0.6}
          intensity={1.2}
          spread={1.2}
          origin="top-right"
          saturation={1}
          blend={0.5}
          falloff={2}
          opacity={0.5}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <Image
          src="/images/passion-logo.png"
          alt="PASSION®"
          width={979}
          height={178}
          priority
          className="h-10 w-auto brightness-0 invert sm:h-14"
        />

        <h1 className="mt-8 text-3xl font-bold tracking-tight sm:text-5xl">
          《{siteConfig.themeZh}》
        </h1>
        <p className="mt-2 text-sm tracking-[0.2em] text-muted-foreground sm:text-base">
          {siteConfig.themeEn}
        </p>

        <p className="mt-6 text-base text-muted-foreground sm:text-lg">
          {siteConfig.year}.8 @{siteConfig.venue}
        </p>

        <div className="mt-10 w-full max-w-xs sm:max-w-none">
          <HeroCta />
        </div>
      </div>
    </section>
  )
}
