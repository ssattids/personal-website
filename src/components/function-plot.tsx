import { useId, useState } from "react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"

export type PlotSeries = {
  label: string
  fn: (x: number) => number
  color: string
  // faded series stay on the chart for reference but drop out of the readout
  muted?: boolean
  dashed?: boolean
}

export type PlotMarker = {
  x: number
  y: number
  color: string
  label?: string
}

// viewBox units; the svg scales to its container width
const W = 560
const H = 320
const PAD = { top: 16, right: 20, bottom: 40, left: 44 }
const SAMPLES = 240

// Plots one or more y = f(x) curves as lines, with axes, a hover crosshair
// that reads out every series, and optional markers pinned to points.
export function FunctionPlot({
  series,
  x: [x0, x1],
  y: [y0, y1],
  xTicks = 5,
  yTicks = 5,
  xLabel,
  yLabel,
  markers = [],
  guides = [],
  className,
}: {
  series: PlotSeries[]
  x: [number, number]
  y: [number, number]
  xTicks?: number
  yTicks?: number
  xLabel?: string
  yLabel?: string
  markers?: PlotMarker[]
  // horizontal reference lines, e.g. a floor the curve can't go below
  guides?: { y: number; label: string }[]
  className?: string
}) {
  const uid = useId().replace(/:/g, "")
  const [hoverX, setHoverX] = useState<number | null>(null)

  const sx = (x: number) => PAD.left + ((x - x0) / (x1 - x0)) * (W - PAD.left - PAD.right)
  const sy = (y: number) => H - PAD.bottom - ((y - y0) / (y1 - y0)) * (H - PAD.top - PAD.bottom)

  const paths = series.map((s) => {
    let d = ""
    let pen = false
    for (let i = 0; i <= SAMPLES; i++) {
      const x = x0 + ((x1 - x0) * i) / SAMPLES
      const y = s.fn(x)
      // lift the pen over infinities so curves like -ln(x) don't draw a wall at x = 0
      if (!Number.isFinite(y)) {
        pen = false
        continue
      }
      // clamp a little past the frame; the clip path trims the rest
      const py = sy(Math.max(Math.min(y, y1 + (y1 - y0)), y0 - (y1 - y0)))
      d += `${pen ? "L" : "M"}${sx(x).toFixed(2)},${py.toFixed(2)}`
      pen = true
    }
    return d
  })

  const ticks = (a: number, b: number, n: number) => Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n)
  const fmt = (v: number) => (Math.abs(v) >= 10 || Number.isInteger(v) ? v.toFixed(0) : v.toFixed(1))

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const box = e.currentTarget.ownerSVGElement!.getBoundingClientRect()
    const px = ((e.clientX - box.left) / box.width) * W
    const x = x0 + ((px - PAD.left) / (W - PAD.left - PAD.right)) * (x1 - x0)
    setHoverX(Math.min(Math.max(x, x0), x1))
  }

  const readout = hoverX === null ? [] : series.filter((s) => !s.muted)
  const tipLeft = hoverX !== null && sx(hoverX) > W * 0.6

  return (
    <div className={cn("relative", className)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full touch-none overflow-visible select-none">
        <defs>
          <clipPath id={`${uid}-frame`}>
            <rect x={PAD.left} y={PAD.top - 6} width={W - PAD.left - PAD.right} height={H - PAD.top - PAD.bottom + 6} />
          </clipPath>
        </defs>

        {/* recessive grid */}
        {ticks(y0, y1, yTicks).map((t) => (
          <g key={`y${t}`}>
            <line x1={PAD.left} x2={W - PAD.right} y1={sy(t)} y2={sy(t)} className="stroke-white/8" />
            <text x={PAD.left - 8} y={sy(t)} dy="0.32em" textAnchor="end" className="fill-muted-foreground font-mono text-[11px]">
              {fmt(t)}
            </text>
          </g>
        ))}
        {ticks(x0, x1, xTicks).map((t) => (
          <text key={`x${t}`} x={sx(t)} y={H - PAD.bottom + 18} textAnchor="middle" className="fill-muted-foreground font-mono text-[11px]">
            {fmt(t)}
          </text>
        ))}
        <line x1={PAD.left} x2={W - PAD.right} y1={sy(y0)} y2={sy(y0)} className="stroke-white/25" />
        {xLabel && (
          <text x={(PAD.left + W - PAD.right) / 2} y={H - 4} textAnchor="middle" className="fill-muted-foreground text-[12px]">
            {xLabel}
          </text>
        )}
        {yLabel && (
          <text x={PAD.left} y={PAD.top - 4} className="fill-muted-foreground text-[12px]" dy="-0.4em">
            {yLabel}
          </text>
        )}

        {guides.map((g) => (
          <g key={g.label}>
            <line x1={PAD.left} x2={W - PAD.right} y1={sy(g.y)} y2={sy(g.y)} strokeDasharray="3 4" className="stroke-white/40" />
            <text x={W - PAD.right} y={sy(g.y)} dy="1.3em" textAnchor="end" className="fill-muted-foreground font-mono text-[11px]">
              {g.label}
            </text>
          </g>
        ))}

        <g clipPath={`url(#${uid}-frame)`}>
          {series.map((s, i) => (
            <motion.path
              key={s.label}
              d={paths[i]}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray={s.dashed ? "6 5" : undefined}
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              animate={{ opacity: s.muted ? 0.25 : 1 }}
              transition={{ pathLength: { duration: 0.7, ease: "easeOut" }, opacity: { duration: 0.2 } }}
            />
          ))}
        </g>

        {markers.map((m, i) => (
          <g key={i}>
            <line x1={sx(m.x)} x2={sx(m.x)} y1={sy(y0)} y2={sy(Math.min(m.y, y1))} stroke={m.color} strokeOpacity={0.4} strokeDasharray="2 3" />
            <circle cx={sx(m.x)} cy={sy(Math.min(m.y, y1))} r={6} fill={m.color} className="stroke-background" strokeWidth={2} />
            {m.label && (
              <text
                x={sx(m.x) + (sx(m.x) > W * 0.7 ? -12 : 12)}
                y={sy(Math.min(m.y, y1))}
                dy="-0.6em"
                textAnchor={sx(m.x) > W * 0.7 ? "end" : "start"}
                className="fill-foreground font-mono text-[12px] font-medium"
              >
                {m.label}
              </text>
            )}
          </g>
        ))}

        {hoverX !== null && (
          <g className="pointer-events-none">
            <line x1={sx(hoverX)} x2={sx(hoverX)} y1={PAD.top} y2={sy(y0)} className="stroke-white/40" />
            {readout.map((s) => {
              const v = s.fn(hoverX)
              return Number.isFinite(v) && v <= y1 ? (
                <circle key={s.label} cx={sx(hoverX)} cy={sy(v)} r={4} fill={s.color} className="stroke-background" strokeWidth={2} />
              ) : null
            })}
          </g>
        )}

        {/* hit area covers the whole plot so the crosshair just follows x */}
        <rect
          x={PAD.left}
          y={PAD.top}
          width={W - PAD.left - PAD.right}
          height={H - PAD.top - PAD.bottom}
          fill="transparent"
          onPointerMove={onMove}
          onPointerDown={onMove}
          onPointerLeave={() => setHoverX(null)}
        />
      </svg>

      {hoverX !== null && readout.length > 0 && (
        <div
          className="pointer-events-none absolute top-2 rounded-lg border bg-popover/95 px-3 py-2 font-mono text-xs shadow-lg backdrop-blur"
          style={tipLeft ? { right: `${100 - (sx(hoverX) / W) * 100 + 2}%` } : { left: `${(sx(hoverX) / W) * 100 + 2}%` }}
        >
          <p className="text-muted-foreground">x = {hoverX.toFixed(2)}</p>
          {readout.map((s) => (
            <p key={s.label} className="mt-1 flex items-center gap-2 whitespace-nowrap">
              <span className="h-0.5 w-3 rounded-full" style={{ background: s.color }} />
              <span className="font-medium text-foreground">{formatValue(s.fn(hoverX))}</span>
              <span className="text-muted-foreground">{s.label}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

export function PlotLegend({ series }: { series: Pick<PlotSeries, "label" | "color" | "dashed">[] }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs text-muted-foreground">
      {series.map((s) => (
        <span key={s.label} className="flex items-center gap-2">
          <svg width="16" height="2" aria-hidden>
            <line x1="0" x2="16" y1="1" y2="1" stroke={s.color} strokeWidth="2" strokeDasharray={s.dashed ? "4 3" : undefined} />
          </svg>
          {s.label}
        </span>
      ))}
    </div>
  )
}

function formatValue(v: number) {
  return Number.isFinite(v) ? v.toFixed(3) : "∞"
}
