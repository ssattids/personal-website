import { useState } from "react"

import { FunctionPlot, type PlotSeries } from "@/components/function-plot"
import {
  Bullets,
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

// likelihood is cool, the loss is warm, everywhere on the page
const LIK = "oklch(0.75 0.12 235)"
const LOSS = "var(--signal-1)"

const ln = Math.log

// coin example: 7 heads in 10 flips, p = chance of heads
const HEADS = 7
const TAILS = 3
const coinLik = (p: number) => p ** HEADS * (1 - p) ** TAILS
const coinNll = (p: number) => -(HEADS * ln(p) + TAILS * ln(1 - p))
// likelihood is tiny in absolute terms, so plot it scaled so the peak is 1
const PEAK = coinLik(HEADS / (HEADS + TAILS))

const likSeries: PlotSeries = { label: "likelihood", fn: (p) => coinLik(p) / PEAK, color: LIK }
const nllSeries: PlotSeries = { label: "NLL", fn: coinNll, color: LOSS }

export function NegativeLogLikelihoodNote() {
  return (
    <>
      <Section>
        <H2>Background</H2>
        <Bullets
          items={[
            "Likelihood asks: if the model were true, how probable is the data we actually saw?",
            "Training picks the parameters that make the observed data most probable. That's maximum likelihood.",
            "Negative log-likelihood (NLL) is the same idea, flipped into a loss we can minimize.",
          ]}
        />
      </Section>

      <Section>
        <H2>From likelihood to loss</H2>
        <Bullets
          items={[
            <>
              Multiply the probability the model gave each observed outcome:{" "}
              <M>{"\\prod_{i=1}^{N} p_\\theta(y_i \\mid x_i)"}</M>.
            </>,
            <>
              Take the log, which turns the product into a sum:{" "}
              <M>{"\\sum_{i=1}^{N} \\ln(p_\\theta(y_i \\mid x_i))"}</M>.
            </>,
            "Put a minus sign in front, so that higher likelihood means lower loss:",
          ]}
        />
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
              <M>{"x_i"}</M> = input of sample <M>{"i"}</M>
            </>,
            <>
              <M>{"y_i"}</M> = what actually happened for sample <M>{"i"}</M>, e.g. its true label
            </>,
            <>
              <M>{"\\theta"}</M> = the model's parameters, the thing training changes
            </>,
            <>
              <M>{"p_\\theta(y_i \\mid x_i)"}</M> = probability the model gives to <M>{"y_i"}</M> after seeing{" "}
              <M>{"x_i"}</M>
            </>,
            <>
              <M>{"\\ln"}</M> = natural log
            </>,
          ]}
        />
      </Section>

      <Section>
        <H2>Why take the log</H2>
        <Bullets
          items={[
            "Multiplying many probabilities below 1 shrinks toward 0 fast.",
            <>
              Give 1,000 samples a probability of 0.9 each and the product is <M>{"0.9^{1000} \\approx 1.7 \\times 10^{-46}"}</M>,
              below the smallest float32, so it rounds to 0.
            </>,
            "The log turns that product into a sum of normal-sized numbers, which stays exact.",
            "Drag N to watch the product collapse while the NLL just grows.",
          ]}
        />
        <UnderflowExplorer />
      </Section>

      <Section>
        <H2>Same answer, flipped</H2>
        <Bullets
          items={[
            "ln is increasing, so whatever maximizes the likelihood also maximizes the log-likelihood.",
            "The minus sign turns that maximum into a minimum, which is what gradient descent looks for.",
            <>
              Example: a coin lands heads 7 times in 10 flips. The likelihood <M>{"p^7 (1 - p)^3"}</M> peaks at{" "}
              <M>{"p = 0.7"}</M>, and the NLL bottoms out at the same spot.
            </>,
            "Drag the slider or hover over the charts.",
          ]}
        />
        <CoinExplorer />
      </Section>

      <Section>
        <H2>Familiar losses are NLL</H2>
        <Bullets
          items={[
            <>
              Classification: <M>{"p_\\theta(y_i \\mid x_i)"}</M> is the probability of the true class, so the NLL is{" "}
              <NoteLink to="/notes/cross-entropy-loss">cross entropy</NoteLink>.
            </>,
            <>
              Regression with Gaussian noise: <M>{"-\\ln"}</M> of the Gaussian is{" "}
              <M>{"\\frac{(y_i - f_\\theta(x_i))^2}{2\\sigma^2} + \\text{const}"}</M>, so minimizing the NLL is minimizing
              squared error.
            </>,
            "Pick the distribution you believe the data comes from, and the loss falls out of it.",
          ]}
        />
      </Section>

      <Section>
        <H2>Takeaways</H2>
        <Bullets
          items={[
            "NLL = −Σ ln(probability the model gave what actually happened).",
            "The log keeps the numbers from underflowing; the minus sign makes it a loss.",
            "Minimizing NLL finds the same parameters as maximizing likelihood.",
            "Cross entropy and mean squared error are both NLL under different assumptions.",
          ]}
        />
      </Section>
    </>
  )
}

function UnderflowExplorer() {
  const [n, setN] = useState(1000)
  // the exact product, stored in float32, the precision most training runs on
  const product = Math.fround(0.9 ** n)
  const nll = -n * ln(0.9)

  return (
    <Figure caption="N samples, each given probability 0.9. The raw product in float32 against the NLL.">
      <Slider value={n} onChange={setN} label="N samples" min={1} max={1500} step={1} format={(v) => v.toFixed(0)} />
      <Readout>
        <span>
          0.9<sup>{n}</sup> =
        </span>
        <span className="text-lg font-medium" style={{ color: LIK }}>
          {product === 0 ? "0 (underflow)" : product.toExponential(2)}
        </span>
      </Readout>
      <Readout>
        <span>−{n}·ln(0.9) =</span>
        <span className="text-lg font-medium" style={{ color: LOSS }}>
          {nll.toFixed(2)}
        </span>
      </Readout>
    </Figure>
  )
}

function CoinExplorer() {
  const [p, setP] = useState(0.4)

  return (
    <Figure caption="7 heads in 10 flips. Likelihood (scaled so the peak is 1) and NLL against the chance of heads p.">
      <div className="grid gap-4 sm:grid-cols-2">
        <FunctionPlot
          series={[likSeries]}
          x={[0, 1]}
          y={[0, 1]}
          xTicks={2}
          yTicks={2}
          xLabel="p"
          yLabel="likelihood"
          markers={[{ x: p, y: likSeries.fn(p), color: LIK }]}
        />
        <FunctionPlot
          series={[nllSeries]}
          x={[0, 1]}
          y={[0, 20]}
          xTicks={2}
          yTicks={2}
          xLabel="p"
          yLabel="NLL"
          markers={[{ x: p, y: coinNll(p), color: LOSS }]}
          guides={[{ y: coinNll(0.7), label: "minimum at p = 0.7" }]}
        />
      </div>
      <Slider value={p} onChange={setP} label="p (heads)" />
      <Readout>
        <span>
          −[7·ln({p.toFixed(2)}) + 3·ln(1 − {p.toFixed(2)})]
        </span>
        <span className="text-muted-foreground">=</span>
        <span className="text-lg font-medium" style={{ color: LOSS }}>
          {coinNll(p).toFixed(3)}
        </span>
      </Readout>
    </Figure>
  )
}

// the NLL with each part labelled underneath, matching the cross entropy note
const FORMULA = [
  `\\mathcal{L} =`,
  `\\underbrace{\\mathop{\\Large\\sum}\\limits_{i=1}^{N}}_{${texNote("sum over\nexamples")}}`,
  `-`,
  `\\underbrace{\\ln(${texColor(LIK, "p_\\theta(y_i \\mid x_i)")})}_{${texNote("log prob of what happened")}}`,
].join(" \\, ")
