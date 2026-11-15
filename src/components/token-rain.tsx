import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { TOKEN_RAIN_EVENT } from "@/lib/sections"

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"]
const TOKENS = ["Ġthe", "Ġagent", "<|eot|>", "▁data", "##ing", "Ġloss", "</s>", "Ġgraph", "<pad>", "Ġspark", "Ġ∇", "ĠRAG", "[CLS]", "Ġvoice", "Ġ0.98", "[MASK]", "Ġtool_call", "<bos>"]
const DURATION = 7000

// Matrix-style rain of LLM tokens. Triggered by the Konami code or the command palette.
export function TokenRain() {
  const [on, setOn] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let progress = 0
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
      progress = key === KONAMI[progress] ? progress + 1 : key === KONAMI[0] ? 1 : 0
      if (progress === KONAMI.length) {
        progress = 0
        setOn(true)
      }
    }
    const onEvent = () => setOn(true)
    window.addEventListener("keydown", onKey)
    window.addEventListener(TOKEN_RAIN_EVENT, onEvent)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener(TOKEN_RAIN_EVENT, onEvent)
    }
  }, [])

  useEffect(() => {
    if (!on) return
    toast("🎉 Achievement unlocked: token rain", { description: "Sampling at temperature = ∞" })
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    const w = (canvas.width = window.innerWidth)
    const h = (canvas.height = window.innerHeight)
    const colW = 90
    const drops = Array.from({ length: Math.ceil(w / colW) }, () => ({
      y: Math.random() * -h,
      speed: 2 + Math.random() * 5,
      hue: [290, 215, 155][Math.floor(Math.random() * 3)],
    }))
    const start = performance.now()
    let frame = 0

    const draw = (now: number) => {
      const t = now - start
      ctx.fillStyle = "rgba(10, 10, 20, 0.12)"
      ctx.fillRect(0, 0, w, h)
      ctx.font = "14px ui-monospace, SFMono-Regular, Menlo, monospace"
      drops.forEach((d, i) => {
        const token = TOKENS[Math.floor(Math.random() * TOKENS.length)]
        ctx.fillStyle = `hsl(${d.hue} 90% 70%)`
        ctx.fillText(token, i * colW + 8, d.y)
        d.y += d.speed * 4
        if (d.y > h + 20) d.y = Math.random() * -200
      })
      if (t < DURATION) frame = requestAnimationFrame(draw)
      else setOn(false)
    }
    frame = requestAnimationFrame(draw)

    const stop = () => setOn(false)
    window.addEventListener("keydown", stop, { once: true })
    window.addEventListener("pointerdown", stop, { once: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("keydown", stop)
      window.removeEventListener("pointerdown", stop)
    }
  }, [on])

  if (!on) return null
  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[100] opacity-90" aria-hidden />
}
