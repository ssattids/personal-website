import { useState } from "react"
import { motion } from "motion/react"

import { FunctionPlot, PlotLegend, type PlotSeries } from "@/components/function-plot"
import { Card } from "@/components/ui/card"
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
  Slider,
  SubBullets,
  texColor,
  texNote,
  Toggle,
} from "@/notes/parts"

// same-class pairs are warm (pulled together), different-class pairs are cool (pushed apart), everywhere on the page
const SAME = "var(--signal-1)"
const DIFF = "oklch(0.75 0.12 235)"

// d is the Euclidean distance between the two embeddings, eps the margin
const pull = (d: number) => d ** 2
const push = (d: number, eps: number) => Math.max(0, eps - d) ** 2
const contrastive = (same: number, d: number, eps: number) => (same ? pull(d) : push(d, eps))

const sameSeries: PlotSeries = { label: "same class: d²", fn: pull, color: SAME }
const diffSeries = (eps: number): PlotSeries => ({
  label: "different class: max(0, ε − d)²",
  fn: (d) => push(d, eps),
  color: DIFF,
})

export function ContrastiveLossNote() {
  return (
    <>
      <Section>
        <H2>Background</H2>
        <Bullets
          items={[
            <>
              Contrastive loss trains a network to map inputs to{" "}
              <NoteLink to="/notes/embeddings">embeddings</NoteLink>.
            </>,
            "It scores pairs, not single samples: two inputs go through the same network and we look at how far apart they land.",
            "Pairs from the same class should land close together.",
            "Pairs from different classes should land at least a margin apart.",
            "It's the classic loss for metric learning, e.g. face verification with siamese networks.",
          ]}
        />
      </Section>

      <Section>
        <H2>The formula, piece by piece</H2>
        <Formula tex={FORMULA} animate />
        <Components
          items={[
            <>
              <M>{"\\mathcal{L}_\\text{cont}"}</M> = contrastive loss for one pair of samples
            </>,
            <>
              <M>{"\\mathbf{x}_i, \\mathbf{x}_j"}</M> = the two input samples in the pair
            </>,
            <>
              <M>{"y_i, y_j"}</M> = their class labels
            </>,
            <>
              <M>{"\\theta"}</M> = the network's parameters, the thing training changes
            </>,
            <>
              <M>{"f_\\theta"}</M> = the network, mapping an input to its embedding. Both samples go through the same one
            </>,
            <>
              <M>{"\\mathbf{1}[\\cdot]"}</M> = indicator, <M>{"1"}</M> if the condition inside is true, otherwise{" "}
              <M>{"0"}</M>
            </>,
            <>
              <M>{"\\|\\cdot\\|_2"}</M> = Euclidean distance between the two embeddings, written <M>{"d"}</M> below
            </>,
            <>
              <M>{"\\epsilon"}</M> = the margin, how far apart different-class pairs need to be
            </>,
          ]}
        />
      </Section>

      <Section>
        <H2>Loss contributions, visualized</H2>
        <Bullets
          items={[
            "Only one term is ever turned on, because a pair is either the same class or not.",
            <>
              Same class: the loss is <M>{"d^2"}</M>. The farther apart, the bigger the loss.
            </>,
            <>
              Different class: the loss is <M>{"\\max(0, \\epsilon - d)^2"}</M>. Closer than the margin costs, past it
              costs nothing.
            </>,
            "So the network only spends effort on different-class pairs that are too close.",
          ]}
        />
        <PairExplorer />
      </Section>

      <Section>
        <H2>Example situations visualized</H2>
        <Bullets
          items={[
            <>
              The same two curves cover every pair. Here the margin is <M>{"\\epsilon = 1"}</M>.
            </>,
            <>
              A same-class pair at <M>{"d = 1.5"}</M> costs <M>{"2.250"}</M>: pull them in.
            </>,
            <>
              A different-class pair at <M>{"d = 0.2"}</M> costs <M>{"0.640"}</M>: push them out.
            </>,
            <>
              A different-class pair at <M>{"d = 1.5"}</M> costs <M>{"0"}</M>: already far enough, leave them be.
            </>,
          ]}
        />
        <ExampleGrid />
      </Section>

      <Section>
        <H2>Takeaways</H2>
        <Bullets
          items={[
            "Same class: loss = distance². Different class: loss = (how far inside the margin)².",
            "The margin stops the loss from pushing dissimilar pairs apart forever.",
            "It learns distances, not class probabilities, so it works on classes never seen in training.",
          ]}
        />
      </Section>

      <Section>
        <H2>FAQ</H2>
        <div className="mt-4 space-y-3">
          <Accordion title="Why have a margin at all?">
            <SubBullets
              items={[
                <>
                  Without it the different-class term would reward distance without limit, e.g. <M>{"-d^2"}</M>, and the
                  network could cut the loss forever by blowing up the scale of the embeddings.
                </>,
                <>
                  With <M>{"\\max(0, \\epsilon - d)"}</M>, a pair past the margin has zero loss and zero gradient, so
                  training focuses on the pairs that are still confused.
                </>,
                <>
                  <M>{"\\epsilon"}</M> is a hyperparameter. Its absolute value matters less if the embeddings are
                  normalized to unit length, which is common.
                </>,
              ]}
            />
          </Accordion>
          <Accordion title="How is this different from cross entropy?">
            <SubBullets
              items={[
                <>
                  <NoteLink to="/notes/cross-entropy-loss">Cross entropy</NoteLink> scores one sample against a fixed
                  set of classes, through the probability given to the right one.
                </>,
                "Contrastive loss scores a pair by distance, with no class probabilities at all.",
                "That's why it suits verification: two photos of a person the model never trained on should still land close together.",
              ]}
            />
          </Accordion>
        </div>
      </Section>
    </>
  )
}

function PairExplorer() {
  const [d, setD] = useState(0.6)
  const [eps, setEps] = useState(1)
  const [same, setSame] = useState<0 | 1>(1)
  const loss = contrastive(same, d, eps)
  const color = same ? SAME : DIFF
  const diff = diffSeries(eps)

  return (
    <Figure caption="Contrastive loss against the distance d between the two embeddings, for each kind of pair.">
      <div className="flex justify-end">
        <PlotLegend series={[sameSeries, diff]} />
      </div>
      <FunctionPlot
        className="mt-4"
        series={[
          { ...sameSeries, muted: same !== 1 },
          { ...diff, muted: same !== 0 },
        ]}
        x={[0, 2]}
        y={[0, 4]}
        xLabel="distance d between the embeddings"
        yLabel="loss"
        markers={[{ x: d, y: loss, color, label: loss.toFixed(3) }]}
      />
      {/* widen the sliders' label column to match the "pair" row, so all controls line up */}
      <div className="mt-4 rounded-lg border bg-muted/40 px-4 py-3 [&_label>span:first-child]:w-40">
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">Inputs</p>
        <div className="mt-3 flex items-center gap-4 font-mono text-xs text-muted-foreground">
          <span className="w-40 shrink-0">pair</span>
          <Toggle
            value={same}
            onChange={setSame}
            options={[
              { value: 1, label: "same class", color: SAME },
              { value: 0, label: "different class", color: DIFF },
            ]}
          />
        </div>
        <Slider value={d} onChange={setD} label="distance d" min={0} max={2} color={color} />
        <Slider value={eps} onChange={setEps} label="margin ε" min={0.1} max={2} color={DIFF} />
        <p className="mt-3 border-t pt-3 font-mono text-xs tracking-widest text-muted-foreground uppercase">Output</p>
        <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 font-mono text-sm">
          <span className="text-muted-foreground">loss =</span>
          <span>
            {same}·{d.toFixed(2)}² + {1 - same}·max(0, {eps.toFixed(2)} − {d.toFixed(2)})²
          </span>
          <span className="text-muted-foreground">=</span>
          <span className="text-lg font-medium" style={{ color }}>
            {loss.toFixed(3)}
          </span>
        </div>
      </div>
    </Figure>
  )
}

const EPS = 1
const EXAMPLES = [
  { same: 1, d: 0.2, verdict: "same class, close" },
  { same: 1, d: 1.5, verdict: "same class, far" },
  { same: 0, d: 0.2, verdict: "different class, close" },
  { same: 0, d: 1.5, verdict: "different class, past margin" },
] as const

function ExampleGrid() {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      {EXAMPLES.map((e, i) => {
        const loss = contrastive(e.same, e.d, EPS)
        const color = e.same ? SAME : DIFF
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
                <span className="text-muted-foreground">d = {e.d}</span>
                <span style={{ color }}>{e.verdict}</span>
              </div>
              <FunctionPlot
                series={[e.same ? sameSeries : diffSeries(EPS)]}
                x={[0, 2]}
                y={[0, 4]}
                xTicks={2}
                yTicks={2}
                markers={[{ x: e.d, y: loss, color, label: loss.toFixed(3) }]}
              />
              <p className="font-mono text-xs text-muted-foreground">
                {e.same ? `${e.d}²` : `max(0, ${EPS} − ${e.d})²`} ={" "}
                <span className="text-sm font-medium text-foreground">{loss.toFixed(3)}</span>
              </p>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}

// the pair loss with each part labelled underneath, matching the cross entropy note;
// one line per term, since the distance written out twice is too wide for one
const DIST = `\\|f_\\theta(\\mathbf{x}_i) - f_\\theta(\\mathbf{x}_j)\\|_2`
const FORMULA = [
  `\\begin{aligned}`,
  `\\mathcal{L}_\\text{cont}(\\mathbf{x}_i, \\mathbf{x}_j, \\theta) = {}&`,
  `\\underbrace{${texColor(SAME, "\\mathbf{1}[y_i = y_j]")}}_{${texNote("same\nclass")}} \\,`,
  `\\underbrace{${DIST}^2}_{${texNote("distance²")}} \\\\[0.5em]`,
  `{}+{}&`,
  `\\underbrace{${texColor(DIFF, "\\mathbf{1}[y_i \\neq y_j]")}}_{${texNote("different\nclass")}} \\,`,
  `\\underbrace{\\max(0, \\epsilon - ${DIST})^2}_{${texNote("how far inside\nthe margin")}}`,
  `\\end{aligned}`,
].join(" ")
