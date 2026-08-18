export type ColorBackgroundProps = {
  color: string
}

export function ColorBackground({ color }: ColorBackgroundProps) {
  return <div className="h-full w-full" style={{ backgroundColor: color }} />
}
