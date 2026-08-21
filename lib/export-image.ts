import { toBlob } from "html-to-image"

export async function downloadNodeAsImage(node: HTMLElement | null, filename: string) {
  if (!node) return

  const blob = await toBlob(node, { pixelRatio: 2 })
  if (!blob) return

  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
