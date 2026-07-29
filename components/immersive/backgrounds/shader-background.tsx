"use client"

import { useEffect, useRef } from "react"
import { Renderer, Program, Triangle, Mesh } from "ogl"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return m
    ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255]
    : [0, 0, 0]
}

const vert = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`

const frag = `precision highp float;

uniform float iTime;
uniform vec2 iResolution;
uniform vec3 iColor1;
uniform vec3 iColor2;
uniform vec3 iColor3;
uniform float iSpeed;

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  float t = iTime * iSpeed;

  vec2 p1 = vec2(0.5 + 0.35 * sin(t * 0.6), 0.5 + 0.35 * cos(t * 0.5));
  vec2 p2 = vec2(0.5 + 0.35 * cos(t * 0.4 + 2.0), 0.5 + 0.35 * sin(t * 0.7 + 1.0));
  vec2 p3 = vec2(0.5 + 0.3 * sin(t * 0.3 + 4.0), 0.5 + 0.3 * cos(t * 0.6 + 3.0));

  float w1 = 1.0 / (dot(uv - p1, uv - p1) * 8.0 + 0.2);
  float w2 = 1.0 / (dot(uv - p2, uv - p2) * 8.0 + 0.2);
  float w3 = 1.0 / (dot(uv - p3, uv - p3) * 8.0 + 0.2);
  float total = w1 + w2 + w3;

  vec3 color = (iColor1 * w1 + iColor2 * w2 + iColor3 * w3) / total;
  gl_FragColor = vec4(color, 1.0);
}`

export type ShaderBackgroundProps = {
  colors?: [string, string, string]
  speed?: number
}

export function ShaderBackground({
  colors = ["#f6ed8e", "#1a1a2e", "#0f0f1a"],
  speed = 0.4,
}: ShaderBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio, 2), alpha: false })
    const gl = renderer.gl
    gl.canvas.style.width = "100%"
    gl.canvas.style.height = "100%"
    container.appendChild(gl.canvas)

    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: [1, 1] },
      iColor1: { value: hexToRgb(colors[0]) },
      iColor2: { value: hexToRgb(colors[1]) },
      iColor3: { value: hexToRgb(colors[2]) },
      iSpeed: { value: speed },
    }

    const geometry = new Triangle(gl)
    const program = new Program(gl, { vertex: vert, fragment: frag, uniforms })
    const mesh = new Mesh(gl, { geometry, program })

    const resize = () => {
      renderer.dpr = Math.min(window.devicePixelRatio, 2)
      const { clientWidth: w, clientHeight: h } = container
      renderer.setSize(w, h)
      uniforms.iResolution.value = [w * renderer.dpr, h * renderer.dpr]
    }
    resize()
    window.addEventListener("resize", resize)

    let frameId = 0
    if (reducedMotion) {
      renderer.render({ scene: mesh })
    } else {
      const loop = (time: number) => {
        uniforms.iTime.value = time * 0.001
        renderer.render({ scene: mesh })
        frameId = requestAnimationFrame(loop)
      }
      frameId = requestAnimationFrame(loop)
    }

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener("resize", resize)
      try {
        gl.getExtension("WEBGL_lose_context")?.loseContext()
      } catch {
        // ignore teardown errors
      }
      gl.canvas.parentNode?.removeChild(gl.canvas)
    }
  }, [colors, speed, reducedMotion])

  return <div ref={containerRef} className="h-full w-full" />
}
