import { motion, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"

// A little "voice agent is speaking" equalizer.
export function Waveform({ bars = 24, className }: { bars?: number; className?: string }) {
  const reduce = useReducedMotion()

  return (
    <div className={cn("flex h-8 items-center gap-[3px]", className)} aria-hidden>
      {Array.from({ length: bars }, (_, i) => {
        const base = 0.25 + 0.75 * Math.abs(Math.sin(i * 0.9))
        return (
          <motion.span
            key={i}
            className="w-[3px] rounded-full bg-muted-foreground"
            style={{ height: "100%", originY: 0.5 }}
            initial={{ scaleY: 0.2 }}
            animate={reduce ? { scaleY: 0.2 } : { scaleY: [0.2, base, 0.35, base * 0.8, 0.2] }}
            transition={{
              duration: 1.1 + (i % 5) * 0.17,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.04,
            }}
          />
        )
      })}
    </div>
  )
}
