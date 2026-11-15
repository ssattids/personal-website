import { useEffect, useRef } from "react"

type Node = { x: number; y: number; vx: number; vy: number; r: number }
type Pulse = { from: number; to: number; t: number; speed: number; color: string }

const LINK_DISTANCE = 150
const SIGNALS_DARK = ["#a78bfa", "#67d4f5", "#5ff0a5"]
const SIGNALS_LIGHT = ["#7c3aed", "#0284c7", "#059669"]

export function AgentGraphCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const mouse = { x: -9999, y: -9999 }
    let nodes: Node[] = []
    let pulses: Pulse[] = []
    let width = 0
    let height = 0
    let frame = 0
    let visible = true

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.round(Math.min(90, (width * height) / 14000))
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.8 + 1,
      }))
      pulses = []
    }

    const neighbors = (i: number) => {
      const out: number[] = []
      for (let j = 0; j < nodes.length; j++) {
        if (j === i) continue
        const dx = nodes[i].x - nodes[j].x
        const dy = nodes[i].y - nodes[j].y
        if (dx * dx + dy * dy < LINK_DISTANCE * LINK_DISTANCE) out.push(j)
      }
      return out
    }

    const spawnPulse = (signals: string[], from?: number) => {
      const start = from ?? Math.floor(Math.random() * nodes.length)
      const options = neighbors(start)
      if (!options.length) return
      pulses.push({
        from: start,
        to: options[Math.floor(Math.random() * options.length)],
        t: 0,
        speed: 0.012 + Math.random() * 0.02,
        color: signals[Math.floor(Math.random() * signals.length)],
      })
    }

    const draw = () => {
      const dark = document.documentElement.classList.contains("dark")
      const signals = dark ? SIGNALS_DARK : SIGNALS_LIGHT
      const ink = dark ? "255,255,255" : "15,23,42"
      ctx.clearRect(0, 0, width, height)

      for (const n of nodes) {
        if (!reduceMotion) {
          const dx = mouse.x - n.x
          const dy = mouse.y - n.y
          const dist = Math.hypot(dx, dy)
          if (dist < 180 && dist > 1) {
            n.vx += (dx / dist) * 0.012
            n.vy += (dy / dist) * 0.012
          }
          n.vx *= 0.99
          n.vy *= 0.99
          n.x += n.vx
          n.y += n.vy
          if (n.x < 0 || n.x > width) n.vx *= -1
          if (n.y < 0 || n.y > height) n.vy *= -1
        }
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]
          const b = nodes[j]
          const d = Math.hypot(a.x - b.x, a.y - b.y)
          if (d < LINK_DISTANCE) {
            ctx.strokeStyle = `rgba(${ink},${(1 - d / LINK_DISTANCE) * 0.14})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      for (const n of nodes) {
        const near = Math.hypot(mouse.x - n.x, mouse.y - n.y) < 120
        ctx.fillStyle = near ? signals[0] : `rgba(${ink},0.45)`
        ctx.beginPath()
        ctx.arc(n.x, n.y, near ? n.r + 1.2 : n.r, 0, Math.PI * 2)
        ctx.fill()
      }

      if (!reduceMotion) {
        if (pulses.length < 14 && Math.random() < 0.08) spawnPulse(signals)
        pulses = pulses.filter((p) => {
          p.t += p.speed
          const a = nodes[p.from]
          const b = nodes[p.to]
          if (!a || !b) return false
          if (p.t >= 1) {
            // hand the signal to the next agent in the graph
            if (Math.random() < 0.7) spawnPulse([p.color], p.to)
            return false
          }
          const x = a.x + (b.x - a.x) * p.t
          const y = a.y + (b.y - a.y) * p.t
          ctx.shadowBlur = 12
          ctx.shadowColor = p.color
          ctx.fillStyle = p.color
          ctx.beginPath()
          ctx.arc(x, y, 2.4, 0, Math.PI * 2)
          ctx.fill()
          ctx.shadowBlur = 0
          return true
        })
      }
    }

    const loop = () => {
      if (visible) draw()
      frame = requestAnimationFrame(loop)
    }

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }
    const onLeave = () => {
      mouse.x = -9999
      mouse.y = -9999
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
    })
    observer.observe(canvas)

    resize()
    if (reduceMotion) draw()
    else frame = requestAnimationFrame(loop)

    window.addEventListener("resize", resize)
    window.addEventListener("pointermove", onMove)
    document.addEventListener("pointerleave", onLeave)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener("resize", resize)
      window.removeEventListener("pointermove", onMove)
      document.removeEventListener("pointerleave", onLeave)
    }
  }, [])

  return <canvas ref={canvasRef} className={className} aria-hidden />
}
