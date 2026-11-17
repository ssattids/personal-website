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
  M,
  NoteLink,
  Readout,
  Slider,
  SubBullets,
  texColor,
  texNote,
  Toggle,
} from "@/notes/parts"

// label 1 is warm, label 0 is cool, everywhere on the page
const POS = "var(--signal-1)"
const NEG = "oklch(0.75 0.12 235)"

const ln = Math.log
const bce = (y: number, p: number) => -(y * ln(p) + (1 - y) * ln(1 - p))

const lossIfOne: PlotSeries = { label: "y = 1: −ln(p)", fn: (p) => -ln(p), color: POS }
const lossIfZero: PlotSeries = { label: "y = 0: −ln(1 − p)", fn: (p) => -ln(1 - p), color: NEG }

export function CrossEntropyNote() {
  return (
    <>
      <H2>Background</H2>
      <Bullets
        items={[
          "Cross entropy, also called log loss, is how a classifier gets scored.",
          "The model gives a probability, we check it against what actually happened, and the loss tells us how surprised the model should be.",
          "A confident right answer costs almost nothing.",
          "A confident wrong answer costs a lot.",
        ]}
      />

      <H2>The formula, piece by piece</H2>
      <Formula tex={FORMULA} />
      <Components
        items={[
          <>
            <M>{"\\mathcal{L}"}</M> = total loss over the dataset
          </>,
          <>
            <M>{"N"}</M> = total number of samples
          </>,
          <>
            <M>{"i"}</M> = index of the current sample, from <M>{"1"}</M> to <M>{"N"}</M>
          </>,
          <>
            <M>{"y_i"}</M> = true label of sample <M>{"i"}</M>, either <M>{"0"}</M> or <M>{"1"}</M>
          </>,
          <>
            <M>{"p_i"}</M> = predicted probability that sample <M>{"i"}</M> is class <M>{"1"}</M>
          </>,
          <>
            <M>{"\\ln"}</M> = natural log, so <M>{"-\\ln"}</M> grows as the probability shrinks
          </>,
        ]}
      />

      <H2>Loss contributions, visualized</H2>
      <Bullets
        items={[
          "Only one term is ever turned on.",
          <>
            If the label is <M>{"1"}</M>, the loss is <M>{"-\\ln(p)"}</M>.
          </>,
          <>
            If the label is <M>{"0"}</M>, it is <M>{"-\\ln(1 - p)"}</M>.
          </>,
          "Both curves are 0 when the model is exactly right and climb to infinity as it becomes certain of the wrong answer.",
          "Drag the slider or hover over the chart.",
        ]}
      />
      <BinaryExplorer />

      <H2>Example situations visualized</H2>
      <Bullets
        items={[
          "The same two curves cover every binary case.",
          <>
            A 0.9 on the right answer costs <M>{"0.105"}</M>.
          </>,
          <>
            A 0.9 on the wrong answer costs <M>{"2.303"}</M>, about 22× more.
          </>,
        ]}
      />
      <ExampleGrid />

      <H2>Cross entropy with M classes</H2>
      <Bullets
        items={[
          <>
            The binary formula is the <M>{"M = 2"}</M> case of this one.
          </>,
        ]}
      />
      <Formula tex={MULTI_FORMULA} />
      <Components
        items={[
          <>
            <M>{"M"}</M> = total number of classes
          </>,
          <>
            <M>{"j"}</M> = index of the current class, from <M>{"1"}</M> to <M>{"M"}</M>
          </>,
          <>
            <M>{"y_{ij}"}</M> = <M>{"1"}</M> if sample <M>{"i"}</M> belongs to class <M>{"j"}</M>, otherwise{" "}
            <M>{"0"}</M>
          </>,
          <>
            <M>{"p_{ij}"}</M> = predicted probability that sample <M>{"i"}</M> is class <M>{"j"}</M>
          </>,
          <>
            <M>{"\\mathcal{L}"}</M>, <M>{"N"}</M>, <M>{"i"}</M> and <M>{"\\ln"}</M> mean the same as above
          </>,
        ]}
      />
      <Bullets
        items={[
          <>
            Only the true class has <M>{"y_{ij} = 1"}</M>, so each sample still costs{" "}
            <M>{"-\\ln"}</M> of the probability given to the right class.
          </>,
        ]}
      />

      <H2>Takeaways</H2>
      <Bullets
        items={[
          "Loss = −ln(probability the model gave the truth). Everything else is bookkeeping.",
          "It's asymmetric on purpose: being confidently wrong costs far more than being unsure.",
          "Use the natural log. ln(0.9) ≈ −0.105, but log₁₀(0.9) ≈ −0.046, a different number.",
        ]}
      />

      <H2>FAQ</H2>
      <div className="mt-4 space-y-3">
        <Accordion title="Why the natural log?">
          <SubBullets
            items={[
              <>
                It gives clean derivatives: <M>{"\\tfrac{d}{dp} \\ln(p) = \\tfrac{1}{p}"}</M>, so with softmax or sigmoid the
                gradient on the logits is exactly <M>{"p - y"}</M>.
              </>,
              <>
                Softmax and sigmoid are built from <M>{"e^x"}</M>, and <M>{"\\ln(e^x) = x"}</M>, which lets libraries
                compute the loss straight from logits in a numerically stable way.
              </>,
              <>
                Cross entropy is the <NoteLink to="/notes/negative-log-likelihood">negative log-likelihood</NoteLink>,
                and statistics writes likelihoods with ln.
              </>,
              "PyTorch, TensorFlow and scikit-learn all use ln, so your numbers match everyone else's.",
              <>
                Why not <M>{"\\log_2"}</M>?
                <SubBullets
                  items={[
                    <>
                      The base only rescales the loss:{" "}
                      <M>{"\\log_2(p) = \\ln(p) / \\ln(2) \\approx 1.443 \\cdot \\ln(p)"}</M>.
                    </>,
                    "Every loss is multiplied by the same constant, so the best model and the ranking of models stay the same.",
                    "What changes is the units, and the gradients scale by the same 1.443, like a slightly bigger learning rate.",
                    "log₂ is the information theory choice: it measures the loss in bits instead of nats, e.g. bits-per-character for language models.",
                  ]}
                />
              </>,
            ]}
          />
        </Accordion>
      </div>
    </>
  )
}

function BinaryExplorer() {
  const [p, setP] = useState(0.9)
  const [label, setLabel] = useState<0 | 1>(1)
  const loss = bce(label, p)
  const color = label ? POS : NEG

  return (
    <Figure caption="Binary cross entropy against the predicted probability p, for each true label.">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Toggle
          value={label}
          onChange={setLabel}
          options={[
            { value: 1, label: "true label = 1", color: POS },
            { value: 0, label: "true label = 0", color: NEG },
          ]}
        />
        <PlotLegend series={[lossIfOne, lossIfZero]} />
      </div>
      <FunctionPlot
        className="mt-4"
        series={[
          { ...lossIfOne, muted: label !== 1 },
          { ...lossIfZero, muted: label !== 0 },
        ]}
        x={[0, 1]}
        y={[0, 5]}
        xLabel="predicted probability p (that the label is 1)"
        yLabel="loss"
        markers={[{ x: p, y: loss, color, label: loss.toFixed(3) }]}
      />
      <Slider value={p} onChange={setP} label="p" />
      <Readout>
        <span>
          −[{label}·ln({p.toFixed(2)}) + {1 - label}·ln(1 − {p.toFixed(2)})]
        </span>
        <span className="text-muted-foreground">=</span>
        <span className="text-lg font-medium" style={{ color }}>
          {loss.toFixed(3)}
        </span>
      </Readout>
    </Figure>
  )
}

const EXAMPLES = [
  { y: 1, p: 0.9, verdict: "is true, predicted true" },
  { y: 1, p: 0.1, verdict: "is true, predicted false" },
  { y: 0, p: 0.9, verdict: "is false, predicted true" },
  { y: 0, p: 0.1, verdict: "is false, predicted false" },
] as const

function ExampleGrid() {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      {EXAMPLES.map((e, i) => {
        const loss = bce(e.y, e.p)
        const color = e.y ? POS : NEG
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
                  y = <span style={{ color }}>{e.y}</span> · p = {e.p}
                </span>
                <span style={{ color }}>{e.verdict}</span>
              </div>
              <FunctionPlot
                series={[e.y ? lossIfOne : lossIfZero]}
                x={[0, 1]}
                y={[0, 4]}
                xTicks={2}
                yTicks={2}
                markers={[{ x: e.p, y: loss, color, label: loss.toFixed(3) }]}
              />
              <p className="font-mono text-xs text-muted-foreground">
                {e.y ? `−ln(${e.p})` : `−ln(1 − ${e.p})`} ={" "}
                <span className="text-sm font-medium text-foreground">{loss.toFixed(3)}</span>
              </p>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}

// the summation formula with each part labelled underneath, like an annotated textbook figure
const FORMULA = [
  `\\mathcal{L} =`,
  `\\underbrace{\\mathop{\\Large\\sum}\\limits_{i=1}^{N}}_{${texNote("sum over examples")}}`,
  `-\\Bigg[\\,`,
  `\\underbrace{${texColor(POS, "y_i")}}_{${texNote("label")}}`,
  `\\underbrace{\\ln(p_i)}_{${texNote("prob of class 1")}}`,
  `+`,
  `\\underbrace{${texColor(NEG, "(1 - y_i)")}}_{${texNote("1 − label")}}`,
  `\\underbrace{\\ln(1 - p_i)}_{${texNote("prob of class 0")}}`,
  `\\,\\Bigg]`,
].join(" \\, ")

const MULTI_FORMULA = [
  `\\mathcal{L} =`,
  `\\underbrace{\\mathop{\\Large\\sum}\\limits_{i=1}^{N}}_{${texNote("sum over examples")}}`,
  `\\Bigg(\\,`,
  `\\underbrace{\\mathop{\\normalsize\\sum}\\limits_{j=1}^{M}}_{${texNote("sum over classes")}}`,
  `\\bigg(\\,`,
  `-`,
  `\\underbrace{${texColor(POS, "y_{ij}")}}_{${texNote("label")}}`,
  `\\underbrace{\\ln(p_{ij})}_{${texNote("prob of class j")}}`,
  `\\,\\bigg)`,
  `\\,\\Bigg)`,
].join(" \\, ")
