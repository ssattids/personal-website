import { motion, useReducedMotion } from "motion/react"

import { Chip } from "@/components/chip"
import { STREAM_PERIOD, streamOpacity, streamTransition } from "@/lib/stream"

// Retrieved chunks stream from a stack of medical pages through an AI model
// into a written summary.
const CHUNKS = 3
const PAGES = 3
const PAGE_GAP = 8
const LANE = 28
const SUMMARY_LINES = [1, 0.8, 0.55]

export function DocPipeline() {
  const reduce = useReducedMotion()

  return (
    <div className="flex h-10 items-center gap-1" aria-hidden>
      <div className="relative h-7" style={{ width: (PAGES - 1) * PAGE_GAP + 20 }}>
        {Array.from({ length: PAGES }, (_, i) => (
          <div key={i} className="absolute top-0" style={{ left: i * PAGE_GAP, zIndex: PAGES - i }}>
            <Page />
          </div>
        ))}
      </div>

      <Lane reduce={reduce} />
      <Chip label="AI" />
      <Lane reduce={reduce} />

      <div className="flex h-8 w-12 flex-col justify-center gap-1.5 rounded-[4px] border border-muted-foreground/60 px-1.5">
        {SUMMARY_LINES.map((w, k) => (
          <span key={k} className="h-[3px] rounded-full bg-muted-foreground" style={{ width: `${w * 100}%` }} />
        ))}
      </div>
    </div>
  )
}

function Lane({ reduce }: { reduce: boolean | null }) {
  return (
    <div className="relative h-full" style={{ width: LANE }}>
      {!reduce &&
        Array.from({ length: CHUNKS }, (_, k) => (
          <motion.span
            key={k}
            className="absolute top-1/2 left-0 h-[3px] w-2 -translate-y-1/2 rounded-full bg-muted-foreground"
            initial={{ x: 0, opacity: 0 }}
            animate={{ x: [0, LANE - 8], opacity: streamOpacity }}
            transition={streamTransition((k * STREAM_PERIOD) / CHUNKS)}
          />
        ))}
    </div>
  )
}

function Page() {
  return (
    <div className="flex h-7 w-5 flex-col gap-[3px] rounded-[3px] border border-muted-foreground/60 bg-background px-[3px] pt-[5px]">
      {[1, 0.7, 0.85].map((w, i) => (
        <span key={i} className="h-[2px] rounded-full bg-muted-foreground" style={{ width: `${w * 100}%` }} />
      ))}
    </div>
  )
}
