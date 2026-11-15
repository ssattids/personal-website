import { motion, useReducedMotion } from "motion/react"

import { Chip } from "@/components/chip"
import { STREAM_PERIOD, streamTransition } from "@/lib/stream"

// Tables of sensor readings stream from a data center rack down a wire into an
// ML chip, whose scatter plots stream on to the software on a computer screen.
// The wires clip what rides them, so items slide out of one piece and into the
// next rather than fading.
const LANE = 56
// width of the tables and plots riding the wires
const ITEM = 7
const TABLES = 3
const UNITS = 3
// each plot's points as [x, y] fractions of its axes
const PLOTS = [
  [[0.15, 0.7], [0.45, 0.4], [0.8, 0.15]],
  [[0.2, 0.25], [0.5, 0.6], [0.8, 0.35]],
  [[0.15, 0.2], [0.5, 0.45], [0.75, 0.75]],
]
// sidebar + rows of the app on the screen; values are relative row widths
const ROWS = [1, 0.6, 0.8]

export function IotPipeline() {
  const reduce = useReducedMotion()

  return (
    <div className="flex h-10 items-center" aria-hidden>
      <div className="flex h-8 w-7 flex-col justify-between rounded-[4px] border border-muted-foreground/60 p-[3px]">
        {Array.from({ length: UNITS }, (_, u) => (
          <div key={u} className="flex h-[5px] items-center gap-[3px] rounded-[1px] bg-muted-foreground/20 px-[2px]">
            <span className="size-[3px] rounded-full bg-foreground/60" />
            <span className="h-px flex-1 rounded-full bg-muted-foreground/60" />
          </div>
        ))}
      </div>

      <div className="relative h-full overflow-hidden" style={{ width: LANE }}>
        <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-muted-foreground/25" />
        {!reduce &&
          Array.from({ length: TABLES }, (_, k) => (
            <motion.div
              key={k}
              className="absolute left-0 flex h-[6px] flex-col overflow-hidden rounded-[1px] border border-muted-foreground bg-background"
              style={{ width: ITEM, top: "50%", y: "-50%" }}
              initial={{ x: -ITEM }}
              animate={{ x: [-ITEM, LANE] }}
              transition={streamTransition((k * STREAM_PERIOD) / TABLES)}
            >
              <span className="h-[2px] shrink-0 bg-muted-foreground" />
              <span className="flex-1 border-b border-muted-foreground/60" />
              <span className="flex-1" />
            </motion.div>
          ))}
      </div>

      <Chip label="ML" />

      <div className="relative h-full overflow-hidden" style={{ width: LANE }}>
        <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-muted-foreground/25" />
        {!reduce &&
          PLOTS.map((points, k) => (
            <motion.div
              key={k}
              className="absolute left-0 border-b border-l border-muted-foreground bg-background"
              style={{ width: ITEM, height: ITEM, top: "50%", y: "-50%" }}
              initial={{ x: -ITEM }}
              animate={{ x: [-ITEM, LANE] }}
              transition={streamTransition((k * STREAM_PERIOD) / PLOTS.length + 0.4)}
            >
              {points.map(([px, py], i) => (
                <span
                  key={i}
                  className="absolute size-[2px] -translate-x-1/2 translate-y-1/2 rounded-full bg-foreground/80"
                  style={{ left: `${px * 100}%`, bottom: `${py * 100}%` }}
                />
              ))}
            </motion.div>
          ))}
      </div>

      <div className="flex flex-col items-center">
        <div className="flex h-7 w-8 flex-col overflow-hidden rounded-[4px] border border-muted-foreground/60">
          <div className="flex h-[5px] shrink-0 items-center gap-[2px] border-b border-muted-foreground/30 px-[3px]">
            {[0, 1, 2].map((d) => (
              <span key={d} className="size-[2px] rounded-full bg-muted-foreground/60" />
            ))}
          </div>
          <div className="flex flex-1">
            <div className="w-1.5 border-r border-muted-foreground/30 bg-muted-foreground/15" />
            <div className="flex flex-1 flex-col justify-center gap-[3px] px-[2px]">
              {ROWS.map((w, r) => (
                <div key={r} className="flex items-center gap-[2px]">
                  <span className="size-[3px] shrink-0 rounded-full bg-foreground/60" />
                  <span className="h-px rounded-full bg-muted-foreground/60" style={{ width: `${w * 100}%` }} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <span className="h-[4px] w-[2px] bg-muted-foreground/60" />
        <span className="h-px w-4 rounded-full bg-muted-foreground/60" />
      </div>
    </div>
  )
}
