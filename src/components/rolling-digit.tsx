import { useEffect, useRef, useState } from "react"
import { motion, useInView, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
const ROW = 1.1 // em, height of one digit in the reel
const DURATION = 450 // ms to count all the way up

// A single digit on a reel that counts up to `value`, one tick at a time, when it scrolls into view.
export function RollingDigit({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-100px 0px" })
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduce) {
      setShown(value)
      return
    }
    // ease-out spacing: quick ticks at first, slowing down as it reaches the target
    const timers = Array.from({ length: value }, (_, i) => {
      const k = i + 1
      const at = 100 + DURATION * (1 - (1 - k / value) ** 2)
      return setTimeout(() => setShown(k), at)
    })
    return () => timers.forEach(clearTimeout)
  }, [inView, reduce, value])

  const landed = shown === value && value > 0

  return (
    <motion.span
      ref={ref}
      className={cn(
        "relative inline-flex overflow-hidden rounded-[0.2em] border bg-muted/40 px-[0.14em] align-baseline tabular-nums shadow-sm",
        className,
      )}
      style={{ height: `${ROW}em` }}
      animate={landed ? { scale: [1, 1.12, 1] } : undefined}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <span className="sr-only">{value}</span>
      <motion.span
        aria-hidden
        className="flex h-max flex-col self-start"
        initial={{ y: "0%" }}
        // percentages are of the whole reel, so each digit is a tenth of it
        animate={{ y: `-${shown * 10}%` }}
        transition={{ type: "spring", stiffness: 700, damping: 40 }}
      >
        {DIGITS.map((d) => (
          <span key={d} className="flex items-center justify-center leading-none" style={{ height: `${ROW}em` }}>
            {d}
          </span>
        ))}
      </motion.span>
      {/* the seam across the middle of a split-flap / reel window */}
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-border" />
    </motion.span>
  )
}
