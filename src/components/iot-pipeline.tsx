import { motion, useReducedMotion } from "motion/react"

import { Chip } from "@/components/chip"
import { STREAM_PERIOD, streamOpacity, streamTransition } from "@/lib/stream"

// Sensor readings stream from a data center rack down a wire into an ML chip.
const LANE = 40
// each reading rides the wire as a small bar; values are relative heights
const READINGS = [0.5, 1, 0.7]
const UNITS = 3

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

      <div className="relative h-full" style={{ width: LANE }}>
        <span className="absolute inset-x-1 top-1/2 h-px -translate-y-1/2 bg-muted-foreground/25" />
        {!reduce &&
          READINGS.map((h, k) => (
            <motion.span
              key={k}
              className="absolute left-1 w-[3px] rounded-full bg-muted-foreground"
              style={{ height: 4 + h * 8, top: "50%", y: "-50%" }}
              initial={{ x: 0, opacity: 0 }}
              animate={{ x: [0, LANE - 11], opacity: streamOpacity }}
              transition={streamTransition((k * STREAM_PERIOD) / READINGS.length)}
            />
          ))}
      </div>

      <Chip label="ML" />
    </div>
  )
}
