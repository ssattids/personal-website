import { motion, useReducedMotion } from "motion/react"

import { STREAM_PERIOD, streamOpacity, streamTransition } from "@/lib/stream"

// Readings stream from several data center devices along converging wires
// into one dashboard.
const HEIGHT = 40
const LANE = 40
const MID = HEIGHT / 2
const DEVICES = [6, 20, 34] // vertical centre of each device
const PER_WIRE = 2
const DOT = 3
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

      <div className="relative" style={{ width: LANE, height: HEIGHT }}>
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
                  initial={{ x: 0, y, opacity: 0 }}
                  animate={{ x: [0, LANE], y: [y, MID], opacity: streamOpacity }}
                  transition={streamTransition(delay)}
                />
              )
            })
          )}
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
