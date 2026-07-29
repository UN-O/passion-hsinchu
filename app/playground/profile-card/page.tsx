"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import ProfileCard from "@/components/ProfileCard.jsx"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DEFAULT_ICON_TILE,
  HERO_ICON_LABELS,
  campHexToRgba,
  heroAvatarDataUri,
  heroGrainUri,
  heroIconPatternUri,
} from "@/lib/hero-card-visuals"
import { campProfileResults } from "@/lib/opening-camp-content"
import "@/components/opening/camp-profile-card.css"

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="flex items-baseline justify-between gap-2 text-white/80">
        <span>{label}</span>
        {hint && <span className="font-mono text-xs text-white/50">{hint}</span>}
      </span>
      {children}
    </label>
  )
}

function Slider({
  value,
  onChange,
  min,
  max,
  step,
}: {
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-primary"
    />
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-t border-white/10 pt-4 first:border-t-0 first:pt-0">
      <h2 className="text-xs font-semibold tracking-[0.15em] text-primary uppercase">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  )
}

export default function ProfileCardPlaygroundPage() {
  const [aCount, setACount] = useState(0)
  const [heroName, setHeroName] = useState("阿光")
  const [avatarUrl, setAvatarUrl] = useState("/images/placeholder.png")

  // 以下初始值對齊目前 production（components/opening/camp-profile-card.tsx / .css）正在用的設定，
  // 打開這頁看到的就是「現在線上長怎樣」，再從這裡繼續微調。
  const [iconScale, setIconScale] = useState(0.45)
  const [iconMaskSize, setIconMaskSize] = useState(95) // width %, height derived from tile aspect ratio
  const [iconOpacity, setIconOpacity] = useState(0.27)
  const [iconBrightness, setIconBrightness] = useState(1.03)
  const [iconContrast, setIconContrast] = useState(2.34)
  const [iconSaturate, setIconSaturate] = useState(0.71)

  const [grainFreq, setGrainFreq] = useState(0.84)
  const [grainOctaves, setGrainOctaves] = useState(1)
  const [grainAlphaSlope, setGrainAlphaSlope] = useState(0.5)
  const [grainOpacity, setGrainOpacity] = useState(1)

  const [gradientFrom, setGradientFrom] = useState("#ffe9a8")
  const [gradientFromAlpha, setGradientFromAlpha] = useState(0.44)
  const [gradientTo, setGradientTo] = useState("#272016")
  const [gradientToAlpha, setGradientToAlpha] = useState(0.92)
  const [gradientAngle, setGradientAngle] = useState(160)

  const [glowColor, setGlowColor] = useState("#eee9af")
  const [glowAlpha, setGlowAlpha] = useState(1)
  const [glowSize, setGlowSize] = useState(80)

  const [hoverShineOpacity, setHoverShineOpacity] = useState(0.43)
  const [enableTilt, setEnableTilt] = useState(true)
  const [enableMobileTilt, setEnableMobileTilt] = useState(true)
  const [mobileTiltSensitivity, setMobileTiltSensitivity] = useState(5)

  const [drawDuration, setDrawDuration] = useState(1.8)
  const [glowDuration, setGlowDuration] = useState(2.65)
  const [replayKey, setReplayKey] = useState(0)

  const result = campProfileResults.find((r) => r.aCount === aCount) ?? campProfileResults[2]

  const iconTileConfig = useMemo(
    () => ({
      ...DEFAULT_ICON_TILE,
      scale: iconScale,
    }),
    [iconScale]
  )

  const iconUrl = useMemo(() => heroIconPatternUri(aCount, iconTileConfig), [aCount, iconTileConfig])
  const grainUrl = useMemo(
    () => heroGrainUri({ baseFrequency: grainFreq, numOctaves: grainOctaves, alphaSlope: grainAlphaSlope, opacity: grainOpacity }),
    [grainFreq, grainOctaves, grainAlphaSlope, grainOpacity]
  )

  const innerGradient = `linear-gradient(${gradientAngle}deg, ${campHexToRgba(gradientFrom, gradientFromAlpha)} 0%, ${campHexToRgba(gradientTo, gradientToAlpha)} 100%)`
  const behindGlowColor = campHexToRgba(glowColor, glowAlpha)
  const iconMaskSizeHeight = (iconMaskSize * 54) / 56

  const stageStyle = {
    "--pc-draw-duration": `${drawDuration}s`,
    "--pc-glow-duration": `${glowDuration}s`,
  } as React.CSSProperties

  const cardStyle = {
    "--pc-icon-mask-size": `${iconMaskSize}% ${iconMaskSizeHeight.toFixed(1)}%`,
    "--pc-icon-brightness": iconBrightness,
    "--pc-icon-contrast": iconContrast,
    "--pc-icon-saturate": iconSaturate,
    "--pc-icon-opacity": iconOpacity,
    "--pc-hover-shine-opacity": hoverShineOpacity,
  } as React.CSSProperties

  const configSnippet = `{
  avatarUrl: ${JSON.stringify(avatarUrl)},
  icon: { scale: ${iconScale}, maskSize: "${iconMaskSize}% ${iconMaskSizeHeight.toFixed(1)}%", opacity: ${iconOpacity}, brightness: ${iconBrightness}, contrast: ${iconContrast}, saturate: ${iconSaturate} },
  grain: { baseFrequency: ${grainFreq}, numOctaves: ${grainOctaves}, alphaSlope: ${grainAlphaSlope}, opacity: ${grainOpacity} },
  innerGradient: ${JSON.stringify(innerGradient)},
  behindGlowColor: ${JSON.stringify(behindGlowColor)},
  behindGlowSize: "${glowSize}%",
  hoverShineOpacity: ${hoverShineOpacity},
  enableTilt: ${enableTilt},
  enableMobileTilt: ${enableMobileTilt},
  mobileTiltSensitivity: ${mobileTiltSensitivity},
  drawDuration: "${drawDuration}s",
  glowDuration: "${glowDuration}s",
}`

  return (
    <div className="flex min-h-svh flex-col bg-background text-white lg:flex-row">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 lg:sticky lg:top-0 lg:h-svh">
        <p className="text-sm text-white/50">Profile Card Playground</p>
        <div key={replayKey} className="camp-profile-card-stage" style={stageStyle}>
          <div className="camp-profile-card-draw">
            <div className="relative w-full">
              <Image
                src="/images/passion-logo.png"
                alt="PASSION®"
                width={979}
                height={178}
                className="absolute top-6 left-1/2 z-10 h-6 w-auto -translate-x-1/2 brightness-0 invert"
              />
              {/* ProfileCard.jsx 不會轉發外部 style prop 到卡片節點，這裡包一層 div 用
                  inline style 靠 CSS 變數繼承覆寫 camp-profile-card.css 裡的 :root 預設值。 */}
              <div style={cardStyle}>
                <ProfileCard
                  className="camp-profile-card"
                  name={result.name}
                  title={`「${result.quote}」`}
                  handle={heroName}
                  status="已取得勇者職業"
                  avatarUrl={avatarUrl}
                  miniAvatarUrl={heroAvatarDataUri(heroName)}
                  iconUrl={iconUrl}
                  grainUrl={grainUrl}
                  innerGradient={innerGradient}
                  behindGlowEnabled
                  behindGlowColor={behindGlowColor}
                  behindGlowSize={`${glowSize}%`}
                  enableTilt={enableTilt}
                  enableMobileTilt={enableMobileTilt}
                  mobileTiltSensitivity={mobileTiltSensitivity}
                />
              </div>
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={() => setReplayKey((k) => k + 1)}>
          重播入場動畫
        </Button>
      </div>

      <div className="w-full flex-none overflow-y-auto border-t border-white/10 p-6 lg:h-svh lg:w-[380px] lg:border-t-0 lg:border-l">
        <div className="flex flex-col gap-6 pb-10">
          <Section title="內容">
            <Field label="勇者 ID">
              <Input value={heroName} onChange={(e) => setHeroName(e.target.value)} />
            </Field>
            <Field label="結果">
              <select
                value={aCount}
                onChange={(e) => setACount(Number(e.target.value))}
                className="h-9 w-full rounded-3xl border border-transparent bg-input/50 px-3 text-sm text-white outline-none"
              >
                {campProfileResults.map((r) => (
                  <option key={r.aCount} value={r.aCount} className="text-black">
                    {r.name}（{HERO_ICON_LABELS[r.aCount]}）
                  </option>
                ))}
              </select>
            </Field>
            <Field label="avatarUrl">
              <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
            </Field>
          </Section>

          <Section title="Icon pattern">
            <Field label="大小 scale" hint={iconScale.toFixed(2)}>
              <Slider value={iconScale} onChange={setIconScale} min={0.15} max={1.1} step={0.01} />
            </Field>
            <Field label="間距 mask-size" hint={`${iconMaskSize}%`}>
              <Slider value={iconMaskSize} onChange={setIconMaskSize} min={25} max={160} step={1} />
            </Field>
            <Field label="靜止透明度" hint={iconOpacity.toFixed(2)}>
              <Slider value={iconOpacity} onChange={setIconOpacity} min={0} max={1} step={0.01} />
            </Field>
            <Field label="亮度" hint={iconBrightness.toFixed(2)}>
              <Slider value={iconBrightness} onChange={setIconBrightness} min={0} max={2} step={0.01} />
            </Field>
            <Field label="對比" hint={iconContrast.toFixed(2)}>
              <Slider value={iconContrast} onChange={setIconContrast} min={0.2} max={3} step={0.01} />
            </Field>
            <Field label="飽和度" hint={iconSaturate.toFixed(2)}>
              <Slider value={iconSaturate} onChange={setIconSaturate} min={0} max={1} step={0.01} />
            </Field>
          </Section>

          <Section title="Grain 顆粒">
            <Field label="頻率 baseFrequency" hint={grainFreq.toFixed(2)}>
              <Slider value={grainFreq} onChange={setGrainFreq} min={0.1} max={3} step={0.01} />
            </Field>
            <Field label="層次 numOctaves" hint={String(grainOctaves)}>
              <Slider value={grainOctaves} onChange={(v) => setGrainOctaves(Math.round(v))} min={1} max={6} step={1} />
            </Field>
            <Field label="顆粒對比 alphaSlope" hint={grainAlphaSlope.toFixed(2)}>
              <Slider value={grainAlphaSlope} onChange={setGrainAlphaSlope} min={0.5} max={5} step={0.05} />
            </Field>
            <Field label="透明度" hint={grainOpacity.toFixed(2)}>
              <Slider value={grainOpacity} onChange={setGrainOpacity} min={0} max={1} step={0.01} />
            </Field>
          </Section>

          <Section title="背景漸層 innerGradient">
            <Field label="起始色">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={gradientFrom}
                  onChange={(e) => setGradientFrom(e.target.value)}
                  className="h-9 w-12 shrink-0 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                />
                <Slider value={gradientFromAlpha} onChange={setGradientFromAlpha} min={0} max={1} step={0.01} />
              </div>
            </Field>
            <Field label="結束色">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={gradientTo}
                  onChange={(e) => setGradientTo(e.target.value)}
                  className="h-9 w-12 shrink-0 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                />
                <Slider value={gradientToAlpha} onChange={setGradientToAlpha} min={0} max={1} step={0.01} />
              </div>
            </Field>
            <Field label="角度" hint={`${gradientAngle}deg`}>
              <Slider value={gradientAngle} onChange={setGradientAngle} min={0} max={360} step={1} />
            </Field>
          </Section>

          <Section title="背後光暈 behindGlow">
            <Field label="顏色">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={glowColor}
                  onChange={(e) => setGlowColor(e.target.value)}
                  className="h-9 w-12 shrink-0 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                />
                <Slider value={glowAlpha} onChange={setGlowAlpha} min={0} max={1} step={0.01} />
              </div>
            </Field>
            <Field label="範圍 size" hint={`${glowSize}%`}>
              <Slider value={glowSize} onChange={setGlowSize} min={5} max={90} step={1} />
            </Field>
          </Section>

          <Section title="互動">
            <Field label="互動反射光透明度" hint={hoverShineOpacity.toFixed(2)}>
              <Slider value={hoverShineOpacity} onChange={setHoverShineOpacity} min={0} max={1} step={0.01} />
            </Field>
            <Field label="mobileTiltSensitivity" hint={String(mobileTiltSensitivity)}>
              <Slider value={mobileTiltSensitivity} onChange={setMobileTiltSensitivity} min={1} max={15} step={1} />
            </Field>
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input type="checkbox" checked={enableTilt} onChange={(e) => setEnableTilt(e.target.checked)} />
              enableTilt
            </label>
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={enableMobileTilt}
                onChange={(e) => setEnableMobileTilt(e.target.checked)}
              />
              enableMobileTilt
            </label>
          </Section>

          <Section title="入場動畫">
            <Field label="卡片落下＋翻正" hint={`${drawDuration.toFixed(2)}s`}>
              <Slider value={drawDuration} onChange={setDrawDuration} min={0.3} max={4} step={0.05} />
            </Field>
            <Field label="發光脈衝" hint={`${glowDuration.toFixed(2)}s`}>
              <Slider value={glowDuration} onChange={setGlowDuration} min={0.3} max={4} step={0.05} />
            </Field>
          </Section>

          <Section title="匯出設定">
            <textarea
              readOnly
              value={configSnippet}
              className="h-64 w-full resize-none rounded-2xl border border-white/10 bg-black/30 p-3 font-mono text-xs text-white/80"
            />
          </Section>
        </div>
      </div>
    </div>
  )
}
