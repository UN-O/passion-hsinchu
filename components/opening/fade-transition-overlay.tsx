export function FadeTransitionOverlay({ active }: { active: boolean }) {
  return (
    <div
      aria-hidden
      className={
        "pointer-events-none fixed inset-0 z-[60] bg-black transition-opacity duration-500 " +
        (active ? "opacity-100" : "opacity-0")
      }
    />
  )
}
