import { motion, useReducedMotion } from "motion/react"

import { STREAM_PERIOD, streamTransition } from "@/lib/stream"

// Readings stream from several data center devices along converging wires into an IoT
// cloud, which streams them on to one dashboard. The wires clip what rides
// them, so readings slide out of one piece and into the next.
const HEIGHT = 40
const LANE = 40
const MID = HEIGHT / 2
const DEVICES = [6, 20, 34] // vertical centre of each device
const PER_WIRE = 2
const DOT = 3
const OUT_LANE = 32
const OUT_DOTS = 3
// a puffy cloud: a flat base with four bumps along the top
const CLOUD = "M9 31 A6.5 6.5 0 0 1 7 19 A7 7 0 0 1 16 11 A9 9 0 0 1 32 9 A7 7 0 0 1 40 18 A6.5 6.5 0 0 1 39 31 Z"
const CHART = [0.45, 0.7, 0.55, 0.9, 0.65]

export function DeviceDashboard() {
  const reduce = useReducedMotion()

  return (
    <div className="flex h-10 items-center" aria-hidden>
      <div className="flex flex-col justify-between" style={{ height: HEIGHT }}>
        {DEVICES.map((y) => (
          <div
            key={y}
            className="flex h-[9px] w-6 items-center gap-[3px] rounded-[2px] border border-muted-foreground/60 px-[3px]"
          >
            <span className="size-[3px] rounded-full bg-foreground/60" />
            <span className="h-px flex-1 rounded-full bg-muted-foreground/60" />
          </div>
        ))}
      </div>

      <div className="relative overflow-hidden" style={{ width: LANE, height: HEIGHT }}>
        <svg className="absolute inset-0 overflow-visible" width={LANE} height={HEIGHT}>
          {DEVICES.map((y) => (
            <line key={y} x1={0} y1={y} x2={LANE} y2={MID} className="stroke-muted-foreground/25" />
          ))}
        </svg>
        {!reduce &&
          DEVICES.flatMap((y, d) =>
            Array.from({ length: PER_WIRE }, (_, k) => {
              // stagger every reading across the period so the wires never pulse in sync
              const delay = ((d / DEVICES.length + k / PER_WIRE) % 1) * STREAM_PERIOD + d * 0.25
              return (
                <motion.span
                  key={`${d}-${k}`}
                  className="absolute top-0 left-0 rounded-full bg-muted-foreground"
                  style={{ width: DOT, height: DOT, marginLeft: -DOT / 2, marginTop: -DOT / 2 }}
                  initial={{ x: 0, y }}
                  animate={{ x: [0, LANE + DOT], y: [y, MID] }}
                  transition={streamTransition(delay)}
                />
              )
            })
          )}
      </div>

      <div className="relative flex h-9 w-12 shrink-0 items-center justify-center">
        <svg viewBox="0 0 48 36" className="absolute inset-0 size-full overflow-visible" fill="none">
          <path d={CLOUD} className="stroke-muted-foreground/60" strokeWidth={1.25} strokeLinejoin="round" />
        </svg>
        <span className="relative mt-[7px] font-mono text-[8px] text-muted-foreground">IoT</span>
      </div>

      <div className="relative h-full overflow-hidden" style={{ width: OUT_LANE }}>
        <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-muted-foreground/25" />
        {!reduce &&
          Array.from({ length: OUT_DOTS }, (_, k) => (
            <motion.span
              key={k}
              className="absolute left-0 rounded-full bg-muted-foreground"
              style={{ width: DOT, height: DOT, top: "50%", y: "-50%" }}
              initial={{ x: -DOT }}
              animate={{ x: [-DOT, OUT_LANE] }}
              transition={streamTransition((k * STREAM_PERIOD) / OUT_DOTS + 0.3)}
            />
          ))}
      </div>

      <div
        className="flex w-14 flex-col gap-[4px] rounded-[5px] border border-muted-foreground/60 p-[4px]"
        style={{ height: HEIGHT }}
      >
        <div className="flex items-center gap-[2px]">
          <span className="size-[3px] rounded-full bg-muted-foreground/60" />
          <span className="h-[2px] w-1/2 rounded-full bg-muted-foreground/60" />
        </div>
        <div className="flex flex-1 items-end gap-[3px] border-b border-muted-foreground/30">
          {CHART.map((h, i) => (
            <span key={i} className="flex-1 rounded-t-[1px] bg-muted-foreground/60" style={{ height: `${h * 100}%` }} />
          ))}
        </div>
      </div>
    </div>
  )
}
