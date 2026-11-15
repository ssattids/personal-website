import { Fragment } from "react"
import { motion, useReducedMotion } from "motion/react"

// A scan line reads through free text, the body-part entities it passes get
// boxed and tagged, then they're pulled out as structured items. Every piece
// shares one timeline.
const DURATION = 5
const loop = (times: number[], ease: "easeInOut" | "linear" = "easeInOut") => ({
  duration: DURATION,
  times,
  repeat: Infinity,
  ease,
})

const GAP = 4
const ROW_HEIGHT = 14
// word widths per line; `true` marks an entity
const lines: [number, boolean][][] = [
  [[10, false], [16, false], [8, false], [18, true], [12, false], [9, false]],
  [[14, false], [7, false], [11, false], [20, true], [15, false], [10, false]],
]
const WIDTH = Math.max(...lines.map((l) => l.reduce((sum, [w]) => sum + w + GAP, -GAP)))

// the scan sweeps the lines back to back between SCAN_START and SCAN_END
const SCAN_START = 0.03
const SCAN_END = 0.11
const lineSpan = (SCAN_END - SCAN_START) / lines.length
const FADE = 0.01

// everything holds, then fades out together before the loop restarts
const HOLD_END = 0.88
const OUT = 0.95

// lay the words out once; each entity is tagged as the scan line reaches its start
const words = lines.flatMap((line, row) => {
  let left = 0
  return line.map(([width, entity]) => {
    const word = { row, left, width, entity, hit: SCAN_START + (row + left / WIDTH) * lineSpan }
    left += width + GAP
    return word
  })
})
const tagged = (hit: number) => loop([0, hit, hit + 0.04, HOLD_END, OUT, 1])

// one extracted item per entity, shown the moment that entity is tagged:
// an image, then a line of handwritten-looking text
const extracted = [<ImageThumb />, <Squiggle />]
const hits = words.filter((w) => w.entity).map((w) => w.hit)

export function EntityTagger() {
  const still = useReducedMotion()

  return (
    <div className="flex h-10 items-center gap-4" aria-hidden>
      <div className="relative" style={{ width: WIDTH, height: ROW_HEIGHT * lines.length }}>
        {words.map(({ row, left, width, entity, hit }, i) => {
          const top = row * ROW_HEIGHT + ROW_HEIGHT / 2
          if (!entity) {
            return (
              <span
                key={i}
                className="absolute h-[3px] -translate-y-1/2 rounded-full bg-muted-foreground/50"
                style={{ left, top, width }}
              />
            )
          }
          return (
            <Fragment key={i}>
              <motion.span
                className="absolute h-[3px] -translate-y-1/2 rounded-full bg-foreground"
                style={{ left, top, width }}
                initial={{ opacity: still ? 1 : 0.5 }}
                animate={still ? { opacity: 1 } : { opacity: [0.5, 0.5, 1, 1, 0.5, 0.5] }}
                transition={tagged(hit)}
              />
              <motion.span
                className="absolute -translate-y-1/2 rounded-[3px] border border-foreground/70"
                style={{ left: left - 2, top, width: width + 4, height: 9 }}
                initial={{ opacity: still ? 1 : 0 }}
                animate={still ? { opacity: 1 } : { opacity: [0, 0, 1, 1, 0, 0] }}
                transition={tagged(hit)}
              />
            </Fragment>
          )
        })}

        {!still &&
          lines.map((_, row) => {
            const s = SCAN_START + row * lineSpan
            const e = s + lineSpan
            return (
              <motion.span
                key={row}
                className="absolute left-0 w-px bg-muted-foreground"
                style={{ top: row * ROW_HEIGHT + 2, height: ROW_HEIGHT - 4 }}
                initial={{ opacity: 0 }}
                animate={{
                  x: [0, 0, 0, WIDTH, WIDTH, WIDTH],
                  opacity: [0, 0, 1, 1, 0, 0],
                }}
                transition={loop([0, s - FADE, s, e, e + FADE, 1], "linear")}
              />
            )
          })}
      </div>

      <ul className="flex flex-col gap-1.5">
        {extracted.map((item, k) => (
          <motion.li
            key={k}
            className="flex items-center gap-1.5 text-muted-foreground"
            initial={{ opacity: still ? 1 : 0 }}
            animate={still ? { opacity: 1 } : { opacity: [0, 0, 1, 1, 0, 0], x: [-6, -6, 0, 0, 0, 0] }}
            transition={tagged(hits[k])}
          >
            <span className="size-1 rounded-full bg-muted-foreground" />
            {item}
          </motion.li>
        ))}
      </ul>
    </div>
  )
}

function Squiggle() {
  return (
    <svg width={14} height={8} viewBox="0 0 14 8" className="text-muted-foreground">
      <path
        d="M1 5 C2 1.5, 3.5 1.5, 4.5 4 S7 6.5, 8 4 S10.5 1.5, 13 3"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.25}
        strokeLinecap="round"
      />
    </svg>
  )
}

function ImageThumb() {
  return (
    <svg width={14} height={11} viewBox="0 0 14 11" className="text-muted-foreground">
      <rect x={0.5} y={0.5} width={13} height={10} rx={1.5} fill="none" stroke="currentColor" />
      <circle cx={4} cy={3.5} r={1.1} fill="currentColor" />
      <path d="M1 9.5 L5 6 L7.5 8 L10 5 L13 8.5" fill="none" stroke="currentColor" strokeLinejoin="round" />
    </svg>
  )
}
