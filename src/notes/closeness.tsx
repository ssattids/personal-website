import { lazy, Suspense, useRef, useState } from "react"
import { motion, useInView } from "motion/react"
import { Hand } from "lucide-react"

import { Card } from "@/components/ui/card"
import type { SpacePoint } from "@/components/embedding-space-3d"
import { Figure, texColor, texNote, Toggle } from "@/notes/parts"

// the toy embedding space, figures and formulas shared by the Euclidean distance and cosine distance notes

// the first vector of a pair is warm, the second cool, everywhere on the page
export const A = "var(--signal-1)"
export const B = "oklch(0.75 0.12 235)"

// three.js is heavy, so the 3D view only loads on the pages that show it
const EmbeddingSpace3D = lazy(() => import("@/components/embedding-space-3d"))

// any number of dimensions
type Vec = number[]

const dot = (a: Vec, b: Vec) => a.reduce((s, x, k) => s + x * b[k], 0)
const norm = (a: Vec) => Math.sqrt(dot(a, a))
const dist = (a: Vec, b: Vec) => norm(a.map((x, k) => x - b[k]))
const cosine = (a: Vec, b: Vec) => dot(a, b) / (norm(a) * norm(b))

// a toy 2D space, placed by hand so the groups are easy to see; kitten and puppy point the same way as cat and dog
// but sit nearer the origin, which is where distance and cosine disagree
export const GROUPS = {
  animal: A,
  vehicle: B,
  fruit: "oklch(0.72 0.14 150)",
  city: "oklch(0.72 0.15 300)",
}
type Word = { word: string; group: keyof typeof GROUPS; v: Vec }
const WORDS: Word[] = [
  { word: "cat", group: "animal", v: [2, 1.6] },
  { word: "kitten", group: "animal", v: [1, 0.85] },
  { word: "dog", group: "animal", v: [2.2, 0.9] },
  { word: "puppy", group: "animal", v: [1.1, 0.5] },
  { word: "car", group: "vehicle", v: [-1.8, 1.2] },
  { word: "truck", group: "vehicle", v: [-2.4, 1.8] },
  { word: "bike", group: "vehicle", v: [-0.9, 0.4] },
  { word: "apple", group: "fruit", v: [0.3, -2] },
  { word: "banana", group: "fruit", v: [-0.4, -1.8] },
]

// the same words with a third dimension; straight on it looks like the 2D space above
const WORDS_3D: Word[] = [
  { word: "cat", group: "animal", v: [2, 1.6, 0.8] },
  { word: "kitten", group: "animal", v: [1, 0.85, 0.5] },
  { word: "dog", group: "animal", v: [2.2, 0.9, 1] },
  { word: "puppy", group: "animal", v: [1.1, 0.5, 0.6] },
  { word: "car", group: "vehicle", v: [-1.8, 1.2, 0.3] },
  { word: "truck", group: "vehicle", v: [-2.4, 1.8, 0.5] },
  { word: "bike", group: "vehicle", v: [-0.9, 0.4, 0.2] },
  { word: "apple", group: "fruit", v: [0.3, -2, 0.6] },
  { word: "banana", group: "fruit", v: [-0.4, -1.8, 0.5] },
]

// the 3 closest words to words[q]: smallest distance, or biggest cosine
function nearestTo(words: Word[], q: number, metric: 0 | 1) {
  const v = words[q].v
  return words
    .map((w, i) => ({ ...w, i, s: metric ? cosine(v, w.v) : dist(v, w.v) }))
    .filter((w) => w.i !== q)
    .sort((a, b) => (metric ? b.s - a.s : a.s - b.s))
    .slice(0, 3)
}

// viewBox units; one unit of embedding space is S pixels, the same on both axes so angles stay true
const W = 560
const H = 320
const S = 60
const px = (v: Vec) => [W / 2 + v[0] * S, H / 2 - v[1] * S] as const
// one grid line per unit, out to the edges of the plot
const GRID_X = Array.from({ length: 2 * Math.floor(W / 2 / S) + 1 }, (_, i) => W / 2 + (i - Math.floor(W / 2 / S)) * S)
const GRID_Y = Array.from({ length: 2 * Math.floor(H / 2 / S) + 1 }, (_, i) => H / 2 + (i - Math.floor(H / 2 / S)) * S)

export function SpaceExplorer({ metric }: { metric: 0 | 1 }) {
  const [q, setQ] = useState(0)
  const query = WORDS[q]
  const nearest = nearestTo(WORDS, q, metric)
  const near = new Set(nearest.map((w) => w.word))
  const [ox, oy] = px([0, 0])
  const [qx, qy] = px(query.v)
  const color = GROUPS[query.group]

  return (
    <Figure
      caption={`A toy 2D embedding space, placed by hand. Click a point or pick a word to see its 3 nearest neighbours by ${MEASURE[metric]}.`}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
        {GRID_X.map((x) => (
          <line key={`gx${x}`} x1={x} x2={x} y1={0} y2={H} className="stroke-foreground/5" />
        ))}
        {GRID_Y.map((y) => (
          <line key={`gy${y}`} x1={0} x2={W} y1={y} y2={y} className="stroke-foreground/5" />
        ))}
        <line x1={0} x2={W} y1={oy} y2={oy} className="stroke-white/15" />
        <line x1={ox} x2={ox} y1={0} y2={H} className="stroke-white/15" />

        {/* distance: straight lines between the points; cosine: rays from the origin, since only the angle counts */}
        {metric === 0
          ? nearest.map((w) => {
              const [x, y] = px(w.v)
              return <line key={w.word} x1={qx} y1={qy} x2={x} y2={y} stroke={color} strokeOpacity={0.6} strokeDasharray="3 4" />
            })
          : [query, ...nearest].map((w) => {
              // run each ray past its point so the angles are easy to compare
              const r = Math.max(norm(w.v), 2.6) / norm(w.v)
              const [x, y] = px([w.v[0] * r, w.v[1] * r])
              return (
                <line
                  key={w.word}
                  x1={ox}
                  y1={oy}
                  x2={x}
                  y2={y}
                  stroke={color}
                  strokeOpacity={w.word === query.word ? 0.8 : 0.4}
                  strokeDasharray="3 4"
                />
              )
            })}

        {WORDS.map((w, i) => {
          const [x, y] = px(w.v)
          const active = i === q || near.has(w.word)
          return (
            <g key={w.word} className="cursor-pointer" onClick={() => setQ(i)} opacity={active ? 1 : 0.45}>
              <circle cx={x} cy={y} r={14} fill="transparent" />
              <circle
                cx={x}
                cy={y}
                r={i === q ? 7 : 5}
                fill={GROUPS[w.group]}
                className="stroke-background"
                strokeWidth={2}
              />
              <text x={x + 10} y={y} dy="-0.5em" className="fill-foreground font-mono text-[12px]">
                {w.word}
              </text>
            </g>
          )
        })}
      </svg>

      <NeighbourPanel words={WORDS} q={q} setQ={setQ} metric={metric} nearest={nearest} />
    </Figure>
  )
}

export function SpaceExplorer3D({ metric }: { metric: 0 | 1 }) {
  const [q, setQ] = useState(1)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const nearest = nearestTo(WORDS_3D, q, metric)
  const near = new Set(nearest.map((w) => w.i))
  const points: SpacePoint[] = WORDS_3D.map((w, i) => ({
    label: w.word,
    pos: w.v as [number, number, number],
    color: GROUPS[w.group],
    selected: i === q,
    dim: i !== q && !near.has(i),
  }))

  return (
    <Figure
      caption={`A toy 3D embedding space, placed by hand. Drag to rotate; click a point or pick a word to see its 3 nearest neighbours by ${MEASURE[metric]}.`}
    >
      <div ref={ref}>
        <Suspense fallback={<div className="aspect-[7/5] w-full sm:aspect-[7/4]" />}>
          <EmbeddingSpace3D points={points} links={nearest.map((w) => [q, w.i])} play={inView} onPick={setQ} />
        </Suspense>
        <p className="mt-2 flex items-center justify-end gap-1.5 font-mono text-xs text-muted-foreground">
          <Hand className="size-3.5" />
          drag your cursor to explore
        </p>
      </div>
      <NeighbourPanel words={WORDS_3D} q={q} setQ={setQ} metric={metric} nearest={nearest} />
    </Figure>
  )
}

const MEASURE = ["distance", "cosine"]

// the Inputs (word) and Output (nearest neighbours) box under both explorers
function NeighbourPanel({
  words,
  q,
  setQ,
  metric,
  nearest,
}: {
  words: Word[]
  q: number
  setQ: (q: number) => void
  metric: 0 | 1
  nearest: ReturnType<typeof nearestTo>
}) {
  const query = words[q]
  const color = GROUPS[query.group]
  return (
    <div className="mt-4 rounded-lg border bg-muted/40 px-4 py-3">
      <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">Inputs</p>
      <div className="mt-3 flex items-start gap-4 font-mono text-xs text-muted-foreground">
        <span className="w-24 shrink-0 pt-2">word</span>
        <Toggle
          className="flex-wrap rounded-2xl"
          value={q}
          onChange={setQ}
          options={words.map((w, i) => ({ value: i, label: w.word, color: GROUPS[w.group] }))}
        />
      </div>
      <p className="mt-3 border-t pt-3 font-mono text-xs tracking-widest text-muted-foreground uppercase">Output</p>
      <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 font-mono text-sm">
        <span className="text-muted-foreground">
          nearest to <span style={{ color }}>{query.word}</span> by {MEASURE[metric]} =
        </span>
        {nearest.map((w, i) => (
          <span key={w.word}>
            {i > 0 && <span className="mr-2 text-muted-foreground">·</span>}
            <span className="text-lg font-medium" style={{ color: GROUPS[w.group] }}>
              {w.word}
            </span>{" "}
            <span className="text-muted-foreground">{w.s.toFixed(metric ? 3 : 2)}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

const EXAMPLES: { a: Vec; b: Vec; verdict: string }[] = [
  { a: [2, 1], b: [1.8, 1.3], verdict: "close" },
  { a: [2, 1], b: [0.8, 0.4], verdict: "same way, shorter" },
  { a: [2, 1], b: [-1, 2], verdict: "perpendicular" },
  { a: [2, 1], b: [-2, -1], verdict: "opposite" },
]

// small vector diagram: both arrows start at the origin
const VW = 240
const VH = 140
const VS = 28
const vpx = (v: Vec) => [VW / 2 + v[0] * VS, VH / 2 - v[1] * VS] as const

export function ExampleGrid({ metric }: { metric: 0 | 1 }) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      {EXAMPLES.map((e, i) => {
        const [ox, oy] = vpx([0, 0])
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="h-full gap-3 p-4">
              <div className="flex items-baseline justify-between font-mono text-xs">
                <span className="text-muted-foreground">
                  <span style={{ color: A }}>a</span> = ({e.a.join(", ")}) · <span style={{ color: B }}>b</span> = (
                  {e.b.join(", ")})
                </span>
                <span className="text-foreground">{e.verdict}</span>
              </div>
              <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full">
                <line x1={0} x2={VW} y1={oy} y2={oy} className="stroke-white/15" />
                <line x1={ox} x2={ox} y1={0} y2={VH} className="stroke-white/15" />
                {[
                  { v: e.a, c: A },
                  { v: e.b, c: B },
                ].map(({ v, c }, j) => {
                  const [x, y] = vpx(v)
                  return (
                    <g key={j}>
                      <line x1={ox} y1={oy} x2={x} y2={y} stroke={c} strokeWidth={2} strokeLinecap="round" />
                      <circle cx={x} cy={y} r={4} fill={c} className="stroke-background" strokeWidth={2} />
                    </g>
                  )
                })}
              </svg>
              <p className="font-mono text-xs text-muted-foreground">
                {MEASURE[metric]} ={" "}
                <span className="text-sm font-medium text-foreground">
                  {(metric ? cosine(e.a, e.b) : dist(e.a, e.b)).toFixed(2)}
                </span>
              </p>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}

// each formula with its parts labelled underneath, matching the cross entropy note
// written squared: a square root over the annotated sum would stretch down over the labels
export const DIST_FORMULA = [
  `\\underbrace{d(${texColor(A, "\\mathbf{e}_i")}, ${texColor(B, "\\mathbf{e}_j")})^2}_{${texNote("squared\ndistance")}} =`,
  `\\underbrace{\\mathop{\\Large\\sum}\\limits_{k=1}^{n}}_{${texNote("sum over\ndimensions")}}`,
  `\\underbrace{(${texColor(A, "e_{ik}")} - ${texColor(B, "e_{jk}")})^2}_{${texNote("gap in dimension k,\nsquared")}}`,
].join(" \\, ")

export const COS_FORMULA = [
  `\\underbrace{\\cos(${texColor(A, "\\mathbf{e}_i")}, ${texColor(B, "\\mathbf{e}_j")})}_{${texNote("cosine\nsimilarity")}} =`,
  `\\underbrace{${texColor(A, "\\mathbf{e}_i")} \\cdot ${texColor(B, "\\mathbf{e}_j")}}_{${texNote("dot product")}}`,
  `\\Big/`,
  `\\underbrace{\\|${texColor(A, "\\mathbf{e}_i")}\\| \\, \\|${texColor(B, "\\mathbf{e}_j")}\\|}_{${texNote("product of\nlengths")}}`,
].join(" \\, ")
