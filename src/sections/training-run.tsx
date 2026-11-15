import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"

import { trainingRun } from "@/data/content"
import { cn } from "@/lib/utils"
import { Panel } from "@/components/panel"
import { SectionHeading } from "@/components/section-heading"
import { Card } from "@/components/ui/card"

const W = 800
const H = 320
const PAD = { top: 20, right: 30, bottom: 40, left: 50 }

const years = trainingRun.map((p) => p.year)
const minYear = Math.min(...years)
const maxYear = Math.max(...years) + 1

const x = (year: number) =>
  PAD.left + ((year - minYear) / (maxYear - minYear)) * (W - PAD.left - PAD.right)
const y = (loss: number) => PAD.top + (1 - loss) * (H - PAD.top - PAD.bottom)

// smooth curve through the checkpoints (Catmull-Rom → cubic Bézier)
function smoothPath(points: { x: number; y: number }[]) {
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`
  }
  return d
}

// a noisy "raw" loss, like a real training log
const noisy = (() => {
  const pts: { x: number; y: number }[] = []
  let seed = 7
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) - 0.5
  for (let i = 0; i < trainingRun.length - 1; i++) {
    const a = trainingRun[i]
    const b = trainingRun[i + 1]
    for (let t = 0; t < 1; t += 0.08) {
      const year = a.year + (b.year - a.year) * t
      const loss = a.loss + (b.loss - a.loss) * t + rand() * 0.06
      pts.push({ x: x(year), y: y(Math.min(1, Math.max(0, loss))) })
    }
  }
  const last = trainingRun[trainingRun.length - 1]
  pts.push({ x: x(last.year), y: y(last.loss) })
  return pts.map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`).join(" ")
})()

const curve = smoothPath(trainingRun.map((p) => ({ x: x(p.year), y: y(p.loss) })))

export function TrainingRun() {
  const [active, setActive] = useState(trainingRun.length - 1)
  const point = trainingRun[active]

  return (
    <Panel id="story">
      <div className="mx-auto max-w-5xl px-6 py-28">
        <SectionHeading
          index="02"
          eyebrow="origin story"
          title={
            <>
              Loss goes down. <span className="text-muted-foreground">Grit goes up.</span>
            </>
          }
        >
          I started in economics. Then came night classes at Harvard Extension while I
          worked part-time at a furniture store. Here's the training run.
        </SectionHeading>

        <Card className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5 font-mono text-xs text-muted-foreground">
            <span>
              <span className="text-signal-3">$</span> python train.py --model salar --epochs 2011..present
            </span>
            <span>lr_scheduler=caffeine · optimizer=night_classes</span>
          </div>

          <div className="p-4">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Career progress drawn as a decreasing loss curve">
              {[0, 0.25, 0.5, 0.75, 1].map((l) => (
                <g key={l}>
                  <line x1={PAD.left} x2={W - PAD.right} y1={y(l)} y2={y(l)} stroke="currentColor" strokeOpacity={0.08} />
                  <text x={PAD.left - 10} y={y(l) + 3} textAnchor="end" className="fill-muted-foreground font-mono text-[10px]">
                    {l.toFixed(2)}
                  </text>
                </g>
              ))}
              {trainingRun.map((p) => (
                <text key={p.year} x={x(p.year)} y={H - 14} textAnchor="middle" className="fill-muted-foreground font-mono text-[10px]">
                  {p.year}
                </text>
              ))}
              <text x={PAD.left} y={12} className="fill-muted-foreground font-mono text-[10px]">loss</text>
              <text x={W - PAD.right} y={H - 2} textAnchor="end" className="fill-muted-foreground font-mono text-[10px]">epoch (year)</text>

              <path d={noisy} fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth={1} />
              <motion.path
                d={`${curve} L ${x(trainingRun[trainingRun.length - 1].year)} ${y(0)} L ${x(minYear)} ${y(0)} Z`}
                fill="var(--signal-2)"
                fillOpacity={0.06}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 1.2, duration: 0.8 }}
              />
              <motion.path
                d={curve}
                fill="none"
                stroke="var(--signal-2)"
                strokeWidth={3}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />

              {trainingRun.map((p, i) => (
                <g
                  key={p.year}
                  className="cursor-pointer"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => setActive(i)}
                >
                  <circle cx={x(p.year)} cy={y(p.loss)} r={18} fill="transparent" />
                  {i === active && (
                    <line x1={x(p.year)} x2={x(p.year)} y1={y(p.loss)} y2={y(0)} stroke="var(--signal-2)" strokeDasharray="3 3" strokeOpacity={0.6} />
                  )}
                  <motion.circle
                    cx={x(p.year)}
                    cy={y(p.loss)}
                    r={i === active ? 7 : 4.5}
                    className={cn(i === active ? "fill-signal-2" : "fill-background")}
                    stroke="var(--signal-2)"
                    strokeWidth={2}
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.25 * i, type: "spring" }}
                  />
                </g>
              ))}
            </svg>
          </div>

          <div className="grid border-t sm:grid-cols-[1fr_auto]">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                className="px-5 py-4"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <p className="font-mono text-xs text-signal-2">
                  checkpoint epoch={point.year} · loss={point.loss.toFixed(2)}
                </p>
                <p className="mt-1 text-lg font-medium tracking-[-0.02em]">{point.label}</p>
                <p className="text-sm text-muted-foreground">{point.note}</p>
              </motion.div>
            </AnimatePresence>
            <div className="flex items-center gap-1 border-t px-5 py-3 sm:border-t-0 sm:border-l">
              {trainingRun.map((p, i) => (
                <button
                  key={p.year}
                  onClick={() => setActive(i)}
                  aria-label={`Show ${p.year}: ${p.label}`}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    i === active ? "w-6 bg-signal-2" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60",
                  )}
                />
              ))}
            </div>
          </div>
        </Card>
      </div>
    </Panel>
  )
}
