import { useState, type ReactNode } from "react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"
import { FunctionPlot, PlotLegend, type PlotSeries } from "@/components/function-plot"
import { Tex } from "@/components/tex"
import { Card } from "@/components/ui/card"

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
      <Bullets
        items={[
          <>
            For one example with <M>{"M"}</M> classes, take the probability the model gave the right class and score
            it with <M>{"-\\ln"}</M>.
          </>,
          <>
            Binary classification is the <M>{"M = 2"}</M> case.
          </>,
          <>
            Write it out and add it up over <M>{"N"}</M> examples:
          </>,
        ]}
      />
      <Formula />

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

      <H2>Takeaways</H2>
      <Bullets
        items={[
          "Loss = −ln(probability the model gave the truth). Everything else is bookkeeping.",
          "It's asymmetric on purpose: being confidently wrong costs far more than being unsure.",
          "Use the natural log. ln(0.9) ≈ −0.105, but log₁₀(0.9) ≈ −0.046, a different number.",
        ]}
      />
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
const color = (c: string, tex: string) => `\\htmlStyle{color: ${c}}{${tex}}`
const note = (text: string) => `\\htmlStyle{color: var(--muted-foreground); font-family: var(--font-sans)}{\\text{${text}}}`
const FORMULA = [
  `\\underbrace{\\mathop{\\Large\\sum}\\limits_{i=1}^{N}}_{${note("sum over examples")}}`,
  `-\\Bigg[\\,`,
  `\\underbrace{${color(POS, "y_i")}}_{${note("label")}}`,
  `\\underbrace{\\ln p_i}_{${note("prob of class 1")}}`,
  `+`,
  `\\underbrace{${color(NEG, "(1 - y_i)")}}_{${note("1 − label")}}`,
  `\\underbrace{\\ln(1 - p_i)}_{${note("prob of class 0")}}`,
  `\\,\\Bigg]`,
].join(" \\, ")

function Formula() {
  return (
    <Figure>
      <Tex display className="text-[0.7rem] sm:text-xl">
        {FORMULA}
      </Tex>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 border-t pt-4 text-sm text-muted-foreground">
        <span>general form, M classes:</span>
        <Tex className="text-lg text-foreground">{"\\displaystyle \\sum_{j=1}^{M} -y_j \\ln p(y_j)"}</Tex>
        <span>· the bracket above is the M = 2 case</span>
      </div>
    </Figure>
  )
}

function Toggle<T extends number>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string; color: string }[]
}) {
  return (
    <div className="inline-flex rounded-full border bg-muted/40 p-1 font-mono text-xs">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors",
            value === o.value ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <span className="size-2 rounded-full" style={{ background: o.color }} />
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Slider({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <label className="mt-3 flex items-center gap-4 font-mono text-xs text-muted-foreground">
      <span className="w-24 shrink-0">{label}</span>
      <input
        type="range"
        min={0.01}
        max={0.99}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--signal-1)]"
      />
      <span className="w-10 text-right text-foreground">{value.toFixed(2)}</span>
    </label>
  )
}

function Figure({ caption, children }: { caption?: string; children: ReactNode }) {
  return (
    <figure className="mt-6">
      <Card className="gap-0 p-5 sm:p-6">{children}</Card>
      {caption && <figcaption className="mt-2 text-xs text-muted-foreground">{caption}</figcaption>}
    </figure>
  )
}

function Readout({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-lg border bg-muted/40 px-4 py-3 font-mono text-sm">
      {children}
    </div>
  )
}

function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="mt-4 space-y-3 text-muted-foreground">
      {items.map((t, i) => (
        <li key={i} className="flex gap-3 leading-relaxed">
          <span className="mt-2.5 size-1 shrink-0 rounded-full bg-foreground" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  )
}

function H2({ children }: { children: ReactNode }) {
  return <h2 className="mt-16 text-2xl first:mt-0 font-semibold tracking-tight sm:text-3xl">{children}</h2>
}

function M({ children }: { children: string }) {
  return <Tex className="text-foreground">{children}</Tex>
}
