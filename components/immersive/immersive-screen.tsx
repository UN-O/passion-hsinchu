"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Maximize, Minimize } from "lucide-react"
import { useFullscreen } from "@/hooks/use-fullscreen"
import { ImmersiveNavProvider } from "./immersive-nav-context"
import { ImmersiveBackground, type ImmersiveBackgroundConfig } from "./immersive-background"
import { ImmersiveProgress } from "./immersive-progress"
import { TapZones } from "./tap-zones"

type ImmersiveProgressConfig = {
  mode: "auto" | "manual"
  durationMs?: number
  value?: number
  onSegmentComplete?: () => void
}

type ImmersiveScreenProps = {
  background: ImmersiveBackgroundConfig
  scrim?: boolean | number
  onBack?: () => void
  backLabel?: string
  totalSteps?: number
  index?: number
  onIndexChange?: (index: number) => void
  progress?: ImmersiveProgressConfig
  allowFullscreen?: boolean
  enableTapZones?: boolean
  enableSwipe?: boolean
  onNext?: () => void
  onPrev?: () => void
  children: React.ReactNode
}

export function ImmersiveScreen({
  background,
  scrim = true,
  onBack,
  backLabel,
  totalSteps,
  index: controlledIndex,
  onIndexChange,
  progress,
  allowFullscreen = true,
  enableTapZones = true,
  enableSwipe = true,
  onNext,
  onPrev,
  children,
}: ImmersiveScreenProps) {
  const router = useRouter()
  const [internalIndex, setInternalIndex] = useState(0)
  const index = controlledIndex ?? internalIndex

  const handleIndexChange = useCallback(
    (next: number) => {
      onIndexChange?.(next)
      if (controlledIndex === undefined) setInternalIndex(next)
    },
    [controlledIndex, onIndexChange]
  )

  const {
    ref: fullscreenRef,
    isSupported: fullscreenSupported,
    isFullscreen,
    toggle: toggleFullscreen,
  } = useFullscreen<HTMLDivElement>()

  const scrimOpacity = scrim === true ? 0.4 : scrim === false ? 0 : scrim

  return (
    <ImmersiveNavProvider
      total={totalSteps ?? Infinity}
      index={index}
      onIndexChange={handleIndexChange}
      onNext={onNext}
      onPrev={onPrev}
    >
      <div ref={fullscreenRef} className="relative h-svh w-full overflow-hidden bg-background text-white">
        <div className="absolute inset-0">
          <ImmersiveBackground background={background} />
        </div>

        {scrimOpacity > 0 && (
          <div className="absolute inset-0 bg-black" style={{ opacity: scrimOpacity }} />
        )}

        <div className="relative flex h-full flex-col">
          <header
            className="flex items-center gap-3 p-4"
            style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}
          >
            <button
              type="button"
              aria-label={backLabel ?? "返回"}
              onClick={() => (onBack ? onBack() : router.back())}
              className={
                backLabel
                  ? "flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-white/30 bg-black/20 px-3 text-sm font-medium text-white transition-colors hover:border-white/60"
                  : "flex size-9 shrink-0 items-center justify-center rounded-full border border-white/30 bg-black/20 text-white transition-colors hover:border-white/60"
              }
            >
              <ArrowLeft className="size-5" />
              {backLabel}
            </button>

            {progress && totalSteps ? (
              <ImmersiveProgress
                segments={totalSteps}
                mode={progress.mode}
                durationMs={progress.durationMs}
                value={progress.value}
                onSegmentComplete={progress.onSegmentComplete}
              />
            ) : (
              <div className="flex-1" />
            )}

            {allowFullscreen && fullscreenSupported && (
              <button
                type="button"
                aria-label={isFullscreen ? "退出全螢幕" : "全螢幕"}
                onClick={toggleFullscreen}
                className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/30 bg-black/20 text-white transition-colors hover:border-white/60"
              >
                {isFullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
              </button>
            )}
          </header>

          <div className="relative flex-1 overflow-x-hidden overflow-y-auto">
            {children}
            {(enableTapZones || enableSwipe) && (
              <TapZones enableTap={enableTapZones} enableSwipe={enableSwipe} />
            )}
          </div>
        </div>
      </div>
    </ImmersiveNavProvider>
  )
}
