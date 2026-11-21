import { useRef, useState, type PointerEvent, type ReactNode } from "react"
import { motion, useReducedMotion } from "motion/react"
import { Hand } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import {
  Accordion,
  AccordionLink,
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

// everywhere on the page the positive is light blue and its distance d(a, p) a darker blue,
// the negative and d(a, n) the same in orange; the anchor is neutral and the margin green
const POS = "oklch(0.8 0.1 230)"
const NEG = "oklch(0.82 0.11 65)"
const DP = "oklch(0.6 0.16 255)"
const DN = "oklch(0.66 0.18 45)"
const ANCHOR = "var(--foreground)"
const MARGIN = "oklch(0.72 0.14 150)"

// colours the positive, the negative, their distances and the margin wherever they're named in a string of prose.
// "negative dot product" is arithmetic, not the negative item, so it stays plain
const PAINT: [RegExp, string][] = [
  [/^(?:d|distance)\((?:a|anchor), (?:p|positive)\)$/, DP],
  [/^(?:d|distance)\((?:a|anchor), (?:n|negative)\)$/, DN],
  [/^positives?$/i, POS],
  [/^negatives?$/i, NEG],
  [/^(?:margins?|m)$/i, MARGIN],
]
function paint(node: ReactNode): ReactNode {
  if (typeof node !== "string") return node
  return node
    .split(/((?:d|distance)\((?:a|anchor), (?:p|n|positive|negative)\)|\b[Pp]ositives?\b|\b[Nn]egatives?\b(?! dot)|\b[Mm]argins?\b|(?<![\w'’])m(?![\w'’]))/)
    .map((part, i) => {
      const color = PAINT.find(([re]) => re.test(part))?.[1]
      return color ? (
        <span key={i} style={{ color }}>
          {part}
        </span>
      ) : (
        part
      )
    })
}
const Pos = ({ children }: { children: ReactNode }) => <span style={{ color: POS }}>{children}</span>
const Neg = ({ children }: { children: ReactNode }) => <span style={{ color: NEG }}>{children}</span>
const Margin = ({ children }: { children: ReactNode }) => <span style={{ color: MARGIN }}>{children}</span>

type Vec = [number, number]

const len = ([x, y]: Vec) => Math.hypot(x, y)
// the anchor sits at the origin, so a point's distance to it is just its length
const triplet = (dp: number, dn: number, m: number) => Math.max(0, m + dp - dn)

// where the negative falls, relative to the positive and the margin
function zoneOf(dp: number, dn: number, m: number) {
  if (dn < dp) return { name: "hard negative", note: "closer than the positive, so both circles show" }
  if (dn < dp + m) return { name: "semi-hard negative", note: "farther than the positive but inside the margin, so only the green circle shows" }
  return { name: "easy negative", note: "past the margin, so the loss is zero and there's nothing to learn" }
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
                    <Pos>Positive</Pos>: something that should match it, e.g. a video they
                    watched.
                  </>,
                  <>
                    <Neg>Negative</Neg>: something that shouldn't, e.g. a video they skipped.
                  </>,
                ].map(paint)}
              />
            </>,
            "The rule: the positive should be closer to the anchor than the negative is, by at least a margin.",
          ].map(paint)}
        />
        <PhotoPairs />
      </Section>

      <Section>
        <H2>The formula, piece by piece</H2>
        <Bullets
          items={[
            "We want to minimize the distance between the anchor and the positive item and maximize the distance between the anchor and the negative.",
          ].map(paint)}
        />
        <Formula tex={FORMULA} animate />
        <Components
          items={[
            <>
              <M>{"\\mathcal{L}"}</M> = triplet loss for one triplet
            </>,
            <>
              <M>{"\\mathbf{a}"}</M>, <M>{texColor(POS, "\\mathbf{p}")}</M>, <M>{texColor(NEG, "\\mathbf{n}")}</M> =
              the embeddings of the anchor, the <Pos>positive</Pos> and the <Neg>negative</Neg>
            </>,
            <>
              <M>{"d"}</M> = the distance function between two embeddings, usually Euclidean
            </>,
            <>
              <M>{texColor(MARGIN, "m")}</M> = the <Margin>margin</Margin>,{" "}
              <AccordionLink to="why-the-margin">
                how much closer the <Pos>positive</Pos> has to be than the <Neg>negative</Neg>
              </AccordionLink>
            </>,
            <>
              <M>{"\\max(0, \\cdot)"}</M> = no loss once the rule holds, so satisfied triplets stop pulling on the
              network
            </>,
          ].map(paint)}
        />
      </Section>

      <Section>
        <H2>A triplet, visualized</H2>
        <Bullets
          items={[
            "The anchor sits in the middle, with two circles around it sized by the loss: the inner one without the margin, the outer one with it.",
            <>
              Moving the <Pos>positive</Pos> away grows them; moving the <Neg>negative</Neg> away shrinks them, until the loss is zero and they disappear.
            </>,
            "Drag the two points and the margin to see where the loss kicks in.",
          ].map(paint)}
        />
        <TripletExplorer />
      </Section>

      <Section>
        <H2>Example situations visualized</H2>
        <Bullets
          items={[
            <>
              A <Margin>margin</Margin> of <M>{`${texColor(MARGIN, "m")} = 0.15`}</M> in every case. From left to right the <Pos>positive</Pos> drifts away
              from the anchor and the <Neg>negative</Neg> comes in, so the loss goes from low to high. The high-loss case is the chart's
              default.
            </>,
            "As above, the circle sizes are the loss: grey without the margin, green with it.",
            "Low-loss triplets cost nothing; medium and high loss ones are the ones the network learns from.",
            "In the literature the negative is named by where it sits instead: easy past the margin (no circles), semi-hard inside the margin but farther than the positive (green only), hard closer than the positive (both). The chart above names it as you drag, and the names come back in negative mining below.",
          ].map(paint)}
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
              embeds both the <Pos>positive</Pos> and the <Neg>negative</Neg> video; there aren't two video towers.
            </>,
            <>
              So one forward pass per triplet:
              <SubBullets
                items={[
                  "the UserTower runs once, on the user.",
                  "the VideoTower runs twice, on the positive video and on the negative video.",
                  "that gives 3 embeddings, 2 distances and 1 loss.",
                ].map(paint)}
              />
            </>,
          ].map(paint)}
        />
        <TwoTowers />
        <Bullets
          items={["Step 1: embed all three items, each into a vector of the same length."].map(paint)}
        />
        <Code>{STEP_1}</Code>
        <Bullets
          items={[
            "Step 2: measure both distances. Euclidean works, or the negative dot product, so that smaller still means more similar.",
          ].map(paint)}
        />
        <Code>{STEP_2}</Code>
        <Bullets items={["Step 3: compute the loss and backpropagate through both towers."].map(paint)} />
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
          ].map(paint)}
        />
        <Code>{BATCH}</Code>
      </Section>

      <Section>
        <H2>Takeaways</H2>
        <Bullets
          items={[
            "During training, each example is an anchor, a positive and a negative item.",
            "Loss = max(0, m + distance(anchor, positive) − distance(anchor, negative)): the positive must win by a margin.",
            "In a two-tower model, the same item tower embeds both the positive and the negative.",
          ].map(paint)}
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
              ].map(paint)}
            />
          </Accordion>
          <Accordion title={paint("Where do the negatives come from?")}>
            <SubBullets
              items={[
                "Random negatives are mostly easy, so they give zero loss and teach little.",
                "Hard negative mining picks negatives the model currently confuses, often the semi-hard ones, from inside the batch.",
                "Only hard negatives can make training unstable early on, so mixing in random ones is common.",
              ].map(paint)}
            />
          </Accordion>
          <Accordion id="why-the-margin" title={paint("Why the margin?")}>
            <SubBullets
              items={[
                <>
                  Without it, <M>{`${texColor(DP, "d(\\mathbf{a}, \\mathbf{p})")} = ${texColor(DN, "d(\\mathbf{a}, \\mathbf{n})")}`}</M> would cost nothing, and the
                  network could collapse every embedding onto one point.
                </>,
                <>
                  The <Margin>margin</Margin> forces a real gap. Like any hyperparameter it's tuned, and it's easier to pick when the
                  embeddings have unit length.
                </>,
              ].map(paint)}
            />
          </Accordion>
          <Accordion title="At test time, do you have to feed in two videos for every user?">
            <SubBullets
              items={[
                "No. Triplets only exist in training, to produce the loss. At test time the loss is gone and the two towers are used on their own.",
                "During training the same set of weights that make up the video tower is used to embed the positive and negative video. During testing we pass the video or item through the exact same tower to get its embedding.",
              ].map(paint)}
            />
          </Accordion>
        </div>
      </Section>
    </>
  )
}

// the background's two pairs of photos: two dogs of different breeds should embed close together,
// a dog and a hyena far apart. From Wikimedia Commons: the dogs are public domain, the hyena CC BY 2.0 (credited below)
const PHOTOS = {
  anchor: { src: "/notes/triplet-loss/anchor-golden-retriever.jpg", alt: "A golden retriever" },
  positive: { src: "/notes/triplet-loss/positive-labrador.jpg", alt: "A yellow Labrador retriever" },
  negative: { src: "/notes/triplet-loss/negative-hyena.jpg", alt: "A spotted hyena" },
}
const PAIRS = [
  { other: "positive" as const, color: POS, caption: "different breeds, but both dogs: pull together" },
  { other: "negative" as const, color: NEG, caption: "a dog and a hyena: push apart" },
]

function PhotoPairs() {
  const tile = (role: keyof typeof PHOTOS, color: string) => (
    <figure className="flex-1">
      <img
        src={PHOTOS[role].src}
        alt={PHOTOS[role].alt}
        loading="lazy"
        className="aspect-square w-full rounded-xl border-2 object-cover"
        style={{ borderColor: color }}
      />
      <figcaption className="mt-2 text-center font-mono text-xs" style={{ color }}>
        {role}
      </figcaption>
    </figure>
  )
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      {PAIRS.map(({ other, color, caption }) => (
        <Card key={other} className="gap-3 p-4">
          <div className="flex gap-3">
            {tile("anchor", ANCHOR)}
            {tile(other, color)}
          </div>
          <p className="text-center text-sm text-muted-foreground">{paint(caption)}</p>
        </Card>
      ))}
      <p className="text-right text-xs text-muted-foreground sm:col-span-2">
        Hyena photo:{" "}
        <ExternalLink href="https://commons.wikimedia.org/wiki/File:Crocuta_crocuta_Toronto_Zoo.jpg">Mike Bowler</ExternalLink>,{" "}
        <ExternalLink href="https://creativecommons.org/licenses/by/2.0/">CC BY 2.0</ExternalLink>, cropped
      </p>
    </div>
  )
}

// viewBox units; one unit of embedding space is S pixels, the same on both axes so circles stay round
const W = 560
const H = 400
const S = 80
const BOUND: Vec = [(W / 2 - 16) / S, (H / 2 - 16) / S]

// the loss circles are drawn LOSS_ZOOM times plot units, so with both points on the anchor (loss = m = 0.5)
// the circle spans about half the canvas width
const LOSS_ZOOM = 3.5

// the anchor at the centre with two loss circles around it, radius proportional to the loss:
// the inner one without the margin, max(0, d(a,p) − d(a,n)), the outer one with it, max(0, m + d(a,p) − d(a,n)).
// Both grow as the positive moves away and shrink to nothing as the negative moves away
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
  const dn = len(n)
  const withMargin = triplet(dp, dn, m)
  const noMargin = triplet(dp, dn, 0)
  const [ax, ay] = at([0, 0])
  // each point in its light colour, and the line to it, its distance from the anchor, in the darker one
  const points = [
    { key: "p" as const, v: p, label: onDragStart ? "positive" : "p", color: POS, dist: DP },
    { key: "n" as const, v: n, label: onDragStart ? "negative" : "n", color: NEG, dist: DN },
  ]
  return (
    <>
      <circle cx={ax} cy={ay} r={withMargin * scale * LOSS_ZOOM} fill={MARGIN} fillOpacity={0.06} stroke={MARGIN} strokeOpacity={0.5} strokeDasharray="4 5" />
      <circle cx={ax} cy={ay} r={noMargin * scale * LOSS_ZOOM} className="fill-foreground/10 stroke-foreground/50" strokeDasharray="4 5" />
      {/* name each circle just above its top edge. The label rides up with the circle and fades out as it nears the
          top of the canvas, and likewise fades in only once the circle is big enough to hold it clear of the anchor */}
      {onDragStart &&
        [
          { key: "with", loss: withMargin, text: <>circle size = loss with margin = {withMargin.toFixed(2)}</>, color: MARGIN },
          {
            key: "without",
            loss: noMargin,
            text: (
              <>
                circle size = loss without <tspan fill={MARGIN}>margin</tspan> = {noMargin.toFixed(2)}
              </>
            ),
            color: "var(--muted-foreground)",
          },
        ].map(({ key, loss, text, color }) => {
          const r = loss * scale * LOSS_ZOOM
          const y = ay - r - 6
          const fade = (v: number, from: number, to: number) => Math.min(1, Math.max(0, (v - from) / (to - from)))
          return (
            <text
              key={key}
              x={ax}
              y={y}
              textAnchor="middle"
              fill={color}
              opacity={Math.min(fade(y, 10, 40), fade(r, 12, 36))}
              className="pointer-events-none font-mono text-[11px] transition-opacity duration-300"
            >
              {text}
            </text>
          )
        })}
      {points.map(({ key, v, dist }) => {
        const [x, y] = at(v)
        return <line key={key} x1={ax} y1={ay} x2={x} y2={y} stroke={dist} strokeWidth={2} />
      })}
      <circle cx={ax} cy={ay} r={6} fill={ANCHOR} className="stroke-background" strokeWidth={2} />
      {points.map(({ key, v, label, color }) => {
        const [x, y] = at(v)
        return (
          <g
            key={key}
            className={onDragStart ? "cursor-grab touch-none active:cursor-grabbing" : undefined}
            onPointerDown={onDragStart?.(key)}
          >
            {onDragStart && <circle cx={x} cy={y} r={18} fill="transparent" />}
            <circle
              cx={x}
              cy={y}
              r={onDragStart ? 7 : 4.5}
              fill={color}
              className="stroke-background"
              strokeWidth={2}
            />
            <text
              x={x + (onDragStart ? 12 : 8)}
              y={y}
              dy="-0.6em"
              fill={color}
              className={cn("pointer-events-none font-mono", onDragStart ? "text-[12px]" : "text-[11px]")}
            >
              {label}
            </text>
          </g>
        )
      })}
    </>
  )
}

function TripletExplorer() {
  // d(a, p) = 1.41, d(a, n) = 1.02
  const [p, setP] = useState<Vec>([1, 1])
  const [n, setN] = useState<Vec>([-0.72, -0.72])
  const [m, setM] = useState(0.15)
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
    // the positive can't sit right on the anchor
    if (dragging.current === "p" && len(v) < 0.2) return
    ;(dragging.current === "p" ? setP : setN)(v)
  }

  return (
    <Figure
      caption={paint(
        "One triplet in a toy 2D embedding space. Drag the positive and the negative; the anchor stays put. The circles around the anchor are the loss: the inner radius is the loss without the margin, the outer radius the loss with it.",
      )}
    >
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
            <span style={{ color: DP }}>d(a, p) = {dp.toFixed(2)}</span>
          </span>
          <span>
            <span style={{ color: DN }}>d(a, n) = {dn.toFixed(2)}</span>
          </span>
        </div>
        <Slider
          value={m}
          onChange={setM}
          label={<Margin>margin m</Margin>}
          min={0.05}
          max={1.5}
          step={0.005}
          format={(v) => v.toFixed(3)}
          color={MARGIN}
        />
        <p className="mt-3 border-t pt-3 font-mono text-xs tracking-widest text-muted-foreground uppercase">Output</p>
        <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 font-mono text-sm">
          <span className="text-muted-foreground">loss =</span>
          <span>
            max(0, <span style={{ color: MARGIN }}>{m.toFixed(2)}</span> + <span style={{ color: DP }}>{dp.toFixed(2)}</span> −{" "}
            <span style={{ color: DN }}>{dn.toFixed(2)}</span>)
          </span>
          <span className="text-muted-foreground">=</span>
          <span className="text-lg font-medium text-foreground">{loss.toFixed(3)}</span>
        </div>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          <span className="text-foreground">{paint(zone.name)}</span>: {paint(zone.note)}
        </p>
      </div>
    </Figure>
  )
}

const EX_M = 0.15
// d(a, p), d(a, n) = 0.71, 1.98 (low loss), 1.41, 1.27 (medium), 1.41, 1.02 (high, the chart's default)
const EXAMPLES: { label: string; caption: string; p: Vec; n: Vec }[] = [
  { label: "low loss", caption: "positive is closer to anchor than negative", p: [0.5, 0.5], n: [-1.4, -1.4] },
  { label: "medium loss", caption: "positive and negative are roughly the same distance", p: [1, 1], n: [-0.9, -0.9] },
  { label: "high loss", caption: "positive is further from anchor than negative", p: [1, 1], n: [-0.72, -0.72] },
]

// small diagrams, same drawing as the explorer
const EW = 240
const EH = 170
const ES = 40

function ExampleGrid() {
  const reduce = useReducedMotion()
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-3">
      {EXAMPLES.map((e, i) => {
        const dp = len(e.p)
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
                  <span style={{ color: DN }}>d(a, n) = {dn.toFixed(2)}</span>
                </span>
                <span className="text-foreground">{e.label}</span>
              </div>
              <p className="text-sm text-muted-foreground">{paint(e.caption)}</p>
              <svg viewBox={`0 0 ${EW} ${EH}`} className="w-full">
                <TripletDiagram p={e.p} n={e.n} m={EX_M} width={EW} height={EH} scale={ES} />
              </svg>
              <div className="space-y-1 font-mono text-xs text-muted-foreground">
                <p>
                  without <Margin>margin</Margin>: max(0, <span style={{ color: DP }}>{dp.toFixed(2)}</span> −{" "}
                  <span style={{ color: DN }}>{dn.toFixed(2)}</span>) ={" "}
                  <span className="text-foreground">{triplet(dp, dn, 0).toFixed(2)}</span>
                </p>
                <p>
                  with <Margin>margin</Margin>: max(0, <span style={{ color: MARGIN }}>{EX_M}</span> +{" "}
                  <span style={{ color: DP }}>{dp.toFixed(2)}</span> − <span style={{ color: DN }}>{dn.toFixed(2)}</span>) ={" "}
                  <span className="text-sm font-medium text-foreground">{loss.toFixed(2)}</span>
                </p>
              </div>
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
  { y: 84, label: "d(a, p)", from: [0, 1], color: DP },
  { y: 166, label: "d(a, n)", from: [0, 2], color: DN },
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
              <text
                x={COL.input + COL.inputW / 2}
                y={r.y + 4}
                textAnchor="middle"
                className="font-mono text-[12px]"
                fill={r.color}
              >
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
            max(0, <tspan fill={MARGIN}>m</tspan>+<tspan fill={DP}>dₚ</tspan>−<tspan fill={DN}>dₙ</tspan>)
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
  `\\underbrace{${texColor(MARGIN, "m")}}_{${texNote("margin", MARGIN)}} +`,
  `\\underbrace{${texColor(DP, "d(\\mathbf{a}, \\mathbf{p})")}}_{${texNote("distance between\nanchor and positive", DP)}} -`,
  `\\underbrace{${texColor(DN, "d(\\mathbf{a}, \\mathbf{n})")}}_{${texNote("distance between\nanchor and negative", DN)}}`,
  `\\Big)`,
].join(" \\, ")
