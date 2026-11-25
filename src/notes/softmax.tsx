import { useState } from "react"

import {
  Accordion,
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
  SubBullets,
  texColor,
  texNote,
  Tip,
} from "@/notes/parts"
import { Tex } from "@/components/tex"

// scores going in are orange, the same as the sliders; probabilities coming out are blue, everywhere on the page
const SCORE = "var(--signal-1)"
const PROB = "oklch(0.75 0.12 235)"

const softmax = (xs: number[]) => {
  // subtract the max first so exp never overflows; it cancels out in the division
  const top = Math.max(...xs)
  const e = xs.map((x) => Math.exp(x - top))
  const total = e.reduce((s, x) => s + x, 0)
  return e.map((x) => x / total)
}

// "bank" scoring the other words of "I went to the bank to get out money", as in the attention note
const WORDS = ["I", "went", "bank", "money"]
const START = [0, 1, 1.5, 3]

export function SoftmaxNote() {
  return (
    <>
      <Section>
        <H2>Background</H2>
        <Bullets
          items={[
            "A model often ends with a list of raw scores, one per option: one per class, or one per word in attention.",
            "Scores can be any size and any sign, so they can't be read as chances directly.",
            "Softmax turns them into probabilities: every one between 0 and 1, all adding up to 1, with the order kept.",
          ]}
        />
      </Section>

      <Section>
        <H2>The formula</H2>
        <Bullets
          items={[
            <>
              Raise <M>{"e"}</M> to the power of each score, so every one is positive.
            </>,
            "Divide each by the total, so they add up to 1.",
          ]}
        />
        <Formula tex={FORMULA} animate />
        <Components
          items={[
            <>
              <M>{"p_i"}</M> = the probability softmax gives option <M>{"i"}</M>
            </>,
            <>
              <M>{"x_i"}</M> = the score for option <M>{"i"}</M>, any real number
            </>,
            <>
              <M>{"e^{x_i}"}</M> = <M>{"e \\approx 2.718"}</M> raised to that score, always positive
            </>,
            <>
              <M>{"n"}</M> = how many options there are
            </>,
          ]}
        />
      </Section>

      <Section>
        <H2>Why eˣ for softmax?</H2>
        <Bullets
          items={["Softmax needs a function that turns each score into a weight. eˣ has everything that job asks for."]}
        />
        <div className="mt-4 space-y-3">
          <Accordion title="Suitable for a probability function">
            <SubBullets
              items={[
                <>
                  Probabilities can't be negative and must add up to 1.
                  <SubBullets
                    items={[
                      "Every negative input gets a positive input.",
                      <>
                        Dividing each weight by the total makes them add up to 1, and <M>{"e^x"}</M> is above 0 for every{" "}
                        <M>{"x"}</M> (even <M>{"e^{-5}"}</M> is 0.007), so none is negative.
                      </>,
                    ]}
                  />
                </>,
              ]}
            />
          </Accordion>
          <Accordion title="Only the gaps matter">
            <SubBullets
              items={[
                <>
                  <M>{"e^{a + b} = e^a \\cdot e^b"}</M>: adding to the exponent multiplies the result. So adding 1 to a score
                  multiplies its weight by <M>{"e \\approx 2.7"}</M>, and adding 2 multiplies it by 7.4.
                </>,
                <>
                  Add the same <M>{"c"}</M> to every score, and every weight and the total get multiplied by{" "}
                  <M>{"e^c"}</M>, which cancels:
                  <Tex display>
                    {"\\dfrac{e^{x_i + c}}{\\sum_j e^{x_j + c}} = \\dfrac{e^c \\, e^{x_i}}{e^c \\sum_j e^{x_j}} = \\dfrac{e^{x_i}}{\\sum_j e^{x_j}}"}
                  </Tex>
                </>,
                <>
                  So <M>{"[0, 1]"}</M> and <M>{"[100, 101]"}</M> give the same probabilities, 0.27 and 0.73. Only the gap of
                  1 counts.
                  <SubBullets
                    items={[
                      <>
                        Scenario A, <M>{"x_0 = 0"}</M> and <M>{"x_1 = 1"}</M>:
                        <Tex display>
                          {[
                            "\\begin{gathered}",
                            "p_0 = \\dfrac{e^0}{e^0 + e^1} = \\dfrac{1}{1 + 2.72} = 0.27 \\\\[0.8em]",
                            "p_1 = \\dfrac{e^1}{e^0 + e^1} = \\dfrac{2.72}{1 + 2.72} = 0.73",
                            "\\end{gathered}",
                          ].join(" ")}
                        </Tex>
                      </>,
                      <>
                        Scenario B, <M>{"x_0 = 100"}</M> and <M>{"x_1 = 101"}</M>: pull <M>{"e^{100}"}</M> out of the top and
                        bottom, and it cancels.
                        <Tex display>
                          {[
                            "\\begin{gathered}",
                            "p_0 = \\dfrac{e^{100}}{e^{100} + e^{101}} = \\dfrac{e^{100} \\cdot 1}{e^{100} (1 + e)} = \\dfrac{1}{1 + 2.72} = 0.27 \\\\[0.8em]",
                            "p_1 = \\dfrac{e^{101}}{e^{100} + e^{101}} = \\dfrac{e^{100} \\cdot e}{e^{100} (1 + e)} = \\dfrac{2.72}{1 + 2.72} = 0.73",
                            "\\end{gathered}",
                          ].join(" ")}
                        </Tex>
                      </>,
                    ]}
                  />
                </>,
                <>
                  A gap of <M>{"d"}</M> between two scores makes one probability <M>{"e^d"}</M> times the other: a gap of 1
                  is 2.7×, 2 is 7.4×, 5 is 148×.
                </>,
                <>
                  It's what lets the code below subtract the largest score: <M>{"e^{1000}"}</M> overflows, but shifting
                  every score down by 1000 changes nothing.
                </>,
              ]}
            />
          </Accordion>
          <Accordion title="Easy to train">
            <SubBullets
              items={[
                "A network learns by nudging its scores along their gradients, so the function needs to be smooth, with no jumps or corners. eˣ is smooth everywhere.",
                <>
                  Its gradient is itself,{" "}
                  <span className="whitespace-nowrap">
                    <Tip tip={<>gradient of <M>{"e^x"}</M> with respect to <M>{"x"}</M></>}>
                      <M>{"\\tfrac{d}{dx} e^x"}</M>
                    </Tip>{" "}
                    <M>{"= e^x"}</M>
                  </span>
                  , so the gradient reuses values already worked
                  out. For softmax,{" "}
                  <span className="whitespace-nowrap">
                    <Tip tip={<>gradient of <M>{"p_i"}</M> with respect to <M>{"x_i"}</M></>}>
                      <M>{"\\tfrac{\\partial p_i}{\\partial x_i}"}</M>
                    </Tip>{" "}
                    <M>{"= p_i (1 - p_i)"}</M>
                  </span>
                  {" "}which is very simple to calculate.
                </>,
                "Compared to argmax: argmax is flat almost everywhere, so its gradient is 0 and there's nothing to learn from.",
              ]}
            />
          </Accordion>
        </div>
        <ExpExplorer />
      </Section>

      <Section>
        <H2>Step by step</H2>
        <Bullets
          items={[
            'Here "bank" has a score for four words in "I went to the bank to get out money".',
            "Drag the scores. A score of 0 doesn't mean probability 0, and adding 1 to a score multiplies its eˣ by about 2.7.",
          ]}
        />
        <StepExplorer />
      </Section>

      <Section>
        <H2>Why "soft" max</H2>
        <Bullets
          items={[
            "A hard max (argmax) puts all of the probability on the top score and none on the rest.",
            "Softmax leans towards the top score but keeps some for the others, and small changes to the scores move the probabilities smoothly, so gradients can flow through it.",
            <>
              Dividing the scores by a temperature <M>{"T"}</M> first controls how soft: a small <M>{"T"}</M> heads
              towards argmax, a large one towards an even split.
              <SubBullets
                items={[
                  <>
                    This is why <NoteLink to="/notes/attention">attention</NoteLink> divides its scores by{" "}
                    <M>{"\\sqrt{d_k}"}</M>: long vectors give big scores, and big scores push softmax towards argmax.
                  </>,
                ]}
              />
            </>,
          ]}
        />
        <TemperatureExplorer />
      </Section>

      <Section>
        <H2>In code</H2>
        <Bullets
          items={[
            <>
              <M>{"e^{1000}"}</M> overflows to infinity, so computing the formula as written breaks on big scores.
            </>,
            "Subtracting the largest score first fixes it. It doesn't change the answer, because the same factor cancels on the top and bottom.",
          ]}
        />
        <Code>{CODE}</Code>
      </Section>

      <Section>
        <H2>Where it shows up</H2>
        <Bullets
          items={[
            <>
              Classification: the last layer's scores (logits) go through softmax, and the{" "}
              <NoteLink to="/notes/cross-entropy-loss">cross entropy loss</NoteLink> is −ln of the probability it gives the
              true class.
            </>,
            <>
              <NoteLink to="/notes/attention">Attention</NoteLink>: each word's row of scores becomes the weights for
              mixing the other words' values.
            </>,
            "Language models: the scores for every word in the vocabulary become the probabilities the next word is sampled from, often with a temperature.",
          ]}
        />
      </Section>

      <Section>
        <H2>Takeaways</H2>
        <Bullets
          items={[
            "softmax(x)ᵢ = eˣⁱ / Σⱼ eˣʲ: make every score positive, then divide by the total.",
            "The output is a set of probabilities that add up to 1, in the same order as the scores.",
            "Only the differences between scores matter; scaling them changes how sharp the result is.",
            "Subtract the max before exponentiating so it never overflows.",
          ]}
        />
      </Section>
    </>
  )
}

// one row per word: its score and the probability as a bar
function Bars({ scores, probs }: { scores: number[]; probs: number[] }) {
  return (
    <div className="mt-4 space-y-2 font-mono text-xs sm:text-sm">
      {WORDS.map((w, i) => (
        <div key={w} className="flex items-center gap-3">
          <span className="w-12 shrink-0 text-right text-foreground">{w}</span>
          <span className="w-14 shrink-0 text-right" style={{ color: SCORE }}>
            {scores[i].toFixed(2)}
          </span>
          <div className="h-5 flex-1 overflow-hidden rounded bg-muted/40">
            <div
              className="h-full rounded transition-[width] duration-200"
              style={{ width: `${probs[i] * 100}%`, background: PROB }}
            />
          </div>
          <span className="w-10 shrink-0 text-right" style={{ color: PROB }}>
            {probs[i].toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  )
}

// one row per word, each centred, e.g.
// p_I = e^{score_I} / (e^{score_I} + e^{score_went} + ...) = e^{0.0} / (e^{0.0} + e^{0.0} + ...) = 0.25
const name = (w: string) => texColor(SCORE, `\\text{score}_{\\text{${w}}}`)
const exps = (term: (j: number) => string) => WORDS.map((_, j) => `e^{${term(j)}}`).join(" + ")
const stepTex = (scores: number[], probs: number[]) =>
  [
    "\\begin{gathered}",
    WORDS.map(
      (w, i) =>
        `${texColor(PROB, `p_{\\text{${w}}}`)} = \\dfrac{e^{${name(w)}}}{${exps((j) => name(WORDS[j]))}}` +
        ` = \\dfrac{e^{${texColor(SCORE, scores[i].toFixed(1))}}}{${exps((j) => texColor(SCORE, scores[j].toFixed(1)))}}` +
        ` = ${texColor(PROB, probs[i].toFixed(2))}`,
    ).join(" \\\\[1em] "),
    "\\end{gathered}",
  ].join(" ")
// and the four probabilities added up
const sumTex = (probs: number[]) =>
  `${WORDS.map((w) => texColor(PROB, `p_{\\text{${w}}}`)).join(" + ")}` +
  ` = ${probs.map((p) => texColor(PROB, p.toFixed(2))).join(" + ")}` +
  ` = ${probs.reduce((t, p) => t + p, 0).toFixed(2)}`

function StepExplorer() {
  // every score starts at 0, an even split
  const [scores, setScores] = useState(() => WORDS.map(() => 0))
  const probs = softmax(scores)

  return (
    <Figure>
      {WORDS.map((w, i) => (
        <Slider
          key={w}
          value={scores[i]}
          onChange={(v) => setScores((s) => s.map((x, j) => (j === i ? v : x)))}
          label={<Tex>{name(w)}</Tex>}
          min={-5}
          max={5}
          step={0.1}
          format={(v) => v.toFixed(1)}
        />
      ))}
      {/* three groups, well apart: the sliders, each word's probability worked out, and the probabilities added up */}
      <Tex display className="mt-10 text-[0.6rem] sm:text-sm">
        {stepTex(scores, probs)}
      </Tex>
      <Tex display className="mt-10 text-[0.6rem] sm:text-sm">
        {sumTex(probs)}
      </Tex>
    </Figure>
  )
}

// e^x from -5 to 5, with a point you can slide along it; viewBox units, y runs from 0 to 150
const EW = 560
const EH = 260
const EPAD = 36
const EXMAX = 5
const EYMAX = 150
const ex = (x: number) => EW / 2 + (x / EXMAX) * (EW / 2 - EPAD)
const ey = (y: number) => EH - EPAD - (Math.min(y, EYMAX) / EYMAX) * (EH - 2 * EPAD)
const EXP_PATH = Array.from({ length: 121 }, (_, i) => -EXMAX + (i * 2 * EXMAX) / 120)
  .map((x, i) => `${i ? "L" : "M"}${ex(x)},${ey(Math.exp(x))}`)
  .join("")

function ExpExplorer() {
  const [x, setX] = useState(1)
  const y = Math.exp(x)

  return (
    <Figure caption="eˣ never touches 0 and always rises. Each step of 1 to the right multiplies it by about 2.7.">
      <svg viewBox={`0 0 ${EW} ${EH}`} className="w-full select-none">
        {[0, 50, 100, 150].map((v) => (
          <g key={v}>
            <line x1={EPAD} x2={EW - EPAD} y1={ey(v)} y2={ey(v)} className="stroke-foreground/5" />
            <text x={EPAD - 6} y={ey(v)} dy="0.35em" textAnchor="end" className="fill-muted-foreground font-mono text-[10px]">
              {v}
            </text>
          </g>
        ))}
        {[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((v) => (
          <text key={v} x={ex(v)} y={EH - EPAD + 16} textAnchor="middle" className="fill-muted-foreground font-mono text-[10px]">
            {v}
          </text>
        ))}
        <line x1={EPAD} x2={EW - EPAD} y1={ey(0)} y2={ey(0)} className="stroke-white/15" />
        <line x1={ex(0)} x2={ex(0)} y1={EPAD} y2={EH - EPAD} className="stroke-white/15" />

        {/* axis names: x along the bottom, eˣ above the top of the y axis */}
        <text x={EW / 2} y={EH - 2} textAnchor="middle" className="fill-muted-foreground font-mono text-[11px]">
          <tspan fill={SCORE}>x</tspan>, the score
        </text>
        <text x={4} y={EPAD - 14} className="fill-muted-foreground font-mono text-[11px]">
          e<tspan baselineShift="super" className="text-[8px]">x</tspan>, the weight
        </text>

        <path d={EXP_PATH} fill="none" className="stroke-foreground" strokeWidth={2.5} />

        <line x1={ex(x)} x2={ex(x)} y1={ey(0)} y2={ey(y)} stroke={SCORE} strokeOpacity={0.7} strokeDasharray="3 4" />
        <circle cx={ex(x)} cy={ey(y)} r={6} fill={SCORE} className="stroke-background" strokeWidth={2} />
      </svg>
      {/* the track spans the plot's x axis, so the thumb sits right under the point */}
      <input
        type="range"
        min={-EXMAX}
        max={EXMAX}
        step={0.1}
        value={x}
        onChange={(e) => setX(Number(e.target.value))}
        aria-label="x"
        className="mt-1"
        style={{ accentColor: SCORE, marginLeft: `${(EPAD / EW) * 100}%`, width: `${((EW - 2 * EPAD) / EW) * 100}%` }}
      />
      <Readout>
        <span>
          e<sup style={{ color: SCORE }}>{x.toFixed(1)}</sup> =
        </span>
        <span className="text-lg font-medium text-foreground">{y.toFixed(2)}</span>
        <span className="ml-3 text-muted-foreground">
          one more, e<sup>{(x + 1).toFixed(1)}</sup> = {Math.exp(x + 1).toFixed(2)}, is 2.72× as big
        </span>
      </Readout>
    </Figure>
  )
}

function TemperatureExplorer() {
  const [t, setT] = useState(1)
  const scaled = START.map((x) => x / t)
  const probs = softmax(scaled)

  return (
    <Figure caption="The same four scores divided by a temperature T before the softmax. Small T heads towards argmax, large T towards an even split.">
      <Slider value={t} onChange={setT} label="temperature T" min={0.1} max={5} step={0.05} format={(v) => v.toFixed(2)} />
      <Bars scores={scaled} probs={probs} />
      <Readout>
        <span>top word gets</span>
        <span className="text-lg font-medium" style={{ color: PROB }}>
          {Math.max(...probs).toFixed(2)}
        </span>
        <span className="text-muted-foreground">(an even split would be 0.25)</span>
      </Readout>
    </Figure>
  )
}

const FORMULA = [
  `\\underbrace{${texColor(PROB, "p_i")}}_{${texNote("probability\nof item i")}} = \\text{softmax}(${texColor(SCORE, "x")})_i =`,
  `\\dfrac{\\underbrace{e^{${texColor(SCORE, "x_i")}}}_{${texNote("make it positive")}}}{\\underbrace{\\textstyle\\sum_{j=1}^{n} e^{${texColor(SCORE, "x_j")}}}_{${texNote("total over every score")}}}`,
].join(" \\, ")

const CODE = `import numpy as np

def softmax(x):
    e = np.exp(x - x.max())  # subtract the max so exp never overflows
    return e / e.sum()

softmax(np.array([0, 1, 1.5, 3]))  # [0.04, 0.10, 0.16, 0.71]`
