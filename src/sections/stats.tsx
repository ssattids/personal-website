import { useEffect, useRef, useState } from "react"
import { animate, useInView, useReducedMotion } from "motion/react"

import { stats } from "@/data/content"
import { Panel } from "@/components/panel"

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })
  const reduce = useReducedMotion()
  const [display, setDisplay] = useState(reduce ? value : 0)

  useEffect(() => {
    if (!inView || reduce) return
    const controls = animate(0, value, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return () => controls.stop()
  }, [inView, reduce, value])

  return (
    <span ref={ref} className="tabular-nums">
      {display}
      <span className="text-muted-foreground">{suffix}</span>
    </span>
  )
}

export function Stats() {
  return (
    <Panel id="stats" backdrop="none">
      <div className="mx-auto grid max-w-5xl grid-cols-2 divide-x divide-y sm:grid-cols-5 sm:divide-y-0">
        {stats.map((s) => (
          <div key={s.label} className="px-4 py-10 text-center">
            <div className="bg-linear-to-b from-white to-white/50 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
              <Counter value={s.value} suffix={s.suffix} />
            </div>
            <div className="mt-2 font-mono text-xs tracking-wide text-muted-foreground uppercase">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}
