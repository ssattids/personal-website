import { motion } from "motion/react"

import type { Project } from "@/data/content"

const signal = ["var(--signal-1)", "var(--signal-2)", "var(--signal-3)"]

// Small generative illustrations, one per project. `active` is true on card hover.
export function ProjectVisual({ kind, active }: { kind: Project["visual"]; active: boolean }) {
  switch (kind) {
    case "ocr":
      return <Ocr active={active} />
    case "trees":
      return <Trees active={active} />
    case "segmentation":
      return <Segmentation active={active} />
    case "attention":
      return <Attention active={active} />
    case "graph":
      return <Graph active={active} />
  }
}

function Ocr({ active }: { active: boolean }) {
  const lines = [70, 92, 85, 60, 88, 76, 40]
  return (
    <div className="relative mx-auto h-full w-32 overflow-hidden rounded-md border bg-background p-3">
      {lines.map((w, i) => (
        <motion.div
          key={i}
          className="mb-2 h-1.5 rounded-full"
          style={{ width: `${w}%` }}
          animate={{
            backgroundColor: active ? signal[i % 3] : "var(--muted-foreground)",
            opacity: active ? 0.9 : 0.25,
          }}
          transition={{ delay: active ? i * 0.12 : 0 }}
        />
      ))}
      <div className="absolute inset-x-0 top-0 h-px bg-signal-2/50 [animation:scan_2.4s_linear_infinite]" />
    </div>
  )
}

function Trees({ active }: { active: boolean }) {
  const tree = (ox: number, delay: number, color: string) => (
    <g transform={`translate(${ox} 10)`}>
      {[
        [20, 0, 8, 22],
        [20, 0, 32, 22],
        [8, 22, 2, 44],
        [8, 22, 14, 44],
        [32, 22, 26, 44],
        [32, 22, 38, 44],
      ].map(([x1, y1, x2, y2], i) => (
        <motion.line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={color}
          strokeWidth={1.5}
          animate={{ opacity: active ? 1 : 0.35 }}
          transition={{ delay: active ? delay + i * 0.05 : 0 }}
        />
      ))}
      {[[20, 0], [8, 22], [32, 22], [2, 44], [14, 44], [26, 44], [38, 44]].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={3} fill={color} />
      ))}
    </g>
  )
  return (
    <svg viewBox="0 0 160 64" className="h-full w-full">
      {tree(10, 0, signal[0])}
      {tree(60, 0.15, signal[1])}
      {tree(110, 0.3, signal[2])}
    </svg>
  )
}

function Segmentation({ active }: { active: boolean }) {
  const cols = 14
  const rows = 8
  return (
    <div className="grid h-full gap-[2px]" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols * rows }, (_, i) => {
        const c = i % cols
        const r = Math.floor(i / cols)
        const road = r === 3 || r === 4 || c === 9
        const car = road && (i * 7) % 11 === 0
        return (
          <motion.div
            key={i}
            className="rounded-[2px]"
            animate={{
              backgroundColor: active
                ? car
                  ? "var(--signal-1)"
                  : road
                    ? "var(--signal-2)"
                    : "var(--muted)"
                : "var(--muted)",
              opacity: active ? 1 : 0.6 + ((i * 13) % 7) / 20,
            }}
            transition={{ delay: active ? (c + r) * 0.025 : 0 }}
          />
        )
      })}
    </div>
  )
}

function Attention({ active }: { active: boolean }) {
  const src = ["the", "agent", "said", "hi"]
  const tgt = ["l'", "agent", "a", "dit", "salut"]
  const weight = (i: number, j: number) => Math.exp(-Math.abs(i * 0.8 - j) * 1.4)
  return (
    <div className="flex h-full items-center justify-center gap-2 font-mono text-[8px] leading-none text-muted-foreground">
      <div className="flex flex-col gap-[2px] pt-3 text-right">
        {tgt.map((t) => (
          <span key={t} className="flex h-4 items-center justify-end">{t}</span>
        ))}
      </div>
      <div>
        <div className="mb-1 flex h-2 gap-[2px]">
          {src.map((s) => (
            <span key={s} className="w-6 text-center">
              {s}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-[2px]">
          {tgt.flatMap((_, i) =>
            src.map((_, j) => (
              <motion.div
                key={`${i}-${j}`}
                className="h-4 w-6 rounded-[3px] bg-signal-1"
                animate={{ opacity: active ? 0.1 + weight(i, j) * 0.9 : 0.12 }}
                transition={{ delay: active ? (i + j) * 0.05 : 0 }}
              />
            )),
          )}
        </div>
      </div>
    </div>
  )
}

function Graph({ active }: { active: boolean }) {
  const nodes = [
    { x: 80, y: 32, label: "phone" },
    { x: 30, y: 14, label: "battery" },
    { x: 135, y: 14, label: "camera" },
    { x: 30, y: 52, label: "screen" },
    { x: 130, y: 52, label: "price" },
  ]
  const sentiment = [0, 1, 2, 1, 0]
  return (
    <svg viewBox="0 0 160 64" className="h-full w-full">
      {nodes.slice(1).map((n, i) => (
        <motion.line
          key={n.label}
          x1={nodes[0].x}
          y1={nodes[0].y}
          x2={n.x}
          y2={n.y}
          stroke={signal[sentiment[i + 1]]}
          strokeWidth={1.2}
          animate={{ pathLength: active ? 1 : 0.5, opacity: active ? 0.9 : 0.3 }}
          transition={{ delay: active ? i * 0.1 : 0 }}
        />
      ))}
      {nodes.map((n, i) => (
        <g key={n.label}>
          <circle cx={n.x} cy={n.y} r={i === 0 ? 6 : 4} fill={signal[sentiment[i]]} />
          <text x={n.x} y={n.y + (n.y > 32 ? 11 : -7)} textAnchor="middle" className="fill-muted-foreground font-mono text-[7px]">
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  )
}
