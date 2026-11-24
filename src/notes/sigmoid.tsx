import { useState } from "react"

import {
  Bullets,
  Code,
  Components,
  Figure,
  Formula,
  H2,
  Section,
  M,
  NoteLink,
  Readout,
  Slider,
  texColor,
  texNote,
  Toggle,
} from "@/notes/parts"

// the input is pink, as in the softmax note; the sigmoid's output is warm and its gradient blue, everywhere on the page
const INPUT = "oklch(0.72 0.17 350)"
const OUT = "var(--signal-1)"
const GRAD = "oklch(0.75 0.12 235)"

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x))
const slope = (x: number) => sigmoid(x) * (1 - sigmoid(x))

// past |x| = 4 the gradient is under 0.02, a twelfth of its peak
const FLAT = 4

// viewBox units; x runs from -XMAX to XMAX, y from 0 to 1
const W = 560
const H = 260
const PAD = 36
const XMAX = 8
const px = (x: number) => W / 2 + (x / XMAX) * (W / 2 - PAD)
const py = (y: number) => H - PAD - y * (H - 2 * PAD)
const XS = Array.from({ length: 161 }, (_, i) => -XMAX + (i * 2 * XMAX) / 160)
const path = (f: (x: number) => number) => XS.map((x, i) => `${i ? "L" : "M"}${px(x)},${py(f(x))}`).join("")
const TICKS = [-8, -6, -4, -2, 0, 2, 4, 6, 8]

export function SigmoidNote() {
  return (
    <>
      <Section>
        <H2>Background</H2>
        <Bullets
          items={[
            "Sigmoid squashes any number, however big or small, into a value between 0 and 1.",
            "That makes it a natural way to turn a single score into a probability: the chance of spam, of a click, of yes.",
            <>
              It's the two-option case of <NoteLink to="/notes/softmax">softmax</NoteLink>, and an old activation function
              for the neurons inside a network.
            </>,
          ]}
        />
      </Section>

      <Section>
        <H2>The formula</H2>
        <Formula tex={FORMULA} animate />
        <Components
          items={[
            <>
              <M>{"x"}</M> = the input, any real number
            </>,
            <>
              <M>{"e^{-x}"}</M> = <M>{"e \\approx 2.718"}</M> raised to minus the input: huge for very negative{" "}
              <M>{"x"}</M>, near 0 for very positive <M>{"x"}</M>
            </>,
            <>
              <M>{"\\sigma(x)"}</M> = the output, always between 0 and 1, and exactly 0.5 at <M>{"x = 0"}</M>
            </>,
          ]}
        />
      </Section>

      <Section>
        <H2>The curve and its slope</H2>
        <Bullets
          items={[
            "The derivative is the slope of the curve: how much the output moves when the input moves a little.",
            <>
              It peaks at <M>{"0.25"}</M> when <M>{"x = 0"}</M>, and shrinks towards 0 on both sides.
            </>,
            "Drag the input. In the middle the curve is steep, and out in the shaded parts it's almost flat.",
          ]}
        />
        <Formula tex={DERIVATIVE} animate />
        <CurveExplorer />
      </Section>

      <Section>
        <H2>Saturation and vanishing gradients</H2>
        <Bullets
          items={[
            "Sigmoid and tanh have saturation regions: the flat ends, where a big change in input barely changes the output.",
            "If the inputs are too large or too small (not normalized), neurons easily end up in these flat regions.",
            <>
              There the gradient is almost 0. Backpropagation multiplies the gradients of every layer together, so tiny
              ones shrink towards nothing: the <strong className="text-foreground">vanishing gradient problem</strong>.
              Learning slows down or stops.
            </>,
            'That\'s why inputs are carefully normalized, to keep them in the "active" range where gradients are reasonable.',
          ]}
        />
        <NormalizeExplorer />
      </Section>

      <Section>
        <H2>In code</H2>
        <Bullets
          items={[
            <>
              For a very negative <M>{"x"}</M>, <M>{"e^{-x}"}</M> overflows. Writing it as{" "}
              <M>{"\\tfrac{e^{x}}{1 + e^{x}}"}</M> for negative inputs gives the same answer and never does.
            </>,
          ]}
        />
        <Code>{CODE}</Code>
      </Section>

      <Section>
        <H2>Takeaways</H2>
        <Bullets
          items={[
            "σ(x) = 1 / (1 + e⁻ˣ) squashes any number into (0, 1), with σ(0) = 0.5.",
            "Its slope is σ(x)(1 − σ(x)): at most 0.25, and almost 0 once |x| is past about 4.",
            "Inputs far from 0 land on the flat ends, where gradients vanish and learning stalls, so normalize them first.",
          ]}
        />
      </Section>
    </>
  )
}

// the curve and its slope on one plot, with the flat ends shaded
function Plot({ xs }: { xs: number[] }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
      {[-XMAX, FLAT].map((x) => (
        <rect key={x} x={px(x)} y={PAD} width={px(x + XMAX - FLAT) - px(x)} height={H - 2 * PAD} className="fill-foreground/5" />
      ))}
      {[0, 0.25, 0.5, 1].map((y) => (
        <g key={y}>
          <line x1={PAD} x2={W - PAD} y1={py(y)} y2={py(y)} className="stroke-foreground/5" />
          <text x={PAD - 4} y={py(y)} dy="0.35em" textAnchor="end" className="fill-muted-foreground font-mono text-[10px]">
            {y}
          </text>
        </g>
      ))}
      {TICKS.map((x) => (
        <text key={x} x={px(x)} y={H - PAD + 14} textAnchor="middle" className="fill-muted-foreground font-mono text-[10px]">
          {x}
        </text>
      ))}
      <line x1={PAD} x2={W - PAD} y1={py(0)} y2={py(0)} className="stroke-white/15" />
      <line x1={px(0)} x2={px(0)} y1={PAD} y2={H - PAD} className="stroke-white/15" />
      <text x={px(-XMAX / 2)} y={PAD + 14} textAnchor="middle" className="fill-muted-foreground font-mono text-[10px]">
        flat
      </text>
      <text x={px(XMAX / 2 + FLAT / 2)} y={PAD + 14} textAnchor="middle" className="fill-muted-foreground font-mono text-[10px]">
        flat
      </text>

      <path d={path(sigmoid)} fill="none" stroke={OUT} strokeWidth={2.5} />
      <path d={path(slope)} fill="none" stroke={GRAD} strokeWidth={2.5} />

      {xs.map((x, i) => (
        <g key={i}>
          <line x1={px(x)} x2={px(x)} y1={py(0)} y2={py(sigmoid(x))} stroke={INPUT} strokeOpacity={0.6} strokeDasharray="3 4" />
          <circle cx={px(x)} cy={py(sigmoid(x))} r={5} fill={OUT} className="stroke-background" strokeWidth={2} />
          <circle cx={px(x)} cy={py(slope(x))} r={5} fill={GRAD} className="stroke-background" strokeWidth={2} />
        </g>
      ))}
    </svg>
  )
}

function Legend() {
  return (
    <div className="mt-2 flex gap-4 font-mono text-[11px] text-muted-foreground">
      <span className="flex items-center gap-2">
        <span className="size-2 rounded-full" style={{ background: OUT }} />
        σ(x)
      </span>
      <span className="flex items-center gap-2">
        <span className="size-2 rounded-full" style={{ background: GRAD }} />
        σ′(x), the slope
      </span>
    </div>
  )
}

function CurveExplorer() {
  const [x, setX] = useState(1)

  return (
    <Figure caption="The sigmoid and its slope. Past |x| = 4, in the shaded parts, the slope is under 0.02.">
      <Legend />
      <Plot xs={[x]} />
      <Slider value={x} onChange={setX} label="input x" min={-XMAX} max={XMAX} step={0.1} format={(v) => v.toFixed(1)} color={INPUT} />
      <Readout>
        <span>σ({x.toFixed(1)}) =</span>
        <span className="text-lg font-medium" style={{ color: OUT }}>
          {sigmoid(x).toFixed(3)}
        </span>
        <span className="ml-3">σ′({x.toFixed(1)}) =</span>
        <span className="text-lg font-medium" style={{ color: GRAD }}>
          {slope(x).toFixed(3)}
        </span>
        <span className="text-muted-foreground">({((slope(x) / 0.25) * 100).toFixed(0)}% of the peak)</span>
      </Readout>
    </Figure>
  )
}

// the same five inputs, raw and then shifted and scaled to mean 0 and standard deviation 1
const RAW = [-1, 4.5, 5.5, 6.5, 7.5]
const mean = RAW.reduce((s, x) => s + x, 0) / RAW.length
const std = Math.sqrt(RAW.reduce((s, x) => s + (x - mean) ** 2, 0) / RAW.length)
const NORMALIZED = RAW.map((x) => (x - mean) / std)

function NormalizeExplorer() {
  const [norm, setNorm] = useState<0 | 1>(0)
  const xs = norm ? NORMALIZED : RAW
  const avg = xs.reduce((s, x) => s + slope(x), 0) / xs.length

  return (
    <Figure caption="Five inputs to a sigmoid neuron. Raw, most sit on the flat end; normalized, they spread over the steep middle.">
      <Toggle
        className="self-start"
        value={norm}
        onChange={setNorm}
        options={[
          { value: 0, label: "raw", color: INPUT },
          { value: 1, label: "normalized", color: GRAD },
        ]}
      />
      <Plot xs={xs} />
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
        {xs.map((x, i) => (
          <span key={i}>
            <span style={{ color: INPUT }}>{x.toFixed(2)}</span> → σ′ {slope(x).toFixed(3)}
          </span>
        ))}
      </div>
      <Readout>
        <span>average slope =</span>
        <span className="text-lg font-medium" style={{ color: GRAD }}>
          {avg.toFixed(3)}
        </span>
        <span className="text-muted-foreground">(the most it can be is 0.25)</span>
      </Readout>
    </Figure>
  )
}

const FORMULA = [
  `${texColor(OUT, "\\sigma(")}${texColor(INPUT, "x")}${texColor(OUT, ")")} =`,
  `\\dfrac{1}{\\underbrace{1 + e^{-${texColor(INPUT, "x")}}}_{${texNote("always above 1,\nso the output\nstays under 1")}}}`,
].join(" \\, ")

const DERIVATIVE = [
  `${texColor(GRAD, "\\sigma'(")}${texColor(INPUT, "x")}${texColor(GRAD, ")")} =`,
  `\\dfrac{e^{-${texColor(INPUT, "x")}}}{(1 + e^{-${texColor(INPUT, "x")}})^2} =`,
  `\\underbrace{${texColor(OUT, "\\sigma(x)")} \\, (1 - ${texColor(OUT, "\\sigma(x)")})}_{${texNote("at most 0.25, at x = 0")}}`,
].join(" \\, ")

const CODE = `import numpy as np

def sigmoid(x):
    e = np.exp(-np.abs(x))  # e of a negative number never overflows
    return np.where(x >= 0, 1 / (1 + e), e / (1 + e))

def sigmoid_grad(x):
    s = sigmoid(x)
    return s * (1 - s)  # 0.25 at x = 0

sigmoid(np.array([-4.0, 0.0, 4.0]))       # [0.018, 0.5, 0.982]
sigmoid_grad(np.array([-4.0, 0.0, 4.0]))  # [0.018, 0.25, 0.018]`
