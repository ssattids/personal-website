import { useRef, useState, type PointerEvent } from "react"
import { motion, useReducedMotion } from "motion/react"
import { Hand } from "lucide-react"

import { Card } from "@/components/ui/card"
import {
  Accordion,
  Bullets,
  Code,
  Components,
  ExternalLink,
  Figure,
  Formula,
  H2,
  Section,
  M,
  NoteLink,
  Slider,
  SubBullets,
  texColor,
  texNote,
} from "@/notes/parts"

// the positive is warm (pulled in), the negative cool (pushed out), everywhere on the page; the anchor is neutral
const POS = "var(--signal-1)"
const NEG = "oklch(0.75 0.12 235)"
const ANCHOR = "var(--foreground)"

type Vec = [number, number]

const len = ([x, y]: Vec) => Math.hypot(x, y)
// the anchor sits at the origin, so a point's distance to it is just its length
const triplet = (dp: number, dn: number, m: number) => Math.max(0, m + dp - dn)

// where the negative falls, relative to the positive and the margin
function zoneOf(dp: number, dn: number, m: number) {
  if (dn < dp) return { name: "hard", note: "the negative is closer than the positive" }
  if (dn < dp + m) return { name: "semi-hard", note: "the negative is farther, but inside the margin" }
  return { name: "easy", note: "the negative is past the margin, nothing to learn" }
}

export function TripletLossNote() {
  return (
    <>
      <Section>
        <H2>Background</H2>
        <Bullets
          items={[
            <>
              Triplet loss trains a network to map inputs to <NoteLink to="/notes/embeddings">embeddings</NoteLink>,
              like <NoteLink to="/notes/contrastive-loss">contrastive loss</NoteLink> does.
            </>,
            <>
              Instead of a pair, each training example is three items:
              <SubBullets
                items={[
                  <>
                    <span className="text-foreground">Anchor</span>: the reference, e.g. a user.
                  </>,
                  <>
                    <span style={{ color: POS }}>Positive</span>: something that should match it, e.g. a video they
                    watched.
                  </>,
                  <>
                    <span style={{ color: NEG }}>Negative</span>: something that shouldn't, e.g. a video they skipped.
                  </>,
                ]}
              />
            </>,
            "The rule: the positive should be closer to the anchor than the negative is, by at least a margin.",
          ]}
        />
      </Section>

      <Section>
        <H2>The formula, piece by piece</H2>
        <Formula tex={FORMULA} animate />
        <Components
          items={[
            <>
              <M>{"\\mathcal{L}"}</M> = triplet loss for one triplet
            </>,
            <>
              <M>{"\\mathbf{a}"}</M>, <M>{texColor(POS, "\\mathbf{p}")}</M>, <M>{texColor(NEG, "\\mathbf{n}")}</M> =
              the embeddings of the anchor, the positive and the negative
            </>,
            <>
              <M>{"d"}</M> = the distance between two embeddings, usually Euclidean. Smaller means more similar
            </>,
            <>
              <M>{"m"}</M> = the margin, how much closer the positive has to be than the negative
            </>,
            <>
              <M>{"\\max(0, \\cdot)"}</M> = no loss once the rule holds, so satisfied triplets stop pulling on the
              network
            </>,
          ]}
        />
      </Section>

      <Section>
        <H2>A triplet, visualized</H2>
        <Bullets
          items={[
            "The anchor sits in the middle. The inner ring passes through the positive; the outer ring is one margin further out.",
            <>
              The loss is zero only when the <span style={{ color: NEG }}>negative</span> is outside the outer ring.
            </>,
            "Drag the two points and the margin to see where the loss kicks in.",
          ]}
        />
        <TripletExplorer />
      </Section>

      <Section>
        <H2>Example situations visualized</H2>
        <Bullets
          items={[
            <>
              The same positive in every case, at <M>{"d(\\mathbf{a}, \\mathbf{p}) = 1"}</M>, and a margin of{" "}
              <M>{"m = 0.5"}</M>. Only the negative moves.
            </>,
            "Easy triplets cost nothing. Semi-hard and hard ones are the ones the network learns from.",
          ]}
        />
        <ExampleGrid />
      </Section>

      <Section>
        <H2>The computation flow for a two-tower model</H2>
        <Bullets
          items={[
            "In recommendation, users and videos are different kinds of input, so each gets its own network, a tower.",
            <>
              There's one UserTower and one VideoTower. The <span className="text-foreground">same</span> VideoTower
              embeds both the positive and the negative video; there aren't two video towers.
            </>,
            <>
              So one forward pass per triplet:
              <SubBullets
                items={[
                  "the UserTower runs once, on the user.",
                  "the VideoTower runs twice, on the positive video and on the negative video.",
                  "that gives 3 embeddings, 2 distances and 1 loss.",
                ]}
              />
            </>,
          ]}
        />
        <TwoTowers />
        <Bullets
          items={["Step 1: embed all three items, each into a vector of the same length."]}
        />
        <Code>{STEP_1}</Code>
        <Bullets
          items={[
            "Step 2: measure both distances. Euclidean works, or the negative dot product, so that smaller still means more similar.",
          ]}
        />
        <Code>{STEP_2}</Code>
        <Bullets items={["Step 3: compute the loss and backpropagate through both towers."]} />
        <Code>{STEP_3}</Code>
      </Section>

      <Section>
        <H2>Batching in practice</H2>
        <Bullets
          items={[
            "In practice, many triplets go through together as a batch, and the loss is averaged over them.",
            <>
              PyTorch has it built in as{" "}
              <ExternalLink href="https://docs.pytorch.org/docs/stable/generated/torch.nn.TripletMarginLoss.html">
                TripletMarginLoss
              </ExternalLink>
              . Here with a batch of <M>{"N = 100"}</M> triplets and 128-dimensional embeddings:
            </>,
          ]}
        />
        <Code>{BATCH}</Code>
      </Section>

      <Section>
        <H2>Takeaways</H2>
        <Bullets
          items={[
            "Each example is an anchor, a positive and a negative.",
            "Loss = max(0, m + d(anchor, positive) − d(anchor, negative)): the positive must win by a margin.",
            "In a two-tower model, the same item tower embeds both the positive and the negative.",
          ]}
        />
      </Section>

      <Section>
        <H2>FAQ</H2>
        <div className="mt-4 space-y-3">
          <Accordion title="How is this different from contrastive loss?">
            <SubBullets
              items={[
                <>
                  <NoteLink to="/notes/contrastive-loss">Contrastive loss</NoteLink> looks at one pair at a time and asks
                  for an absolute distance: close for same-class pairs, past the margin for the rest.
                </>,
                "Triplet loss only asks for a relative ordering: the positive closer than the negative. That matches ranking problems like recommendations and search.",
              ]}
            />
          </Accordion>
          <Accordion title="Where do the negatives come from?">
            <SubBullets
              items={[
                "Random negatives are mostly easy, so they give zero loss and teach little.",
                "Hard negative mining picks negatives the model currently confuses, often the semi-hard ones, from inside the batch.",
                "Only hard negatives can make training unstable early on, so mixing in random ones is common.",
              ]}
            />
          </Accordion>
          <Accordion title="Why the margin?">
            <SubBullets
              items={[
                <>
                  Without it, <M>{"d(\\mathbf{a}, \\mathbf{p}) = d(\\mathbf{a}, \\mathbf{n})"}</M> would cost nothing, and the
                  network could collapse every embedding onto one point.
                </>,
                <>
                  The margin forces a real gap. Like any hyperparameter it's tuned, and it's easier to pick when the
                  embeddings have unit length.
                </>,
              ]}
            />
          </Accordion>
        </div>
      </Section>
    </>
  )
}

// viewBox units; one unit of embedding space is S pixels, the same on both axes so circles stay round
const W = 560
const H = 320
const S = 80
const BOUND: Vec = [(W / 2 - 16) / S, (H / 2 - 16) / S]

// the anchor at the centre, a ring through the positive and a second ring one margin further out.
// Inside the inner ring is where a negative is hard, between the rings semi-hard, outside easy
function TripletDiagram({
  p,
  n,
  m,
  width = W,
  height = H,
  scale = S,
  onDragStart,
}: {
  p: Vec
  n: Vec
  m: number
  width?: number
  height?: number
  scale?: number
  onDragStart?: (which: "p" | "n") => (e: PointerEvent) => void
}) {
  const at = ([x, y]: Vec) => [width / 2 + x * scale, height / 2 - y * scale] as const
  const dp = len(p)
  const [ax, ay] = at([0, 0])
  const points = [
    { key: "p" as const, v: p, color: POS, label: "positive" },
    { key: "n" as const, v: n, color: NEG, label: "negative" },
  ]
  return (
    <>
      <circle cx={ax} cy={ay} r={(dp + m) * scale} fill={NEG} fillOpacity={0.06} stroke={NEG} strokeOpacity={0.5} strokeDasharray="4 5" />
      <circle cx={ax} cy={ay} r={dp * scale} fill={NEG} fillOpacity={0.14} stroke={POS} strokeOpacity={0.6} strokeDasharray="4 5" />
      {points.map(({ key, v, color }) => {
        const [x, y] = at(v)
        return <line key={key} x1={ax} y1={ay} x2={x} y2={y} stroke={color} strokeWidth={1.5} strokeOpacity={0.8} />
      })}
      <circle cx={ax} cy={ay} r={6} fill={ANCHOR} className="stroke-background" strokeWidth={2} />
      {points.map(({ key, v, color, label }) => {
        const [x, y] = at(v)
        return (
          <g
            key={key}
            className={onDragStart ? "cursor-grab touch-none active:cursor-grabbing" : undefined}
            onPointerDown={onDragStart?.(key)}
          >
            {onDragStart && <circle cx={x} cy={y} r={18} fill="transparent" />}
            <circle cx={x} cy={y} r={onDragStart ? 8 : 5} fill={color} className="stroke-background" strokeWidth={2} />
            {onDragStart && (
              <text x={x + 12} y={y} dy="-0.6em" className="pointer-events-none fill-foreground font-mono text-[12px]">
                {label}
              </text>
            )}
          </g>
        )
      })}
    </>
  )
}

function TripletExplorer() {
  const [p, setP] = useState<Vec>([1, 0.4])
  const [n, setN] = useState<Vec>([-0.9, -0.9])
  const [m, setM] = useState(0.5)
  const svg = useRef<SVGSVGElement>(null)
  const dragging = useRef<"p" | "n" | null>(null)

  const dp = len(p)
  const dn = len(n)
  const loss = triplet(dp, dn, m)
  const zone = zoneOf(dp, dn, m)

  const onDragStart = (which: "p" | "n") => (e: PointerEvent) => {
    dragging.current = which
    svg.current!.setPointerCapture(e.pointerId)
  }
  // screen to viewBox to embedding units, kept inside the plot
  const onMove = (e: PointerEvent) => {
    if (!dragging.current) return
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.current!.getScreenCTM()!.inverse())
    const clamp = (v: number, b: number) => Math.max(-b, Math.min(b, v))
    const v: Vec = [clamp((pt.x - W / 2) / S, BOUND[0]), clamp((H / 2 - pt.y) / S, BOUND[1])]
    // the positive can't sit right on the anchor, or the rings vanish
    if (dragging.current === "p" && len(v) < 0.2) return
    ;(dragging.current === "p" ? setP : setN)(v)
  }

  return (
    <Figure caption="One triplet in a toy 2D embedding space. Drag the positive and the negative; the anchor stays put.">
      <svg
        ref={svg}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full select-none"
        onPointerMove={onMove}
        onPointerUp={() => (dragging.current = null)}
        onPointerCancel={() => (dragging.current = null)}
      >
        <line x1={0} x2={W} y1={H / 2} y2={H / 2} className="stroke-foreground/10" />
        <line x1={W / 2} x2={W / 2} y1={0} y2={H} className="stroke-foreground/10" />
        <TripletDiagram p={p} n={n} m={m} onDragStart={onDragStart} />
        <text x={W / 2 + 10} y={H / 2 + 18} className="pointer-events-none fill-muted-foreground font-mono text-[12px]">
          anchor
        </text>
      </svg>
      <p className="mt-2 flex items-center justify-end gap-1.5 font-mono text-xs text-muted-foreground">
        <Hand className="size-3.5" />
        drag the points to explore
      </p>

      <div className="mt-4 rounded-lg border bg-muted/40 px-4 py-3">
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">Inputs</p>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-muted-foreground">
          <span>
            d(a, p) = <span style={{ color: POS }}>{dp.toFixed(2)}</span>
          </span>
          <span>
            d(a, n) = <span style={{ color: NEG }}>{dn.toFixed(2)}</span>
          </span>
        </div>
        <Slider value={m} onChange={setM} label="margin m" min={0.1} max={1.5} color={NEG} />
        <p className="mt-3 border-t pt-3 font-mono text-xs tracking-widest text-muted-foreground uppercase">Output</p>
        <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 font-mono text-sm">
          <span className="text-muted-foreground">loss =</span>
          <span>
            max(0, {m.toFixed(2)} + <span style={{ color: POS }}>{dp.toFixed(2)}</span> −{" "}
            <span style={{ color: NEG }}>{dn.toFixed(2)}</span>)
          </span>
          <span className="text-muted-foreground">=</span>
          <span className="text-lg font-medium text-foreground">{loss.toFixed(3)}</span>
        </div>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          <span className="text-foreground">{zone.name}</span>: {zone.note}
        </p>
      </div>
    </Figure>
  )
}

const EX_M = 0.5
const EX_P: Vec = [0.8, 0.6]
const EXAMPLES: { n: Vec }[] = [{ n: [-1.5, -1] }, { n: [-0.9, -0.75] }, { n: [-0.5, -0.35] }]

// small diagrams, same drawing as the explorer
const EW = 240
const EH = 170
const ES = 40

function ExampleGrid() {
  const reduce = useReducedMotion()
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-3">
      {EXAMPLES.map((e, i) => {
        const dp = len(EX_P)
        const dn = len(e.n)
        const loss = triplet(dp, dn, EX_M)
        return (
          <motion.div
            key={i}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="h-full gap-3 p-4">
              <div className="flex items-baseline justify-between font-mono text-xs">
                <span className="text-muted-foreground">
                  d(a, n) = <span style={{ color: NEG }}>{dn.toFixed(2)}</span>
                </span>
                <span className="text-foreground">{zoneOf(dp, dn, EX_M).name}</span>
              </div>
              <svg viewBox={`0 0 ${EW} ${EH}`} className="w-full">
                <TripletDiagram p={EX_P} n={e.n} m={EX_M} width={EW} height={EH} scale={ES} />
              </svg>
              <p className="font-mono text-xs text-muted-foreground">
                max(0, {EX_M} + {dp.toFixed(1)} − {dn.toFixed(2)}) ={" "}
                <span className="text-sm font-medium text-foreground">{loss.toFixed(2)}</span>
              </p>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}

// the two-tower forward pass, left to right: three inputs, two towers, three embeddings, two distances, one loss
const TW = { w: 640, h: 250 }
const ROWS = [
  { y: 44, input: "user", emb: "a", color: ANCHOR },
  { y: 125, input: "liked video", emb: "p", color: POS },
  { y: 206, input: "skipped video", emb: "n", color: NEG },
]
const COL = { input: 8, inputW: 110, tower: 160, towerW: 112, emb: 330, dist: 430, loss: 516, lossW: 118 }
const DISTS = [
  { y: 84, label: "d(a, p)", from: [0, 1], color: POS },
  { y: 166, label: "d(a, n)", from: [0, 2], color: NEG },
]

function TwoTowers() {
  const reduce = useReducedMotion()
  const box = "fill-card stroke-muted-foreground"
  const label = "fill-foreground font-mono text-[12px]"
  const small = "fill-muted-foreground font-mono text-[11px]"
  const towerEnd = COL.tower + COL.towerW

  // a line whose dashes march along it, ending in an arrowhead
  const flow = (x1: number, y1: number, x2: number, y2: number, key: string) => {
    const a = Math.atan2(y2 - y1, x2 - x1)
    const head = (s: number) => `${x2 - 8 * Math.cos(a + s)},${y2 - 8 * Math.sin(a + s)}`
    return (
      <g key={key} className="text-muted-foreground">
        <motion.line
          x1={x1}
          y1={y1}
          x2={x2 - 4 * Math.cos(a)}
          y2={y2 - 4 * Math.sin(a)}
          stroke="currentColor"
          strokeWidth={1.25}
          strokeDasharray="4 6"
          animate={reduce ? undefined : { strokeDashoffset: [20, 0] }}
          transition={{ duration: 0.8, ease: "linear", repeat: Infinity }}
        />
        <path d={`M${head(0.45)} L${x2},${y2} L${head(-0.45)}`} fill="none" stroke="currentColor" strokeWidth={1.25} />
      </g>
    )
  }

  return (
    <>
      <Figure>
        <svg viewBox={`0 0 ${TW.w} ${TW.h}`} className="w-full select-none">
          {ROWS.map((r) => (
            <g key={r.input}>
              <rect x={COL.input} y={r.y - 18} width={COL.inputW} height={36} rx={8} className={box} />
              <text x={COL.input + COL.inputW / 2} y={r.y + 4} textAnchor="middle" className={label}>
                {r.input}
              </text>
              {flow(COL.input + COL.inputW + 4, r.y, COL.tower - 4, r.y, `in-${r.y}`)}
              {flow(towerEnd + 4, r.y, COL.emb - 16, r.y, `out-${r.y}`)}
              <circle cx={COL.emb} cy={r.y} r={13} fill="var(--card)" stroke={r.color} />
              <text x={COL.emb} y={r.y + 5} textAnchor="middle" className="font-mono text-[14px] font-semibold" fill={r.color}>
                {r.emb}
              </text>
            </g>
          ))}

          {/* one user tower, and one video tower drawn across both video rows: the same weights embed both */}
          <rect x={COL.tower} y={ROWS[0].y - 22} width={COL.towerW} height={44} rx={10} className={box} />
          <text x={COL.tower + COL.towerW / 2} y={ROWS[0].y + 4} textAnchor="middle" className={label}>
            UserTower
          </text>
          <rect
            x={COL.tower}
            y={ROWS[1].y - 22}
            width={COL.towerW}
            height={ROWS[2].y - ROWS[1].y + 44}
            rx={10}
            className={box}
          />
          <text x={COL.tower + COL.towerW / 2} y={(ROWS[1].y + ROWS[2].y) / 2 - 2} textAnchor="middle" className={label}>
            VideoTower
          </text>
          <text x={COL.tower + COL.towerW / 2} y={(ROWS[1].y + ROWS[2].y) / 2 + 14} textAnchor="middle" className={small}>
            used twice
          </text>

          {DISTS.map((d) => (
            <g key={d.label}>
              {d.from.map((r) => flow(COL.emb + 14, ROWS[r].y, COL.dist - 30, d.y, `${d.label}-${r}`))}
              <text x={COL.dist} y={d.y + 4} textAnchor="middle" className="font-mono text-[12px]" fill={d.color}>
                {d.label}
              </text>
              {flow(COL.dist + 30, d.y, COL.loss - 4, TW.h / 2, `${d.label}-loss`)}
            </g>
          ))}

          <rect x={COL.loss} y={TW.h / 2 - 24} width={COL.lossW} height={48} rx={10} className={box} />
          <text x={COL.loss + COL.lossW / 2} y={TW.h / 2 - 2} textAnchor="middle" className={label}>
            loss
          </text>
          <text x={COL.loss + COL.lossW / 2} y={TW.h / 2 + 14} textAnchor="middle" className={small}>
            max(0, m+dₚ−dₙ)
          </text>
        </svg>
      </Figure>
      {/* outside the card and at body size, so it reads as part of the text rather than fine print */}
      <p className="mt-3 text-center text-[13px] text-muted-foreground">
        Three inputs, two towers, three embeddings, two distances, one loss.
      </p>
    </>
  )
}

const STEP_1 = `user_embedding = UserTower(user_features)             # shape: [embedding_dim]
pos_video_embedding = VideoTower(pos_video_features)  # shape: [embedding_dim]
neg_video_embedding = VideoTower(neg_video_features)  # shape: [embedding_dim]`

const STEP_2 = `d_positive = distance(user_embedding, pos_video_embedding)  # scalar
d_negative = distance(user_embedding, neg_video_embedding)  # scalar

# or, with the negative dot product as the distance (smaller = more similar)
d_positive = -dot(user_embedding, pos_video_embedding)
d_negative = -dot(user_embedding, neg_video_embedding)`

const STEP_3 = `# d_positive should shrink, d_negative should grow
loss = max(0, margin + d_positive - d_negative)

loss.backward()  # autograd, through both towers`

const BATCH = `triplet_loss = nn.TripletMarginLoss(margin=1.0, p=2, eps=1e-7)
anchor = torch.randn(100, 128, requires_grad=True)
positive = torch.randn(100, 128, requires_grad=True)
negative = torch.randn(100, 128, requires_grad=True)
output = triplet_loss(anchor, positive, negative)
output.backward()`

// the loss with each part labelled underneath, matching the other notes
const FORMULA = [
  `\\mathcal{L}(\\mathbf{a}, ${texColor(POS, "\\mathbf{p}")}, ${texColor(NEG, "\\mathbf{n}")}) = \\max\\Big(0,`,
  `\\underbrace{m}_{${texNote("margin")}} +`,
  `\\underbrace{d(\\mathbf{a}, ${texColor(POS, "\\mathbf{p}")})}_{${texNote("anchor to\npositive")}} -`,
  `\\underbrace{d(\\mathbf{a}, ${texColor(NEG, "\\mathbf{n}")})}_{${texNote("anchor to\nnegative")}}`,
  `\\Big)`,
].join(" \\, ")
