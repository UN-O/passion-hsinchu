import { Diamond } from "@/components/diamond"

export function LoadingProgressBar({ active }: { active: boolean }) {
  return (
    <div
      aria-hidden
      className={
        "pointer-events-none fixed inset-0 z-[61] flex items-center justify-center transition-opacity duration-300 " +
        (active ? "opacity-100" : "opacity-0")
      }
    >
      <Diamond className="size-16 text-primary" />
    </div>
  )
}
