import { lazy, Suspense, useRef, useState } from "react"
import { motion, useInView, useReducedMotion } from "motion/react"
import { FileText, Hand, Image, MessageSquareText, Type, User, type LucideIcon } from "lucide-react"

import { Card } from "@/components/ui/card"
import type { SpacePoint } from "@/components/embedding-space-3d"
import {
  Accordion,
  Bullets,
  Components,
  Figure,
  Formula,
  H2,
  Section,
  M,
  NoteLink,
  SubBullets,
  texColor,
  texNote,
  Toggle,
} from "@/notes/parts"

// the first vector of a pair is warm, the second cool, everywhere on the page
const A = "var(--signal-1)"
const B = "oklch(0.75 0.12 235)"

// three.js is heavy, so the 3D view only loads on this page
const EmbeddingSpace3D = lazy(() => import("@/components/embedding-space-3d"))

// any number of dimensions
type Vec = number[]

const dot = (a: Vec, b: Vec) => a.reduce((s, x, k) => s + x * b[k], 0)
const norm = (a: Vec) => Math.sqrt(dot(a, a))
const dist = (a: Vec, b: Vec) => norm(a.map((x, k) => x - b[k]))
const cosine = (a: Vec, b: Vec) => dot(a, b) / (norm(a) * norm(b))

// a toy 2D space, placed by hand so the groups are easy to see; kitten and puppy point the same way as cat and dog
// but sit nearer the origin, which is where distance and cosine disagree
const GROUPS = {
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

export function EmbeddingsNote() {
  return (
    <>
      <Section>
        <H2>Background</H2>
        <Bullets
          items={[
            "An embedding is a list of numbers, a vector, that a neural network gives to an input: a word, a sentence, an image, a user.",
            <>
              The network is trained so that
              <SubBullets
                items={[
                  "similar inputs get vectors that are close together.",
                  "non-similar inputs get vectors that are far apart.",
                ]}
              />
            </>,
          ]}
        />
        <InputsToVector />
        <Bullets
          items={[
            "That's what powers semantic search, recommendations, clustering, deduplication and retrieval for LLMs.",
          ]}
        />
      </Section>

      <Section>
        <H2>The formula, piece by piece</H2>
        <Formula tex={FORMULA} animate />
        <Components
          items={[
            <>
              <M>{"f_\\theta"}</M> = the network, with parameters <M>{"\\theta"}</M> learned in training
            </>,
            <>
              <M>{"\\mathbf{x}"}</M> = the input, e.g. a word, a sentence or an image
            </>,
            <>
              <M>{"\\mathbf{e}"}</M> = the embedding, the vector the network outputs
            </>,
            <>
              <M>{"\\mathbb{R}^n"}</M> = the space of vectors of <M>{"n"}</M> real numbers, so <M>{"\\mathbf{e}"}</M> has{" "}
              <M>{"n"}</M> dimensions
            </>,
          ]}
        />
      </Section>

      <Section>
        <H2>How good embeddings are found</H2>
        <Bullets
          items={[
            <>
              The network <M>{"f_\\theta"}</M> starts with random parameters, so its first embeddings are scattered with
              no meaning.
            </>,
            <>
              Training changes <M>{"\\theta"}</M> using pairs of inputs, with a special loss function that rewards the
              network for scoring similar pairs higher and dissimilar pairs lower.
              <SubBullets
                items={[
                  <>
                    Learn more details about this loss function by reading this section on{" "}
                    <NoteLink to="/notes/contrastive-loss">contrastive loss</NoteLink>.
                  </>,
                ]}
              />
            </>,
          ]}
        />
      </Section>

      <Section>
        <H2>Methods to measure closeness</H2>
        <Bullets
          items={[
            "There are two common ways to compare two embeddings.",
            <>
              Euclidean distance: how far apart the two points are. Smaller means more similar. Here it's written
              squared; <M>{"d"}</M> is the square root of the sum.
            </>,
          ]}
        />
        <Formula tex={DIST_FORMULA} animate />
        <Components
          items={[
            <>
              <M>{"d"}</M> = the Euclidean distance between the two embeddings
            </>,
            <>
              <M>{"\\mathbf{e}_i, \\mathbf{e}_j"}</M> = the two embeddings being compared
            </>,
            <>
              <M>{"k"}</M> = index of the current dimension, from <M>{"1"}</M> to <M>{"n"}</M>
            </>,
            <>
              <M>{"e_{ik}"}</M> = the <M>{"k"}</M>-th number in <M>{"\\mathbf{e}_i"}</M>
            </>,
          ]}
        />
        <Bullets
          items={[
            <>
              Cosine similarity: the angle between the two vectors, ignoring their lengths. It runs from <M>{"-1"}</M>{" "}
              (opposite) through <M>{"0"}</M> (unrelated) to <M>{"1"}</M> (same direction). Bigger means more similar.
            </>,
          ]}
        />
        <Formula tex={COS_FORMULA} animate />
        <Components
          items={[
            <>
              <M>{"\\cos"}</M> = the cosine of the angle between the two embeddings
            </>,
            <>
              <M>{"\\mathbf{e}_i, \\mathbf{e}_j"}</M> = the two embeddings being compared
            </>,
            <>
              <M>{"\\mathbf{e}_i \\cdot \\mathbf{e}_j = \\sum_k e_{ik} \\, e_{jk}"}</M> = the dot product
            </>,
            <>
              <M>{"\\|\\mathbf{e}\\|"}</M> = the length of a vector, its distance from the origin
            </>,
          ]}
        />
      </Section>

      <Section>
        <H2>Embedding space, visualized</H2>
        <Bullets
          items={[
            "Similar things cluster: animals with animals, vehicles with vehicles.",
            "Finding the most similar items is just finding the nearest neighbours.",
          ]}
        />
        <SpaceExplorer />
      </Section>

      <Section>
        <H2>Embedding space in 3D</H2>
        <Bullets
          items={[
            "Real embeddings have hundreds of dimensions. Adding just one more shows why the extra room matters.",
            "Seen straight on, it looks just like the 2D space above. Once the view turns, the third axis gives every point depth.",
            "Every extra dimension is another direction in which unrelated things can be far apart.",
            "Drag to rotate, and pick a word to see its nearest neighbours.",
          ]}
        />
        <SpaceExplorer3D />
      </Section>

      <Section>
        <H2>Example situations visualized</H2>
        <Bullets
          items={[
            "Distance cares about length, cosine only about direction.",
            "Two vectors pointing the same way have a cosine of 1, however far apart their tips are.",
          ]}
        />
        <ExampleGrid />
      </Section>

      <Section>
        <H2>Takeaways</H2>
        <Bullets
          items={[
            "An embedding turns an input into a vector, so that similar inputs land close together.",
            "Compare them with Euclidean distance (smaller is closer) or cosine similarity (bigger is closer).",
          ]}
        />
      </Section>

      <Section>
        <H2>FAQ</H2>
        <div className="mt-4 space-y-3">
          <Accordion title="Where do embeddings come from?">
            <SubBullets
              items={[
                "A network learns them during training. Nobody places the points by hand.",
                <>
                  Metric learning trains the geometry directly, e.g. with{" "}
                  <NoteLink to="/notes/contrastive-loss">contrastive loss</NoteLink>, which pulls same-class pairs
                  together and pushes different-class pairs apart.
                </>,
                "Other networks learn them as a side effect: a language model's first layer, or a classifier's last hidden layer.",
              ]}
            />
          </Accordion>
          <Accordion title="Distance or cosine?">
            <SubBullets
              items={[
                "Cosine is the usual choice for text, where a vector's length often tracks things like word frequency rather than meaning.",
                <>
                  If every vector has length 1, then <M>{"\\|\\mathbf{a} - \\mathbf{b}\\|^2 = 2 - 2\\cos(\\mathbf{a}, \\mathbf{b})"}</M>,
                  so the nearest neighbours are the same either way.
                </>,
                "Many embedding models output unit-length vectors for exactly that reason.",
              ]}
            />
          </Accordion>
          <Accordion title="How many dimensions?">
            <SubBullets
              items={[
                "Real embeddings usually have hundreds to a few thousand dimensions.",
                "The 2D space on this page is only so it can be drawn. Distance and cosine work the same in any number of dimensions.",
                "To look at real embeddings, project them down to 2D with PCA, t-SNE or UMAP, keeping in mind that some structure is lost.",
              ]}
            />
          </Accordion>
        </div>
      </Section>
    </>
  )
}

// viewBox units; one unit of embedding space is S pixels, the same on both axes so angles stay true
const W = 560
const H = 320
const S = 60
const px = (v: Vec) => [W / 2 + v[0] * S, H / 2 - v[1] * S] as const
// one grid line per unit, out to the edges of the plot
const GRID_X = Array.from({ length: 2 * Math.floor(W / 2 / S) + 1 }, (_, i) => W / 2 + (i - Math.floor(W / 2 / S)) * S)
const GRID_Y = Array.from({ length: 2 * Math.floor(H / 2 / S) + 1 }, (_, i) => H / 2 + (i - Math.floor(H / 2 / S)) * S)

// the figure is drawn in this coordinate box; the HTML icons and vector cells are placed over it in percentages
const VB = { w: 640, h: 260 }
const pct = (x: number, y: number) => ({
  left: `${(x / VB.w) * 100}%`,
  top: `${(y / VB.h) * 100}%`,
})

// five kinds of input on a circle, each with a made-up embedding; only the first 5 of n numbers are shown
const INPUTS: {
  label: string
  Icon: LucideIcon
  color: string
  v: number[]
}[] = [
  { label: "word", Icon: Type, color: A, v: [0.82, -0.14, 0.37, -0.61, 0.05] },
  {
    label: "sentence",
    Icon: MessageSquareText,
    color: B,
    v: [-0.23, 0.71, 0.18, 0.44, -0.58],
  },
  {
    label: "document",
    Icon: FileText,
    color: GROUPS.fruit,
    v: [0.12, 0.35, -0.77, 0.09, 0.63],
  },
  {
    label: "image",
    Icon: Image,
    color: GROUPS.city,
    v: [-0.68, -0.29, 0.54, 0.21, -0.11],
  },
  {
    label: "user",
    Icon: User,
    color: "var(--signal-2)",
    v: [0.47, 0.58, -0.06, -0.39, 0.26],
  },
]
// the icons sit on an inner ring, inside a larger circle that holds them
const RING = { x: 122, y: 122, r: 54, outer: 98 }
const iconAt = (k: number) => {
  const a = -Math.PI / 2 + (k * 2 * Math.PI) / INPUTS.length
  return { x: RING.x + RING.r * Math.cos(a), y: RING.y + RING.r * Math.sin(a) }
}

// a small fully connected network: x position and node count per layer
const LAYERS = [
  { x: 285, n: 4 },
  { x: 350, n: 5 },
  { x: 415, n: 4 },
]
const nodeAt = (l: number, i: number) => ({
  x: LAYERS[l].x,
  y: VB.h / 2 + (i - (LAYERS[l].n - 1) / 2) * 36,
})
const VEC = { x: 530, w: 64, top: 40, cell: 30 }
// the output layer's lines meet here, then an arrow carries on into the vector
const JOIN = { x: 450, y: VB.h / 2 }
// the two flowing arrows between the three parts: items to network, network to vector
const FLOWS = [
  { x1: RING.x + RING.outer + 6, x2: LAYERS[0].x - 16 },
  { x1: JOIN.x + 6, x2: VEC.x - 8 },
]

// every kind of input goes through the same network and comes out as the same shape: one vector of n numbers.
// Clicking an input shows its vector
function InputsToVector() {
  const reduce = useReducedMotion()
  const [picked, setPicked] = useState(0)

  const out = INPUTS[picked]
  const edges = LAYERS.slice(1).flatMap((L, l) =>
    Array.from({ length: LAYERS[l].n }, (_, i) =>
      Array.from({ length: L.n }, (_, j) => [nodeAt(l, i), nodeAt(l + 1, j)]),
    ).flat(),
  )

  return (
    <>
      <Figure>
        <div className="relative" style={{ aspectRatio: `${VB.w} / ${VB.h}` }}>
          <svg viewBox={`0 0 ${VB.w} ${VB.h}`} className="absolute inset-0 size-full overflow-visible">
            <circle
              cx={RING.x}
              cy={RING.y}
              r={RING.outer}
              fill="var(--muted)"
              fillOpacity={0.4}
              stroke="var(--border)"
              strokeDasharray="3 5"
            />
            {edges.map(([a, b], i) => (
              <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--border)" />
            ))}
            {Array.from({ length: LAYERS[2].n }, (_, i) => {
              const a = nodeAt(2, i)
              return <line key={`out-${i}`} x1={a.x} y1={a.y} x2={JOIN.x} y2={JOIN.y} stroke="var(--border)" />
            })}
            {/* dashes march rightwards so the direction of the flow reads at a glance */}
            {FLOWS.map(({ x1, x2 }) => (
              <g key={x1} className="text-muted-foreground">
                <motion.line
                  x1={x1}
                  y1={VB.h / 2}
                  x2={x2 - 6}
                  y2={VB.h / 2}
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeDasharray="4 6"
                  animate={reduce ? undefined : { strokeDashoffset: [20, 0] }}
                  transition={{
                    duration: 0.8,
                    ease: "linear",
                    repeat: Infinity,
                  }}
                />
                <path
                  d={`M${x2 - 8},${VB.h / 2 - 5} L${x2},${VB.h / 2} L${x2 - 8},${VB.h / 2 + 5}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                />
              </g>
            ))}
            {LAYERS.flatMap((L, l) =>
              Array.from({ length: L.n }, (_, i) => {
                const p = nodeAt(l, i)
                return (
                  <circle
                    key={`${l}-${i}`}
                    cx={p.x}
                    cy={p.y}
                    r={7}
                    fill="var(--card)"
                    stroke="var(--muted-foreground)"
                  />
                )
              }),
            )}
            <text x={RING.x} y={VB.h - 6} textAnchor="middle" className="fill-muted-foreground font-mono text-[13px]">
              various items
            </text>
            <text
              x={LAYERS[1].x}
              y={VB.h - 6}
              textAnchor="middle"
              className="fill-muted-foreground font-mono text-[13px]"
            >
              network f
              <tspan baselineShift="sub" className="text-[10px]">
                θ
              </tspan>
            </text>
            <text
              x={VEC.x + VEC.w / 2}
              y={VB.h - 6}
              textAnchor="middle"
              className="fill-muted-foreground font-mono text-[13px]"
            >
              e ∈ ℝⁿ
            </text>
          </svg>

          {INPUTS.map(({ label, Icon, color }, k) => (
            <button
              key={label}
              type="button"
              onClick={() => setPicked(k)}
              style={pct(iconAt(k).x, iconAt(k).y)}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            >
              <span
                className={`grid size-7 place-items-center rounded-full border bg-card transition-shadow sm:size-11 ${
                  picked === k ? "shadow-md" : "hover:shadow"
                }`}
                style={{ borderColor: picked === k ? color : undefined, color }}
              >
                <Icon className="size-3.5 sm:size-5" />
              </span>
              <span
                className={`absolute top-full mt-0.5 font-mono text-[9px] sm:text-xs ${
                  picked === k ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </button>
          ))}

          {/* the output vector: a column of numbers, tinted by size, with a ⋮ for the rest of the n dimensions */}
          <div
            className="absolute flex flex-col overflow-hidden rounded-md border bg-card font-mono text-[9px] sm:text-sm"
            style={{
              ...pct(VEC.x, VEC.top),
              width: `${(VEC.w / VB.w) * 100}%`,
            }}
          >
            {out.v.map((x, i) => (
              <motion.span
                key={`${picked}-${i}`}
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="grid place-items-center tabular-nums"
                style={{
                  aspectRatio: `${VEC.w} / ${VEC.cell}`,
                  background: `color-mix(in oklch, ${out.color} ${Math.round(Math.abs(x) * 45)}%, transparent)`,
                }}
              >
                {x.toFixed(2)}
              </motion.span>
            ))}
            <span
              className="grid place-items-center text-muted-foreground"
              style={{ aspectRatio: `${VEC.w} / ${VEC.cell}` }}
            >
              ⋮
            </span>
          </div>
        </div>
      </Figure>
      {/* outside the card and at body size, so it reads as part of the text rather than fine print */}
      <p className="mt-3 text-center text-[13px] text-muted-foreground">
        Different inputs, one network, and the same shape out: a vector of n numbers.
      </p>
    </>
  )
}

function SpaceExplorer() {
  const [q, setQ] = useState(0)
  const [metric, setMetric] = useState<0 | 1>(0)
  const query = WORDS[q]
  const nearest = nearestTo(WORDS, q, metric)
  const near = new Set(nearest.map((w) => w.word))
  const [ox, oy] = px([0, 0])
  const [qx, qy] = px(query.v)
  const color = GROUPS[query.group]

  return (
    <Figure caption="A toy 2D embedding space, placed by hand. Click a point or pick a word to see its 3 nearest neighbours.">
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

      <NeighbourPanel words={WORDS} q={q} setQ={setQ} metric={metric} setMetric={setMetric} nearest={nearest} />
    </Figure>
  )
}

function SpaceExplorer3D() {
  const [q, setQ] = useState(1)
  const [metric, setMetric] = useState<0 | 1>(0)
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
    <Figure caption="A toy 3D embedding space, placed by hand. Drag to rotate; click a point or pick a word to see its 3 nearest neighbours.">
      <div ref={ref}>
        <Suspense fallback={<div className="aspect-[7/5] w-full sm:aspect-[7/4]" />}>
          <EmbeddingSpace3D points={points} links={nearest.map((w) => [q, w.i])} play={inView} onPick={setQ} />
        </Suspense>
        <p className="mt-2 flex items-center justify-end gap-1.5 font-mono text-xs text-muted-foreground">
          <Hand className="size-3.5" />
          drag your cursor to explore
        </p>
      </div>
      <NeighbourPanel words={WORDS_3D} q={q} setQ={setQ} metric={metric} setMetric={setMetric} nearest={nearest} />
    </Figure>
  )
}

// the Inputs (word, measure) and Output (nearest neighbours) box under both explorers
function NeighbourPanel({
  words,
  q,
  setQ,
  metric,
  setMetric,
  nearest,
}: {
  words: Word[]
  q: number
  setQ: (q: number) => void
  metric: 0 | 1
  setMetric: (m: 0 | 1) => void
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
      <div className="mt-3 flex items-center gap-4 font-mono text-xs text-muted-foreground">
        <span className="w-24 shrink-0">measure</span>
        <Toggle
          value={metric}
          onChange={setMetric}
          options={[
            { value: 0, label: "distance", color: "var(--muted-foreground)" },
            { value: 1, label: "cosine", color: "var(--muted-foreground)" },
          ]}
        />
      </div>
      <p className="mt-3 border-t pt-3 font-mono text-xs tracking-widest text-muted-foreground uppercase">Output</p>
      <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 font-mono text-sm">
        <span className="text-muted-foreground">
          nearest to <span style={{ color }}>{query.word}</span> =
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

function ExampleGrid() {
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
                distance = <span className="text-sm font-medium text-foreground">{dist(e.a, e.b).toFixed(2)}</span> · cosine
                = <span className="text-sm font-medium text-foreground">{cosine(e.a, e.b).toFixed(2)}</span>
              </p>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}

// each formula with its parts labelled underneath, matching the cross entropy note
const FORMULA = [
  `\\underbrace{f_\\theta}_{${texNote("network")}}(\\underbrace{\\mathbf{x}}_{${texNote("input")}}) =`,
  `\\underbrace{\\mathbf{e}}_{${texNote("embedding")}}`,
  `\\in \\underbrace{\\mathbb{R}^n}_{${texNote("n numbers")}}`,
].join(" \\, ")

// written squared: a square root over the annotated sum would stretch down over the labels
const DIST_FORMULA = [
  `\\underbrace{d(${texColor(A, "\\mathbf{e}_i")}, ${texColor(B, "\\mathbf{e}_j")})^2}_{${texNote("squared\ndistance")}} =`,
  `\\underbrace{\\mathop{\\Large\\sum}\\limits_{k=1}^{n}}_{${texNote("sum over\ndimensions")}}`,
  `\\underbrace{(${texColor(A, "e_{ik}")} - ${texColor(B, "e_{jk}")})^2}_{${texNote("gap in dimension k,\nsquared")}}`,
].join(" \\, ")

const COS_FORMULA = [
  `\\underbrace{\\cos(${texColor(A, "\\mathbf{e}_i")}, ${texColor(B, "\\mathbf{e}_j")})}_{${texNote("cosine\nsimilarity")}} =`,
  `\\underbrace{${texColor(A, "\\mathbf{e}_i")} \\cdot ${texColor(B, "\\mathbf{e}_j")}}_{${texNote("dot product")}}`,
  `\\Big/`,
  `\\underbrace{\\|${texColor(A, "\\mathbf{e}_i")}\\| \\, \\|${texColor(B, "\\mathbf{e}_j")}\\|}_{${texNote("product of\nlengths")}}`,
].join(" \\, ")
