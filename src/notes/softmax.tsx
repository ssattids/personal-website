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
} from "@/notes/parts"

// scores going in are pink, as in the attention note; probabilities coming out are blue, everywhere on the page
const SCORE = "oklch(0.72 0.17 350)"
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
              <M>{"x_i"}</M> = the score for option <M>{"i"}</M>, any real number
            </>,
            <>
              <M>{"n"}</M> = how many options there are
            </>,
            <>
              <M>{"e^{x_i}"}</M> = <M>{"e \\approx 2.718"}</M> raised to that score, always positive
            </>,
            <>
              <M>{"p_i"}</M> = the probability softmax gives option <M>{"i"}</M>
            </>,
          ]}
        />
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
            </>,
            <>
              This is why <NoteLink to="/notes/attention">attention</NoteLink> divides its scores by{" "}
              <M>{"\\sqrt{d_k}"}</M>: long vectors give big scores, and big scores push softmax towards argmax.
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

// one row per word: its score, e to that score, and the probability as a bar
function Bars({ scores, probs, showExp = true }: { scores: number[]; probs: number[]; showExp?: boolean }) {
  return (
    <div className="mt-4 space-y-2 font-mono text-xs sm:text-sm">
      {WORDS.map((w, i) => (
        <div key={w} className="flex items-center gap-3">
          <span className="w-12 shrink-0 text-right text-foreground">{w}</span>
          <span className="w-14 shrink-0 text-right" style={{ color: SCORE }}>
            {scores[i].toFixed(2)}
          </span>
          {showExp && <span className="w-16 shrink-0 text-right text-muted-foreground">{Math.exp(scores[i]).toFixed(2)}</span>}
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

function StepExplorer() {
  const [scores, setScores] = useState(START)
  const exps = scores.map(Math.exp)
  const total = exps.reduce((s, x) => s + x, 0)
  const probs = softmax(scores)

  return (
    <Figure caption='Scores from "bank" to four words. Each row: the score, e to the score, and the probability softmax gives it.'>
      {WORDS.map((w, i) => (
        <Slider
          key={w}
          value={scores[i]}
          onChange={(v) => setScores((s) => s.map((x, j) => (j === i ? v : x)))}
          label={`score(${w})`}
          min={-3}
          max={5}
          step={0.1}
          format={(v) => v.toFixed(1)}
          color={SCORE}
        />
      ))}
      <div className="mt-4 flex gap-3 font-mono text-[11px] text-muted-foreground">
        <span className="w-12 shrink-0" />
        <span className="w-14 shrink-0 text-right">score</span>
        <span className="w-16 shrink-0 text-right">eˣ</span>
        <span className="flex-1" />
        <span className="w-10 shrink-0 text-right">prob</span>
      </div>
      <Bars scores={scores} probs={probs} />
      <Readout>
        <span>total of eˣ = {total.toFixed(2)}, so each probability = eˣ ÷ {total.toFixed(2)}, and they add up to</span>
        <span className="text-lg font-medium" style={{ color: PROB }}>
          {probs.reduce((s, p) => s + p, 0).toFixed(2)}
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
      <Bars scores={scaled} probs={probs} showExp={false} />
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
  `${texColor(PROB, "p_i")} = \\text{softmax}(${texColor(SCORE, "x")})_i =`,
  `\\dfrac{\\underbrace{e^{${texColor(SCORE, "x_i")}}}_{${texNote("make it positive")}}}{\\underbrace{\\textstyle\\sum_{j=1}^{n} e^{${texColor(SCORE, "x_j")}}}_{${texNote("total over every score")}}}`,
].join(" \\, ")

const CODE = `import numpy as np

def softmax(x):
    e = np.exp(x - x.max())  # subtract the max so exp never overflows
    return e / e.sum()

softmax(np.array([0, 1, 1.5, 3]))  # [0.04, 0.10, 0.16, 0.71]`
