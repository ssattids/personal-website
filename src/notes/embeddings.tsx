import { useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { FileText, Image, MessageSquareText, Type, User, type LucideIcon } from "lucide-react"

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
  texNote,
} from "@/notes/parts"
import { A, B, GROUPS } from "@/notes/closeness"

export function EmbeddingsNote() {
  return (
    <>
      <Section>
        <H2>Background</H2>
        <Bullets
          items={[
            "An item e.g. a word, sentence, image, or user converted into a list of numbers, a vector e.g. [0.5, 0.3, ..., 0.2] using a neural network is called an embedding.",
            <>
              The network is trained so that:
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
              <NoteLink to="/notes/euclidean-distance">Euclidean distance</NoteLink>: how far apart the two points are, in a
              straight line. Smaller means more similar.
            </>,
            <>
              <NoteLink to="/notes/cosine-distance">Cosine distance</NoteLink>: how far apart the two vectors' directions
              are, ignoring their lengths. Smaller means more similar.
            </>,
          ]}
        />
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

// each formula with its parts labelled underneath, matching the cross entropy note
const FORMULA = [
  `\\underbrace{f_\\theta}_{${texNote("network")}}(\\underbrace{\\mathbf{x}}_{${texNote("input")}}) =`,
  `\\underbrace{\\mathbf{e}}_{${texNote("embedding")}}`,
  `\\in \\underbrace{\\mathbb{R}^n}_{${texNote("n numbers")}}`,
].join(" \\, ")

