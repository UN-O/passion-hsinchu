"use client"

import { useEffect, useState } from "react"
import { ImmersiveScreen } from "@/components/immersive/immersive-screen"
import { useImmersiveNav } from "@/components/immersive/immersive-nav-context"
import { Button } from "@/components/ui/button"
import { QuizOptionBox } from "@/components/opening/quiz-option-box"
import { useCampFlow } from "@/components/opening/camp-flow-context"
import { useOpeningStepAdvance } from "@/hooks/use-opening-step-advance"
import { OpeningTransitionProvider } from "@/components/opening/opening-transition"
import { campQuizQuestions } from "@/lib/opening-camp-content"
import { openingGradients } from "@/lib/opening-gradients"
import { campStepFromPath, type CampStep } from "@/lib/opening-steps"

export const quizImages = campQuizQuestions.flatMap((question) =>
  question.options.map((option) => option.imageSrc).filter((src): src is string => Boolean(src))
)

function QuizContent({ onStepChange }: { onStepChange: (step: CampStep) => void }) {
  const { index } = useImmersiveNav()
  const { answers, setAnswer } = useCampFlow()
  const advance = useOpeningStepAdvance("/opening/camp/result")
  const question = campQuizQuestions[index]
  const selected = answers[question.id]

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-6 text-center">
      <p className="text-sm tracking-[0.2em] text-white/60">
        第 {index + 1} 題 / 共 {campQuizQuestions.length} 題
      </p>
      <h2 className="text-2xl font-bold sm:text-3xl">{question.question}</h2>

      <div className="grid w-full max-w-sm grid-cols-2 gap-4">
        {question.options.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setAnswer(question.id, option.key)}
            className={
              selected === option.key
                ? "flex flex-col items-center gap-3 rounded-2xl border border-primary p-4 text-primary"
                : "flex flex-col items-center gap-3 rounded-2xl border border-white/30 p-4 text-white"
            }
          >
            <QuizOptionBox imageSrc={option.imageSrc} alt={option.label} />
            <span className="text-sm font-medium">{option.label}</span>
          </button>
        ))}
      </div>

      <Button size="lg" disabled={!selected} onClick={advance}>
        {index === campQuizQuestions.length - 1 ? "查看結果" : "下一題"}
      </Button>
    </div>
  )
}

export function CampQuizStep({ onStepChange }: { onStepChange: (step: CampStep) => void }) {
  const { heroName } = useCampFlow()
  const [index, setIndex] = useState(0)
  const missingHeroName = !heroName.trim()

  useEffect(() => {
    if (missingHeroName) onStepChange("welcome")
  }, [missingHeroName, onStepChange])

  if (missingHeroName) return null

  return (
    <OpeningTransitionProvider onNavigate={(path) => onStepChange(campStepFromPath(path))}>
      <ImmersiveScreen
        background={{ type: "shader", colors: openingGradients.campQuiz }}
        enableTapZones={false}
        enableSwipe={false}
        totalSteps={campQuizQuestions.length}
        index={index}
        onIndexChange={setIndex}
        progress={{ mode: "manual", value: 0 }}
        onBack={() => (index === 0 ? onStepChange("welcome") : setIndex(index - 1))}
      >
        <QuizContent onStepChange={onStepChange} />
      </ImmersiveScreen>
    </OpeningTransitionProvider>
  )
}
