import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react"
import { motion, useInView, useReducedMotion } from "motion/react"
import { ChevronLeft, ChevronRight, Hand, Pause, Play } from "lucide-react"

import { cn } from "@/lib/utils"
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
  H3,
  Section,
  M,
  NoteLink,
  SubBullets,
  texColor,
  texNote,
} from "@/notes/parts"

// everywhere on the page the embeddings X are green, queries purple, keys orange and values blue, letters (x, q, k, v)
// and words alike; scores (a query dotted with a key) are pink, attention weights yellow, and a layer's output r teal
const EMBED = "oklch(0.74 0.15 150)"
const QUERY = "oklch(0.7 0.17 300)"
const KEY = "oklch(0.74 0.16 55)"
const VALUE = "oklch(0.7 0.14 240)"
const SCORE = "oklch(0.72 0.17 350)"
const WEIGHT = "oklch(0.85 0.16 95)"
// r, what step 1's feed-forward network hands on to the next layer
const FFN_OUT = "oklch(0.78 0.12 190)"

// colours queries, keys and values wherever they're named in a string of prose: the words, their letters (Q or q, K or k,
// V or v, and X or x for the embeddings), and the matrices W_Q, W_K, W_V, which come out with a coloured subscript
const LETTER: Record<string, string> = { q: QUERY, k: KEY, v: VALUE, x: EMBED }
const PAINT: [RegExp, string][] = [
  [/^quer(?:y|ies)$/i, QUERY],
  [/^keys?$/i, KEY],
  [/^values?$/i, VALUE],
  [/^scores?$/i, SCORE],
]
function paint(node: ReactNode): ReactNode {
  if (typeof node !== "string") return node
  return node
    .split(/(\b[Qq]uer(?:y|ies)\b|\b[Kk]eys?\b|\b[Vv]alues?\b|\b[Ss]cores?\b|\bW_[QKV]\b|Q(?=Kᵀ)|(?<=Q)Kᵀ|(?<![\w'’])[QKVXqkvx](?![\w'’]))/)
    .map((part, i) => {
      if (/^W_[QKV]$/.test(part)) return <Wsub key={i} m={part[2]} />
      const color = PAINT.find(([re]) => re.test(part))?.[1] ?? (/^[QKVXqkvx]ᵀ?$/.test(part) ? LETTER[part[0].toLowerCase()] : undefined)
      return color ? (
        <span key={i} style={{ color }}>
          {part}
        </span>
      ) : (
        part
      )
    })
}
// a weight matrix W with its letter as a coloured subscript
const Wsub = ({ m }: { m: string }) => (
  <>
    W<sub style={{ color: LETTER[m.toLowerCase()] }}>{m}</sub>
  </>
)

type Vec = number[]

const dot = (a: Vec, b: Vec) => a.reduce((s, x, k) => s + x * b[k], 0)
const softmax = (xs: number[]) => {
  // subtract the max first so exp never overflows; a masked -Infinity score comes out as weight 0
  const top = Math.max(...xs)
  const e = xs.map((x) => Math.exp(x - top))
  const total = e.reduce((s, x) => s + x, 0)
  return e.map((x) => x / total)
}

// the sentence every figure uses, and hand-picked toy vectors for it. Queries and keys have four features,
// [money, place, action, person], so you can read off why a weight is big; a trained model learns its own.
// The values come from step 3's projection
const TOKENS = ["I", "went", "to", "the", "bank", "to", "get", "out", "money"]
const RAW_Q: Vec[] = [
  [0, 0, 1, 0], // I: wants what it did
  [0, 0.7, 0, 0.7], // went: wants who went, and where
  [0, 1, 0, 0], // to: wants a place
  [0.5, 0.5, 0, 0], // the: wants the noun it introduces
  [1, 0, 0, 0], // bank: wants a hint of which bank, here money
  [0, 0, 1, 0], // to: wants the action it leads to
  [1, 0, 0, 0], // get: wants what is got
  [0, 0, 1, 0], // out: wants the verb it belongs to
  [0.3, 0.7, 0.3, 0], // money: wants where it is, and what's done with it
]
const RAW_K: Vec[] = [
  [0, 0, 0, 1], // I
  [0, 0.3, 1, 0], // went
  [0, 0.3, 0, 0], // to
  [0, 0, 0, 0], // the
  [0.6, 1, 0, 0], // bank
  [0, 0.3, 0, 0], // to
  [0, 0, 1, 0], // get
  [0, 0.2, 0.3, 0], // out
  [1, 0, 0, 0], // money
]
// scaled up so the scores land in the range a trained model's do; with entries below 1 the softmax would be nearly flat
const GAIN = 3
const Q = RAW_Q.map((q) => q.map((x) => x * GAIN))
const K = RAW_K.map((k) => k.map((x) => x * GAIN))
const D_K = Q[0].length

export function AttentionNote() {
  return (
    <>
      <Section>
        <H2>Background</H2>
        <Bullets
          items={[
            <>
              The motivation of attention is to get better <NoteLink to="/notes/embeddings">embeddings</NoteLink> of text
              than traditional embedding techniques.
            </>,
            <>
              To truly understand a sentence the entire sequence is important, e.g. "I went to the bank…" can have various
              different meanings depending on the rest of the sentence. For example:
              <SubBullets
                items={[
                  <>"I went to the bank to get out money" (this is talking about financial institutions)</>,
                  <>"I went to the bank to get some water" (this is talking about rivers)</>,
                ]}
              />
            </>,
          ].map(paint)}
        />
        <BankPhotos />
        <Bullets
          items={[
            "Attention fixes this. Every token looks at every other token in the sentence, itself included.",
          ].map(paint)}
        />
      </Section>

      <Section>
        <H2>Attention step by step</H2>
        <H3>Step 1. Attention at a high level</H3>
        <Bullets
          items={[
            "Each word's embedding goes into self-attention, where every word looks at every other word, then a feed-forward network works on each word on its own. That's one transformer layer, and layers are stacked one after another",
          ].map(paint)}
        />
        <LayerOverview />
        <H3>Step 2. Lookup embeddings</H3>
        <Bullets
          items={[
            "Each token is looked up in an embedding table: one fixed vector per word, the same whatever sentence it's in. \"bank\" gets the same vector next to money as next to water.",
          ]}
        />
        <EmbeddingLookup />
        <H3>Step 3. Get the Query, Key, and Value vectors</H3>
        <Bullets
          items={[
            <>
              {paint("The query vectors are calculated by taking the input X and doing a matrix multiplication with a matrix W_Q")}
              <SubBullets items={["W_Q is a matrix of weights that gets updated via backpropagation"].map(paint)} />
            </>,
          ]}
        />
        <Projection kind="query" />
        <Bullets
          items={[
            <>
              {paint("The key vectors are calculated by taking the input X and doing a matrix multiplication with a matrix W_K")}
              <SubBullets items={["W_K is a matrix of weights that gets updated via backpropagation"].map(paint)} />
            </>,
          ]}
        />
        <Projection kind="key" />
        {/* step 6 links back here */}
        <div id="value-vectors" className="scroll-mt-24">
          <Bullets
            items={[
              <>
                {paint("The value vectors are calculated by taking the input X and doing a matrix multiplication with a matrix W_V")}
                <SubBullets items={["W_V is a matrix of weights that gets updated via backpropagation"].map(paint)} />
              </>,
            ]}
          />
        </div>
        <Projection kind="value" />
        <Bullets items={["Now we have our query, key, and value vectors"].map(paint)} />
        <QkvStack />
        <H3>Step 4. Calculate the score</H3>
        <Bullets items={["Calculating the scores for every word or token by dot producting its query vector with EVERY key vector"].map(paint)} />
        <ScoreGrid />
        <H3>Step 5. Square root and softmax</H3>
        <Bullets
          items={[
            <>
              Divide by square root of <M>d_k</M>
            </>,
            <>
              <NoteLink to="/notes/softmax">Softmax</NoteLink> the output per word or token
            </>,
          ]}
        />
        <ScaleAndSoftmax />
        <H3>Step 6. Distribute the value vectors</H3>
        <Bullets
          items={[
            <>
              Based on the softmax - distribute the{" "}
              <AccordionLink to="value-vectors">
                <span style={{ color: VALUE }}>value</span>
              </AccordionLink>{" "}
              vectors per word or token
            </>,
          ]}
        />
        <WeightedValues />
      </Section>

      <Section>
        <H2>Attention step by step - explore each word</H2>
        <Bullets items={["Explore the attention mechanism computations word by word"].map(paint)} />
        <ArcExplorer />
      </Section>

      <Section>
        <H2>The formula, piece by piece</H2>
        <Bullets
          items={[
            "Stack every token's query into a matrix Q, and the keys and values into K and V, and the whole sentence is one line:",
          ].map(paint)}
        />
        <Formula tex={FORMULA} animate />
        <Components
          items={[
            <>
              <M>{texColor(QUERY, "Q")}</M> = the queries, one row per token
            </>,
            <>
              <M>{texColor(KEY, "K")}</M> = the keys, one row per token
            </>,
            <>
              <M>{texColor(VALUE, "V")}</M> = the values, one row per token
            </>,
            <>
              <M>{`${texColor(QUERY, "Q")}${texColor(KEY, "K")}^{\\top}`}</M> = every query dotted with every key: an{" "}
              <M>{"n \\times n"}</M> grid of scores for <M>{"n"}</M> tokens
            </>,
            <>
              <M>{"d_k"}</M> = the length of each query and key vector,{" "}
              <AccordionLink to="why-root-dk">divided out so the scores don't grow with it</AccordionLink>
            </>,
            <>
              <M>{"\\mathrm{softmax}"}</M> = exponentiates each score and divides by its row's total, so each token's weights
              are positive and sum to 1
            </>,
          ].map(paint)}
        />
      </Section>

      <Section>
        <H2>Many heads</H2>
        <Bullets
          items={[
            "One set of queries and keys can only ask one kind of question. The vectors on this page ask about money, places and actions.",
            <>
              So real models run several attention <span className="text-foreground">heads</span> side by side, each with its
              own three matrices. One might link nouns to the words that describe them, another each word to the one before it.
            </>,
            <>
              Each head works in a smaller space, <M>{"d_k = d_{\\text{model}} / h"}</M> for <M>{"h"}</M> heads, so all of them
              together cost about the same as one big head. Their outputs are concatenated and mixed by one more matrix,{" "}
              <M>{"W_O"}</M>.
            </>,
          ].map(paint)}
        />
      </Section>

      <Section>
        <H2>In code</H2>
        <Bullets
          items={["Step 1: project every token's embedding into its query, key and value."].map(paint)}
        />
        <Code>{STEP_1}</Code>
        <Bullets
          items={["Step 2: score, mask, softmax, and mix the values."].map(paint)}
        />
        <Code>{STEP_2}</Code>
        <Bullets
          items={[
            <>
              PyTorch has it built in, with the fast fused kernels, as{" "}
              <ExternalLink href="https://docs.pytorch.org/docs/stable/generated/torch.nn.functional.scaled_dot_product_attention.html">
                scaled_dot_product_attention
              </ExternalLink>
              :
            </>,
          ]}
        />
        <Code>{BUILT_IN}</Code>
      </Section>

      <Section>
        <H2>Takeaways</H2>
        <Bullets
          items={[
            "Attention replaces each token's vector with a weighted average over the sentence, so its meaning depends on context.",
            "The query is what a token looks for, the key what it can be found by, the value what it hands over.",
            "Attention(Q, K, V) = softmax(QKᵀ / √d_k) V: score every pair, turn the scores into weights, mix the values.",
          ].map(paint)}
        />
      </Section>

      <Section>
        <H2>FAQ</H2>
        <div className="mt-4 space-y-3">
          <Accordion id="why-root-dk" title="Why divide by √d_k?">
            <SubBullets
              items={[
                "A dot product adds up d_k terms. If each entry is roughly unit-sized, the sum's spread grows like √d_k, so dividing by √d_k brings it back to about 1.",
                "Without it, big models (d_k = 64 or 128) get huge scores, and softmax puts nearly all the weight on one token. Its gradient is then close to zero, and training stalls.",
                <>
                  The temperature slider in the <NoteLink to="/notes/softmax">softmax note</NoteLink> shows this: big scores
                  act like a small temperature, and nearly every weight ends up 0 or 1.
                </>,
              ].map(paint)}
            />
          </Accordion>
          <Accordion title={paint("Why separate queries, keys and values, each with its own weight matrix?")}>
            <SubBullets
              items={[
                "Each word plays three roles: what it's looking for (its query), what makes it findable (its key), and what it hands over once found (its value).",
                "Query vs key: \"bank\" looks for words about money or water, but \"money\" is found because it's about money. With one shared vector, the score from a to b would always equal the score from b to a, and each word would tend to score itself highly.",
                "Key vs value: what makes a word findable isn't what it should hand over. \"money\" is found because it's about money; what it passes on is everything about this money.",
                "So each role gets its own weight matrix, W_Q, W_K and W_V. All three multiply the same input X, and each is learned independently via backpropagation.",
              ].map(paint)}
            />
          </Accordion>
          <Accordion title="Why is long context expensive?">
            <SubBullets
              items={[
                "The score grid has one cell per pair of tokens: n² of them. Doubling the context quadruples the grid.",
                "Kernels like FlashAttention never store the whole grid at once, which saves memory, but the n² work is still there.",
              ]}
            />
          </Accordion>
        </div>
      </Section>
    </>
  )
}

// the background's two meanings of "bank", one photo each. From Wikimedia Commons: the Bank of Gibson is CC0,
// the bank of the river Arrow public domain
const BANKS = [
  { src: "/notes/attention/money-bank.jpg", alt: "A bank building with columns", sentence: "to get out money" },
  { src: "/notes/attention/river-bank.jpg", alt: "The bank of a small river", sentence: "to get some water" },
]

function BankPhotos() {
  return (
    <div className="mx-auto mt-6 grid grid-cols-2 gap-6 sm:w-1/2 sm:gap-8">
      {BANKS.map((b) => (
        <figure key={b.src}>
          <img src={b.src} alt={b.alt} loading="lazy" className="aspect-square w-full rounded-xl border object-cover" />
          <figcaption className="mt-2 text-center font-mono text-xs text-muted-foreground">
            I went to the <span className="text-foreground">bank</span> {b.sentence}
          </figcaption>
        </figure>
      ))}
    </div>
  )
}

// step 2: the sentence's words appear one by one, each copying its row out of the embedding table.
// The table runs like a dictionary, from the first "a" words to the last "z" words, with a row for every word the model
// knows; a ··· stands for the thousands of rows skipped between the ones shown
const TABLE = ["a", "aardvark", "abacus", "···", "bank", "···", "get", "···", "I", "···", "money", "···", "out", "···", "the", "to", "···", "went", "···", "zone", "zoo", "zucchini"]
const GAP = "···"
const EMB_D = 6
// a fixed made-up vector per word, so the same word always gets the same row
const embRow = (w: string) =>
  Array.from({ length: EMB_D }, (_, c) => {
    let seed = 0
    for (const ch of w) seed = (seed * 31 + ch.charCodeAt(0)) % 10007
    const x = Math.sin(seed * 12.9898 + c * 78.233) * 43758.5453
    return x - Math.floor(x)
  })

const EL = { w: 640, top: 50, row: 20, gap: 14, cell: 18, label: 70 }
const VOCAB_X = 16
// each table entry's top edge: a word row is EL.row tall, a ··· gap EL.gap
const TABLE_Y = TABLE.reduce<number[]>((ys, _, i) => [...ys, i === 0 ? EL.top : ys[i - 1] + (TABLE[i - 1] === GAP ? EL.gap : EL.row)], [])
const TABLE_H = TABLE_Y[TABLE.length - 1] + EL.row - EL.top
const EL_H = EL.top + TABLE_H + 30
const OUT_X = 420
const OUT_TOP = EL.top + (TABLE_H - TOKENS.length * EL.row) / 2
// seconds between one word and the next, and how long a finished figure holds before it starts over
const STEP = 0.3
const HOLD = 2.4

// drives the step figures: reveals one item every `step` seconds, holds the finished figure, then starts over.
// `shown` items are revealed; each new `cycle` clears the figure. It only ticks while not paused, and, unless `onLoad`,
// while the figure is on screen.
// prev and next pause it and step between `stops` (every tick, unless given); next from the end starts a fresh cycle
function useStepLoop(ref: RefObject<Element | null>, count: number, step = STEP, stops?: number[], onLoad = false) {
  const inView = useInView(ref, { amount: 0.5 })
  const reduce = useReducedMotion()
  const [paused, setPaused] = useState(false)
  const [{ cycle, shown }, setLoop] = useState({ cycle: 0, shown: 0 })

  useEffect(() => {
    if (reduce || paused || (!inView && !onLoad)) return
    const id = setInterval(
      () =>
        setLoop((l) => (l.shown >= count + Math.round(HOLD / step) ? { cycle: l.cycle + 1, shown: 0 } : { ...l, shown: l.shown + 1 })),
      step * 1000,
    )
    return () => clearInterval(id)
  }, [reduce, paused, inView, onLoad, count, step])

  const marks = stops ?? Array.from({ length: count + 1 }, (_, i) => i)
  const seek = (dir: 1 | -1) => {
    setPaused(true)
    setLoop((l) => {
      // during the hold the figure already looks finished, so step from the end
      const at = Math.min(l.shown, count)
      if (dir < 0) return { ...l, shown: marks.findLast((m) => m < at) ?? 0 }
      const to = marks.find((m) => m > at)
      return to === undefined ? { cycle: l.cycle + 1, shown: 0 } : { ...l, shown: to }
    })
  }

  const controls = reduce ? null : (
    <StepControls paused={paused} onPrev={() => seek(-1)} onToggle={() => setPaused((p) => !p)} onNext={() => seek(1)} />
  )
  // clear the figure and play it again from the start
  const restart = () => {
    setPaused(false)
    setLoop((l) => ({ cycle: l.cycle + 1, shown: 0 }))
  }
  return { cycle, shown, reduce, controls, restart }
}

function StepControls({ paused, onPrev, onToggle, onNext }: { paused: boolean; onPrev: () => void; onToggle: () => void; onNext: () => void }) {
  const button = "flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
  return (
    <div className="mt-3 flex items-center justify-center gap-2">
      <button type="button" onClick={onPrev} aria-label="previous step" className={button}>
        <ChevronLeft className="size-4" />
      </button>
      <button type="button" onClick={onToggle} aria-label={paused ? "play" : "pause"} className={cn(button, "border")}>
        {paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
      </button>
      <button type="button" onClick={onNext} aria-label="next step" className={button}>
        <ChevronRight className="size-4" />
      </button>
    </div>
  )
}

function EmbeddingLookup() {
  const ref = useRef<SVGSVGElement>(null)
  const { cycle, shown, reduce, controls } = useStepLoop(ref, TOKENS.length)

  // the table stays neutral; the rows copied out for the sentence are the embeddings' green
  const cells = (w: string, x: number, y: number, color = "var(--foreground)") =>
    embRow(w).map((v, c) => (
      <rect
        key={c}
        x={x + EL.label + c * (EL.cell + 2)}
        y={y + 1}
        width={EL.cell}
        height={EL.row - 2}
        rx={3}
        fill={color}
        fillOpacity={0.1 + v * 0.75}
      />
    ))
  const rowY = (i: number) => TABLE_Y[i]
  const outY = (k: number) => OUT_TOP + k * EL.row
  const midY = EL.top + TABLE_H / 2
  const header = "fill-muted-foreground font-mono text-[11px]"

  return (
    <Figure
      caption={
        <>
          The word embedding lookup table holds one row per word in the vocabulary
        </>
      }
    >
      <svg ref={ref} viewBox={`0 0 ${EL.w} ${EL_H}`} className="w-full select-none">
        {/* each matrix's name centred over its cells, and its shape centred under them */}
        <text x={VOCAB_X + EL.label + (EMB_D * (EL.cell + 2)) / 2} y={EL.top - 10} textAnchor="middle" className={header}>
          word embedding lookup table
        </text>
        <text x={OUT_X + EL.label + (EMB_D * (EL.cell + 2)) / 2} y={OUT_TOP - 10} textAnchor="middle" className={header}>
          embeddings for each word
        </text>
        <text x={VOCAB_X + EL.label + (EMB_D * (EL.cell + 2)) / 2} y={EL.top + TABLE_H + 18} textAnchor="middle" className={header}>
          vocab × d
        </text>
        <text x={OUT_X + EL.label + (EMB_D * (EL.cell + 2)) / 2} y={OUT_TOP + TOKENS.length * EL.row + 18} textAnchor="middle" className={header}>
          n × d
        </text>

        {TABLE.map((w, i) =>
          w === GAP ? (
            // the skipped rows, marked under both the words and the cells
            <g key={i} className="fill-muted-foreground font-mono text-[11px]">
              <text x={VOCAB_X + EL.label - 10} y={rowY(i) + EL.gap / 2 + 4} textAnchor="end">
                {GAP}
              </text>
              <text x={VOCAB_X + EL.label + (EMB_D * (EL.cell + 2)) / 2} y={rowY(i) + EL.gap / 2 + 4} textAnchor="middle">
                {GAP}
              </text>
            </g>
          ) : (
            <g key={i}>
              <text x={VOCAB_X + EL.label - 10} y={rowY(i) + 14} textAnchor="end" className="fill-muted-foreground font-mono text-[12px]">
                {w}
              </text>
              {cells(w, VOCAB_X, rowY(i))}
            </g>
          ),
        )}

        <text x={(VOCAB_X + EL.label + EMB_D * (EL.cell + 2) + OUT_X) / 2 + 20} y={midY - 10} textAnchor="middle" className={header}>
          look up each word
        </text>
        <path
          d={`M${VOCAB_X + EL.label + EMB_D * (EL.cell + 2) + 24},${midY} H${OUT_X + 6} m-7,-5 l7,5 l-7,5`}
          fill="none"
          className="stroke-muted-foreground"
          strokeWidth={1.25}
        />

        {/* remounted each cycle, so the sentence clears at once instead of flying back */}
        <g key={cycle}>
          {TOKENS.map((t, k) => {
            const from = TABLE.indexOf(t)
            const on = reduce || k < shown
            return (
              <g key={k}>
                {!reduce && (
                  <motion.rect
                    x={VOCAB_X + EL.label - 4}
                    y={rowY(from) - 1}
                    width={EMB_D * (EL.cell + 2) + 6}
                    height={EL.row + 2}
                    rx={5}
                    fill="none"
                    className="stroke-foreground"
                    initial={{ opacity: 0 }}
                    animate={on ? { opacity: [0, 1, 0] } : { opacity: 0 }}
                    transition={{ duration: 0.7, times: [0, 0.3, 1] }}
                  />
                )}
                {/* the copy starts on top of its table row and slides across into place */}
                <motion.g
                  initial={reduce ? false : { x: VOCAB_X - OUT_X, y: rowY(from) - outY(k), opacity: 0 }}
                  animate={on ? { x: 0, y: 0, opacity: 1 } : { x: VOCAB_X - OUT_X, y: rowY(from) - outY(k), opacity: 0 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                >
                  {cells(t, OUT_X, outY(k), EMBED)}
                </motion.g>
                <motion.text
                  x={OUT_X + EL.label - 10}
                  y={outY(k) + 14}
                  textAnchor="end"
                  className="fill-foreground font-mono text-[12px]"
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: on ? 1 : 0 }}
                  transition={{ delay: 0.25, duration: 0.2 }}
                >
                  {t}
                </motion.text>
              </g>
            )
          })}
        </g>
      </svg>
      {controls}
    </Figure>
  )
}

// step 3: X × W_Q = Q (and likewise K and V) as a real matrix multiply, one cell at a time: cell (k, c) of Q is row k of X
// dotted with column c of W_Q. X is step 2's green rows; the W matrices are made up, and Q, K and V are their real products
const D_Q = 4
const X_ROWS = TOKENS.map(embRow)
// a made-up d × d_k weight matrix, different for each seed, and X times it, with its range for shading
function project(seed: number) {
  const W: Vec[] = Array.from({ length: EMB_D }, (_, r) =>
    Array.from({ length: D_Q }, (_, c) => {
      const x = Math.sin((r * 7 + c * 3 + seed) * 12.9898) * 43758.5453
      return x - Math.floor(x) - 0.5
    }),
  )
  const rows = X_ROWS.map((x) => W[0].map((_, c) => x.reduce((s, v, r) => s + v * W[r][c], 0)))
  return { W, rows, lo: Math.min(...rows.flat()), hi: Math.max(...rows.flat()) }
}
const PROJECTIONS = {
  query: {
    ...project(1),
    color: QUERY,
    letter: "q",
    M: "Q",
    width: "d_k",
    plural: "queries",
  },
  key: {
    ...project(2),
    color: KEY,
    letter: "k",
    M: "K",
    width: "d_k",
    plural: "keys",
  },
  value: {
    ...project(3),
    color: VALUE,
    letter: "v",
    M: "V",
    width: "d_v",
    plural: "values",
  },
}
const SUB = ["₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉"]

const QP = { w: 640, top: 46, row: 20, cell: 18, label: 52 }
const PITCH = QP.cell + 2
const XP = 130 + QP.label // where X's cells start, so the whole figure sits centred
const WP = XP + EMB_D * PITCH + 40
const QC = WP + D_Q * PITCH + 62 // where Q's cells start, after its q labels
// seconds per cell of Q; after a row's D_Q cells, its finished q vector is held highlighted for ROW_HOLD more ticks
const CELL_STEP = 0.12
const ROW_HOLD = 4
const ROW_TICKS = D_Q + ROW_HOLD
// where prev and next stop: before anything, each cell, each finished row, and the end
const PROJ_STOPS = Array.from({ length: TOKENS.length * ROW_TICKS + 1 }, (_, t) => t).filter(
  (t) => t === 0 || t === TOKENS.length * ROW_TICKS || (t - 1) % ROW_TICKS <= D_Q,
)
const QP_H = QP.top + TOKENS.length * QP.row + 58
const W_TOP = QP.top + ((TOKENS.length - EMB_D) * QP.row) / 2

function Projection({ kind }: { kind: keyof typeof PROJECTIONS }) {
  const p = PROJECTIONS[kind]
  const ref = useRef<SVGSVGElement>(null)
  const { cycle, shown, reduce, controls } = useStepLoop(ref, TOKENS.length * ROW_TICKS, CELL_STEP, PROJ_STOPS)
  // the cell being computed right now, if any: its row in X and Q, and its column in W_Q and Q
  // c is null once all of row k is done, while its q vector is held highlighted
  const tick = shown - 1
  const active =
    !reduce && shown >= 1 && shown <= TOKENS.length * ROW_TICKS
      ? { k: Math.floor(tick / ROW_TICKS), c: tick % ROW_TICKS < D_Q ? tick % ROW_TICKS : null }
      : null
  const done = (k: number, c: number) => reduce || k * ROW_TICKS + c < shown
  const header = "fill-muted-foreground font-mono text-[11px]"
  const rowY = (k: number) => QP.top + k * QP.row
  const block = (values: number[], x: number, y: number, color: string) =>
    values.map((v, c) => (
      <rect key={c} x={x + c * PITCH} y={y + 1} width={QP.cell} height={QP.row - 2} rx={3} fill={color} fillOpacity={0.1 + v * 0.75} />
    ))
  const centre = (x: number, n: number) => x + (n * PITCH - 2) / 2
  const bottom = rowY(TOKENS.length) + 18
  const colX = (c: number) => c * PITCH
  // the highlights glide from cell to cell with a CSS transition, so they keep pace with each tick
  const at = (x: number, y: number, extra: CSSProperties = {}) => ({
    transform: `translate(${x}px, ${y}px)`,
    transition: "transform 120ms ease-out, width 120ms ease-out, opacity 120ms",
    ...extra,
  })

  return (
    <Figure>
      <svg ref={ref} viewBox={`0 0 ${QP.w} ${QP_H}`} className="w-full select-none">
        <text x={centre(XP, EMB_D)} y={QP.top - 10} textAnchor="middle" className={header}>
          embeddings <tspan fill={EMBED}>X</tspan>
        </text>
        <text x={centre(WP, D_Q)} y={W_TOP - 10} textAnchor="middle" className={header}>
          learned W
          <tspan baselineShift="sub" className="text-[9px]" fill={p.color}>
            {p.M}
          </tspan>
        </text>
        <text x={centre(QC, D_Q)} y={QP.top - 10} textAnchor="middle" className={header}>
          {p.plural} <tspan fill={p.color}>{p.M}</tspan>
        </text>
        <text x={centre(XP, EMB_D)} y={bottom} textAnchor="middle" className={header}>
          {TOKENS.length} × d
        </text>
        <text x={centre(WP, D_Q)} y={W_TOP + EMB_D * QP.row + 18} textAnchor="middle" className={header}>
          d × {p.width}
        </text>
        <text x={centre(QC, D_Q)} y={bottom} textAnchor="middle" className={header}>
          {TOKENS.length} × {p.width}
        </text>

        {/* the three matrices stay put; only the highlights move and Q's cells fill in */}
        {TOKENS.map((t, k) => (
          <g key={k}>
            <text x={XP - 10} y={rowY(k) + 14} textAnchor="end" className="fill-muted-foreground font-mono text-[12px]">
              {t}
            </text>
            {block(X_ROWS[k], XP, rowY(k), EMBED)}
          </g>
        ))}
        <text x={WP - 20} y={QP.top + (TOKENS.length * QP.row) / 2 + 5} textAnchor="middle" className="fill-muted-foreground font-mono text-[16px]">
          ×
        </text>
        {p.W.map((r, i) => (
          <g key={i}>{block(r.map((v) => v + 0.5), WP, W_TOP + i * QP.row, "var(--foreground)")}</g>
        ))}
        <text x={WP + D_Q * PITCH + 14} y={QP.top + (TOKENS.length * QP.row) / 2 + 5} textAnchor="middle" className="fill-muted-foreground font-mono text-[16px]">
          =
        </text>

        <g key={cycle}>
          {TOKENS.map((_, k) => (
            <g key={k}>
              {p.rows[k].map((v, c) => (
                <motion.rect
                  key={c}
                  x={QC + colX(c)}
                  y={rowY(k) + 1}
                  width={QP.cell}
                  height={QP.row - 2}
                  rx={3}
                  fill={p.color}
                  fillOpacity={0.1 + ((v - p.lo) / (p.hi - p.lo)) * 0.75}
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: done(k, c) ? 1 : 0 }}
                  transition={{ duration: 0.15 }}
                />
              ))}
              <motion.text
                x={QC - 10}
                y={rowY(k) + 14}
                textAnchor="end"
                fill={p.color}
                className="font-mono text-[12px]"
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: done(k, 0) ? 1 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {p.letter}{SUB[k]}
              </motion.text>
            </g>
          ))}

          {/* row k of X, column c of W_Q, and the cell of Q they make; once the row is done, the outline widens to
              the whole q vector and the column steps aside */}
          {!reduce && (
            <g className="pointer-events-none" opacity={active ? 1 : 0}>
              <rect
                width={EMB_D * PITCH + 2}
                height={QP.row + 2}
                rx={5}
                fill="none"
                stroke={EMBED}
                strokeWidth={1.5}
                style={at(XP - 3, rowY(active?.k ?? 0) - 2)}
              />
              <rect
                width={QP.cell + 4}
                height={EMB_D * QP.row + 2}
                rx={5}
                fill="none"
                className="stroke-foreground"
                strokeWidth={1.5}
                style={at(WP + colX(active?.c ?? D_Q - 1) - 2, W_TOP - 2, { opacity: active?.c == null ? 0 : 1 })}
              />
              <rect
                height={QP.row + 2}
                rx={5}
                fill={active?.c == null ? p.color : "none"}
                fillOpacity={0.15}
                stroke={p.color}
                strokeWidth={active?.c == null ? 2 : 1.5}
                style={
                  active?.c == null
                    ? at(QC - 2, rowY(active?.k ?? 0) - 2, { width: D_Q * PITCH + 2 })
                    : at(QC + colX(active.c) - 2, rowY(active.k) - 2, { width: QP.cell + 4 })
                }
              />
            </g>
          )}
        </g>

        <text x={QP.w / 2} y={QP_H - 8} textAnchor="middle" className="fill-muted-foreground font-mono text-[12px]">
          {active && active.c != null ? (
            <>
              <tspan fill={p.color}>
                {p.letter}{SUB[active.k]}[{active.c + 1}]
              </tspan>{" "}
              = <tspan fill={EMBED}>x{SUB[active.k]}</tspan> · column {active.c + 1} of W
              <tspan baselineShift="sub" className="text-[9px]" fill={p.color}>
                {p.M}
              </tspan>{" "}
              = <tspan className="fill-foreground">{p.rows[active.k][active.c].toFixed(2)}</tspan> ({TOKENS[active.k]})
            </>
          ) : active ? (
            <>
              <tspan fill={p.color}>{p.letter}{SUB[active.k]}</tspan> = ({p.rows[active.k].map((v) => v.toFixed(2)).join(", ")}), the{" "}
              <tspan fill={p.color}>{kind}</tspan> for <tspan className="fill-foreground">{TOKENS[active.k]}</tspan>
            </>
          ) : (
            <>
              each cell of <tspan fill={p.color}>{p.M}</tspan> = a row of <tspan fill={EMBED}>X</tspan> · a column of W
              <tspan baselineShift="sub" className="text-[9px]" fill={p.color}>
                {p.M}
              </tspan>
            </>
          )}
        </text>
      </svg>
      {controls}
    </Figure>
  )
}

// step 4 with four of the sentence's words: each column holds a word's q, k and v. Each word's query is scored against
// every word's key in turn (the √d_k scaling comes later), worked as a dot product on a bench in the middle: q and k
// copy down and turn upright, their entries multiply row by row, the products add up, and the sum drops into that
// pair's cell of the scores grid. Row i of the grid is word i's scores, one cell per key, under that key's word
const SG_WORDS = ["I", "went", "bank", "money"].map((t) => TOKENS.indexOf(t))
// four columns of SG.col, centred in the figure
const SG = { w: 640, col: 130, left: (640 - 4 * 130) / 2, cell: 16, pitch: 18, row: 22, top: 44, cellW: 64 }
const SG_ROWS = [
  { name: "q", vecs: Q, color: QUERY, shade: (v: number) => v / GAIN },
  { name: "k", vecs: K, color: KEY, shade: (v: number) => v / GAIN },
  // v is step 3's value row, the same width as q and k
  {
    name: "v",
    vecs: PROJECTIONS.value.rows,
    color: VALUE,
    shade: (v: number) => (v - PROJECTIONS.value.lo) / (PROJECTIONS.value.hi - PROJECTIONS.value.lo),
  },
]
const SM_SCORES = SG_WORDS.map((i) => SG_WORDS.map((j) => dot(Q[i], K[j])))
const SM_TOP = Math.max(...SM_SCORES.flat())

// the bench: upright q, ×, upright k, =, the products, and their sum
// laid out from the figure's centre: q × k = products sits centred, the sum hangs off to the right
const BENCH_W = 44 // a bench cell's width
const BENCH_X = 640 / 2 - (3 * BENCH_W + 2 * 36) / 2 // where q starts, so q, k and the products straddle the centre
const BENCH = {
  top: 232,
  row: 26,
  cellW: BENCH_W,
  cellH: 22,
  q: BENCH_X,
  times: BENCH_X + BENCH_W + 18,
  k: BENCH_X + BENCH_W + 36,
  eq: BENCH_X + 2 * BENCH_W + 54,
  prod: BENCH_X + 2 * BENCH_W + 72,
  sum: BENCH_X + 3 * BENCH_W + 96,
}
const SG_GRID_Y = BENCH.top + D_K * BENCH.row + 100
const SG_GRID_ROW = 30
const SG_H = SG_GRID_Y + SG_WORDS.length * SG_GRID_ROW + 34
// one tick each, per pair (i, j). A phase is 0 turn upright, 1..D_K multiply entry by entry, D_K + 1 add up, D_K + 2
// place the score. The first query is worked through in full; after that each pair takes two ticks, every product at
// once, then the sum placed, so the whole grid fills without dragging
const SG_TICKS = SG_WORDS.flatMap((_, i) =>
  SG_WORDS.flatMap((_, j) =>
    (i === 0 ? Array.from({ length: D_K + 3 }, (_, ph) => ph) : [D_K, D_K + 2]).map((phase) => ({ i, j, phase, quick: i > 0 })),
  ),
)
// how many ticks are shown once pair (i, j)'s score is in its cell
const SG_PLACED = SM_SCORES.map((row, i) => row.map((_, j) => SG_TICKS.findIndex((t) => t.i === i && t.j === j && t.phase === D_K + 2) + 1))
const SG_STEP = 0.8

const sgCx = (c: number) => SG.left + (c + 0.5) * SG.col
// a vector's cells, centred under its word, with its name (q₁ and so on) just to the left
const sgVecX = (c: number, n: number) => sgCx(c) - (n * SG.pitch - 2) / 2
const sgVecY = (r: number) => SG.top + 14 + r * SG.row

// the four words along the top, each with its q, k and v
function SgWords() {
  return SG_WORDS.map((t, c) => (
    <g key={c}>
      <text x={sgCx(c)} y={SG.top} textAnchor="middle" className="fill-foreground font-mono text-[13px]">
        {TOKENS[t]}
      </text>
      {SG_ROWS.map((r, ri) => (
        <g key={r.name}>
          <text x={sgVecX(c, r.vecs[t].length) - 8} y={sgVecY(ri) + 12} textAnchor="end" fill={r.color} className="font-mono text-[12px]">
            {r.name}
            {SUB[c]}
          </text>
          {r.vecs[t].map((v, kk) => (
            <rect
              key={kk}
              x={sgVecX(c, r.vecs[t].length) + kk * SG.pitch}
              y={sgVecY(ri)}
              width={SG.cell}
              height={SG.cell}
              rx={3}
              fill={r.color}
              fillOpacity={0.1 + Math.max(0, Math.min(1, r.shade(v))) * 0.8}
            />
          ))}
        </g>
      ))}
    </g>
  ))
}

// end of step 3, still: each word with its q, k and v, as the top of the step 4 figure shows them
function QkvStack() {
  return (
    <Figure>
      <svg viewBox={`0 0 ${SG.w} ${sgVecY(SG_ROWS.length - 1) + SG.cell + 8}`} className="w-full select-none">
        <SgWords />
      </svg>
    </Figure>
  )
}

function ScoreGrid() {
  const ref = useRef<SVGSVGElement>(null)
  const { cycle, shown, reduce, controls } = useStepLoop(ref, SG_TICKS.length, SG_STEP)
  // the pair being scored, and how far along (see SG_TICKS)
  const active = !reduce && shown >= 1 && shown <= SG_TICKS.length ? SG_TICKS[shown - 1] : null
  const placed = (i: number, j: number) => reduce || shown >= SG_PLACED[i][j]

  const cx = sgCx
  const vecX = sgVecX
  const vecY = sgVecY
  const benchY = (c: number) => BENCH.top + c * BENCH.row
  const gridY = (r: number) => SG_GRID_Y + r * SG_GRID_ROW
  const word = (c: number) => TOKENS[SG_WORDS[c]]
  const num = (v: number) => (Math.abs(v) < 0.005 ? "0" : v.toFixed(1))
  const at = (x: number, y: number, extra: CSSProperties = {}) => ({
    transform: `translate(${x}px, ${y}px)`,
    transition: "transform 150ms ease-out, opacity 150ms",
    ...extra,
  })

  const i = active?.i ?? 0
  const q = Q[SG_WORDS[i]]
  const j = active?.j ?? 0
  const k = K[SG_WORDS[j]]
  const products = q.map((v, c) => v * k[c])
  const phase = active?.phase ?? -1

  // one entry of an upright vector on the bench. It starts on top of its cell in the word's row above, at that
  // size, and slides down and turns into place
  const benchCell = (v: number, c: number, x: number, color: string, from: { col: number; row: number }) => {
    const sx = vecX(from.col, D_K) + c * SG.pitch + SG.cell / 2
    const sy = vecY(from.row) + SG.cell / 2
    const bx = x + BENCH.cellW / 2
    const by = benchY(c) + BENCH.cellH / 2
    return (
      <motion.g
        key={c}
        initial={{ x: sx - bx, y: sy - by, scale: SG.cell / BENCH.cellW, opacity: 0.5 }}
        animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, delay: c * 0.06, ease: [0.16, 1, 0.3, 1] }}
      >
        <rect x={x} y={benchY(c)} width={BENCH.cellW} height={BENCH.cellH} rx={4} fill={color} fillOpacity={0.15 + (v / GAIN) * 0.6} />
        <text x={bx} y={by + 4} textAnchor="middle" className="fill-foreground font-mono text-[11px]">
          {num(v)}
        </text>
      </motion.g>
    )
  }

  return (
    <Figure>
      <svg ref={ref} viewBox={`0 0 ${SG.w} ${SG_H}`} className="w-full select-none">
        <SgWords />

        {/* which q and k are on the bench */}
        {active && (
          <g className="pointer-events-none">
            <rect
              width={D_K * SG.pitch + 4}
              height={SG.cell + 4}
              rx={5}
              fill="none"
              stroke={QUERY}
              strokeWidth={1.5}
              style={at(vecX(i, D_K) - 3, vecY(0) - 2)}
            />
            <rect
              width={D_K * SG.pitch + 4}
              height={SG.cell + 4}
              rx={5}
              fill="none"
              stroke={KEY}
              strokeWidth={1.5}
              style={at(vecX(j, D_K) - 3, vecY(1) - 2)}
            />
          </g>
        )}

        {/* the bench. Each q comes down once and stays while it's scored against every key; the rest is rebuilt for each
            key, so its k drops in fresh */}
        {active && (
          <g key={`q-${cycle}-${i}`}>
            <text
              x={SG.w / 2}
              y={BENCH.top - 34}
              textAnchor="middle"
              className="fill-foreground font-mono text-[12px]"
            >
              dot_product(<tspan fill={QUERY}>q{SUB[i]}</tspan>, <tspan fill={KEY}>k{SUB[j]}</tspan>)
            </text>
            <text x={BENCH.q + BENCH.cellW / 2} y={BENCH.top - 10} textAnchor="middle" fill={QUERY} className="font-mono text-[12px]">
              q{SUB[i]}
            </text>
            {q.map((v, c) => benchCell(v, c, BENCH.q, QUERY, { col: i, row: 0 }))}
          </g>
        )}
        {active && (
          <g key={`k-${cycle}-${i}-${j}`}>
            <text x={BENCH.k + BENCH.cellW / 2} y={BENCH.top - 10} textAnchor="middle" fill={KEY} className="font-mono text-[12px]">
              k{SUB[j]}
            </text>
            <text x={BENCH.prod + BENCH.cellW / 2} y={BENCH.top - 10} textAnchor="middle" className="fill-muted-foreground font-mono text-[11px]">
              products
            </text>
            {k.map((v, c) => benchCell(v, c, BENCH.k, KEY, { col: j, row: 1 }))}
            {products.map((v, c) => (
              <g key={c}>
                <text x={BENCH.times} y={benchY(c) + 15} textAnchor="middle" className="fill-muted-foreground font-mono text-[12px]">
                  ×
                </text>
                <text x={BENCH.eq} y={benchY(c) + 15} textAnchor="middle" className="fill-muted-foreground font-mono text-[12px]">
                  =
                </text>
                {phase > c && (
                  <motion.g initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }}>
                    <rect
                      x={BENCH.prod}
                      y={benchY(c)}
                      width={BENCH.cellW}
                      height={BENCH.cellH}
                      rx={4}
                      fill={WEIGHT}
                      fillOpacity={0.12 + (v / SM_TOP) * 0.6}
                    />
                    <text x={BENCH.prod + BENCH.cellW / 2} y={benchY(c) + 15} textAnchor="middle" className="fill-foreground font-mono text-[11px]">
                      {num(v)}
                    </text>
                  </motion.g>
                )}
              </g>
            ))}
            {/* the row being multiplied */}
            {!active.quick && phase >= 1 && phase <= D_K && (
              <rect
                width={BENCH.prod + BENCH.cellW - BENCH.q + 8}
                height={BENCH.cellH + 6}
                rx={6}
                fill="none"
                className="stroke-foreground"
                strokeWidth={1.25}
                style={at(BENCH.q - 4, benchY(phase - 1) - 3)}
              />
            )}
            {/* add the products up */}
            {phase > D_K && (
              <motion.g initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                <path
                  d={`M${BENCH.prod + BENCH.cellW + 8},${benchY(0)} q8,0 8,8 V${benchY(D_K - 1) + BENCH.cellH - 8} q0,8 -8,8`}
                  fill="none"
                  className="stroke-muted-foreground"
                  strokeWidth={1.25}
                />
                <text x={BENCH.sum} y={benchY(0) + (D_K * BENCH.row) / 2 + 2} className="fill-muted-foreground font-mono text-[13px]">
                  add up = <tspan fill={WEIGHT}>{num(SM_SCORES[i][j])}</tspan>
                </text>
              </motion.g>
            )}
          </g>
        )}

        {/* the scores grid: a row per query, a column per key */}
        {SG_WORDS.map((_, jj) => (
          <text key={jj} x={cx(jj)} y={SG_GRID_Y - 10} textAnchor="middle" fill={KEY} className="font-mono text-[11px]">
            k{SUB[jj]}
          </text>
        ))}
        {SG_WORDS.map((_, ii) => (
          <g key={ii}>
            <text x={cx(0) - SG.cellW / 2 - 10} y={gridY(ii) + 17} textAnchor="end" fill={WEIGHT} className="font-mono text-[12px]">
              scores
              <tspan baselineShift="sub" className="text-[10px]">
                {word(ii)}
              </tspan>
            </text>
            {SG_WORDS.map((_, jj) => (
              <rect
                key={jj}
                x={cx(jj) - SG.cellW / 2}
                y={gridY(ii)}
                width={SG.cellW}
                height={24}
                rx={5}
                fill="none"
                className="stroke-foreground/15"
                strokeDasharray="3 4"
              />
            ))}
          </g>
        ))}
        <g key={`scores-${cycle}`}>
          {SM_SCORES.map((row, ii) =>
            row.map((score, jj) => {
              // each score drops from the bench's sum into its cell
              const from = { x: BENCH.sum + 50 - cx(jj), y: benchY(0) + (D_K * BENCH.row) / 2 - gridY(ii) - 10, opacity: 0 }
              return (
                <motion.g
                  key={`${ii}-${jj}`}
                  initial={reduce ? false : from}
                  animate={placed(ii, jj) ? { x: 0, y: 0, opacity: 1 } : from}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <rect
                    x={cx(jj) - SG.cellW / 2}
                    y={gridY(ii)}
                    width={SG.cellW}
                    height={24}
                    rx={5}
                    fill={WEIGHT}
                    fillOpacity={0.08 + (score / SM_TOP) * 0.7}
                  />
                  <text
                    x={cx(jj)}
                    y={gridY(ii) + 16}
                    textAnchor="middle"
                    className={cn("font-mono text-[12px]", score / SM_TOP > 0.6 ? "fill-background" : "fill-foreground")}
                  >
                    {score.toFixed(2)}
                  </text>
                </motion.g>
              )
            }),
          )}
        </g>
        {/* the cell being filled */}
        {active && (
          <rect
            width={SG.cellW + 6}
            height={30}
            rx={7}
            fill="none"
            className="pointer-events-none stroke-foreground"
            strokeWidth={1.25}
            style={at(cx(j) - SG.cellW / 2 - 3, gridY(i) - 3)}
          />
        )}

        <text x={SG.w / 2} y={SG_H - 10} textAnchor="middle" className="fill-muted-foreground font-mono text-[12px]">
          {!active ? (
            <>
              <tspan fill={WEIGHT}>score</tspan> = <tspan fill={QUERY}>q</tspan> · <tspan fill={KEY}>k</tspan>: multiply matching
              entries, then add them up
            </>
          ) : phase === 0 ? (
            <>
              stand <tspan fill={QUERY}>q{SUB[i]}</tspan> and <tspan fill={KEY}>k{SUB[j]}</tspan> upright, side by side
            </>
          ) : phase === D_K && active.quick ? (
            <>
              multiply <tspan fill={QUERY}>q{SUB[i]}</tspan> and <tspan fill={KEY}>k{SUB[j]}</tspan> entry by entry:{" "}
              {products.map(num).join(", ")}
            </>
          ) : phase <= D_K ? (
            <>
              entry {phase}: <tspan fill={QUERY}>{num(q[phase - 1])}</tspan> × <tspan fill={KEY}>{num(k[phase - 1])}</tspan> ={" "}
              <tspan className="fill-foreground">{num(products[phase - 1])}</tspan>
            </>
          ) : phase === D_K + 1 ? (
            <>
              add up: {products.map(num).join(" + ")} = <tspan fill={WEIGHT}>{num(SM_SCORES[i][j])}</tspan>
            </>
          ) : (
            <>
              <tspan fill={WEIGHT}>score</tspan>({word(i)} → {word(j)}) = <tspan fill={WEIGHT}>{SM_SCORES[i][j].toFixed(2)}</tspan>
            </>
          )}
        </text>
      </svg>
      {controls}
    </Figure>
  )
}

// step 5, top to bottom: the scores from step 4, divided by √d_k (d_k = 4 here, so √d_k = 2), then softmaxed so each
// row adds up to 1. One row moves down per tick: every row into the scaled grid first, then every row into the softmax grid
const SQRT_DK = Math.sqrt(D_K)
const SC = { w: 640, row: 28, cellW: 46, cellH: 22, pitch: 50 }
const SC_GRID_W = (SG_WORDS.length - 1) * SC.pitch + SC.cellW
const SC_X = (SC.w - SC_GRID_W) / 2
const SC_GRID_H = SG_WORDS.length * SC.row - (SC.row - SC.cellH)
// the three grids' tops, with an arrow down between each pair
const SC_ARROW = 56
const SC_TOPS = [52, 52 + SC_GRID_H + SC_ARROW, 52 + 2 * (SC_GRID_H + SC_ARROW)]
const SC_H = SC_TOPS[2] + SC_GRID_H + 48
const SF_SCALED = SM_SCORES.map((row) => row.map((v) => v / SQRT_DK))
const SF_WEIGHTS = SF_SCALED.map(softmax)
const SC_STEP = 0.8

function ScaleAndSoftmax() {
  const ref = useRef<SVGSVGElement>(null)
  const n = SG_WORDS.length
  const { cycle, shown, reduce, controls } = useStepLoop(ref, 2 * n, SC_STEP)
  const tick = shown - 1
  // which row, and which pass: 0 divides it by √d_k, 1 softmaxes it
  const active = !reduce && shown >= 1 && shown <= 2 * n ? { r: tick % n, phase: Math.floor(tick / n) } : null
  // how far a row has come down: 1 is scaled, 2 is softmaxed too
  const reached = (r: number) => (reduce ? 2 : (shown > r ? 1 : 0) + (shown > n + r ? 1 : 0))

  const cellX = (c: number) => SC_X + c * SC.pitch
  const rowY = (g: number, r: number) => SC_TOPS[g] + r * SC.row
  const word = (r: number) => TOKENS[SG_WORDS[r]]
  const r = active?.r ?? 0
  const sqrtDk = (
    <>
      √d<tspan baselineShift="sub" className="text-[9px]">
        k
      </tspan>
    </>
  )

  // grid g's numbers for row r, and how strongly each cell is shaded (0 to 1)
  const values = (g: number, rr: number) => (g === 0 ? SM_SCORES[rr] : g === 1 ? SF_SCALED[rr] : SF_WEIGHTS[rr])
  const shade = (g: number, v: number) => (g === 2 ? v : v / SM_TOP)
  const cells = (g: number, rr: number) =>
    values(g, rr).map((v, c) => (
      <g key={c}>
        <rect x={cellX(c)} y={rowY(g, rr)} width={SC.cellW} height={SC.cellH} rx={4} fill={WEIGHT} fillOpacity={0.08 + shade(g, v) * 0.7} />
        <text
          x={cellX(c) + SC.cellW / 2}
          y={rowY(g, rr) + 15}
          textAnchor="middle"
          className={cn("font-mono text-[11px]", shade(g, v) > 0.6 ? "fill-background" : "fill-foreground")}
        >
          {v.toFixed(2)}
        </text>
      </g>
    ))
  const GRIDS = [
    { label: "scores", title: <>scores = <tspan fill={QUERY}>q</tspan> · <tspan fill={KEY}>k</tspan></> },
    { label: "scaled", title: <>scaled scores</> },
    { label: "softmax", title: <>softmax</> },
  ]

  return (
    <Figure>
      <svg ref={ref} viewBox={`0 0 ${SC.w} ${SC_H}`} className="w-full select-none">
        {SG_WORDS.map((_, c) => (
          <text key={c} x={cellX(c) + SC.cellW / 2} y={SC_TOPS[0] - 10} textAnchor="middle" className="fill-muted-foreground font-mono text-[11px]">
            {word(c)}
          </text>
        ))}

        {GRIDS.map((grid, g) => (
          <g key={g}>
            {/* the grid's name to its right, its rows' names to its left */}
            <text x={SC_X + SC_GRID_W + 16} y={SC_TOPS[g] + SC_GRID_H / 2 + 4} fill={WEIGHT} className="font-mono text-[12px]">
              {grid.title}
            </text>
            {SG_WORDS.map((_, rr) => (
              <g key={rr}>
                <text x={SC_X - 10} y={rowY(g, rr) + 15} textAnchor="end" fill={WEIGHT} className="font-mono text-[12px]">
                  {grid.label}
                  <tspan baselineShift="sub" className="text-[10px]">
                    {word(rr)}
                  </tspan>
                </text>
                {g > 0 &&
                  SG_WORDS.map((_, c) => (
                    <rect
                      key={c}
                      x={cellX(c)}
                      y={rowY(g, rr)}
                      width={SC.cellW}
                      height={SC.cellH}
                      rx={4}
                      fill="none"
                      className="stroke-foreground/15"
                      strokeDasharray="3 4"
                    />
                  ))}
              </g>
            ))}
            {/* the arrow down into the next grid, and what it does */}
            {g < 2 && (
              <g>
                <path
                  d={`M${SC.w / 2},${SC_TOPS[g] + SC_GRID_H + 10} V${SC_TOPS[g + 1] - 12} m-4,-5 l4,5 l4,-5`}
                  fill="none"
                  className="stroke-muted-foreground"
                  strokeWidth={1.25}
                />
                <text x={SC.w / 2 + 14} y={SC_TOPS[g] + SC_GRID_H + SC_ARROW / 2 + 4} className="fill-foreground font-mono text-[13px]">
                  {g === 0 ? <>÷ {sqrtDk}</> : "softmax"}
                </text>
              </g>
            )}
          </g>
        ))}

        {/* the scores stay put; each row drops into the scaled grid, then into the softmax grid */}
        {SM_SCORES.map((_, rr) => (
          <g key={rr}>{cells(0, rr)}</g>
        ))}
        <g key={`rows-${cycle}`}>
          {SM_SCORES.map((_, rr) =>
            [1, 2].map((g) =>
              reached(rr) >= g ? (
                <motion.g
                  key={`${rr}-${g}`}
                  initial={reduce ? false : { y: rowY(g - 1, rr) - rowY(g, rr), opacity: 0.4 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                >
                  {cells(g, rr)}
                </motion.g>
              ) : null,
            ),
          )}
        </g>

        {/* the row on the move: where it comes from and where it lands */}
        {active &&
          [active.phase, active.phase + 1].map((g) => (
            <rect
              key={g}
              width={SC_GRID_W + 8}
              height={SC.cellH + 6}
              rx={6}
              fill="none"
              stroke={WEIGHT}
              strokeWidth={1.5}
              className="pointer-events-none"
              style={{ transform: `translate(${SC_X - 4}px, ${rowY(g, r) - 3}px)`, transition: "transform 150ms ease-out" }}
            />
          ))}

        <text x={SC.w / 2} y={SC_H - 10} textAnchor="middle" className="fill-muted-foreground font-mono text-[12px]">
          {!active ? (
            <>
              divide every <tspan fill={WEIGHT}>score</tspan> by {sqrtDk}, then softmax each row so it adds up to 1
            </>
          ) : active.phase === 0 ? (
            <>
              <tspan fill={WEIGHT}>scores</tspan>
              <tspan baselineShift="sub" className="text-[10px]" fill={WEIGHT}>
                {word(r)}
              </tspan>{" "}
              ÷ {sqrtDk} = (<tspan fill={WEIGHT}>{SF_SCALED[r].map((v) => v.toFixed(2)).join(", ")}</tspan>)
            </>
          ) : (
            <>
              softmax → (<tspan fill={WEIGHT}>{SF_WEIGHTS[r].map((w) => w.toFixed(2)).join(", ")}</tspan>), adds up to 1
            </>
          )}
        </text>
      </svg>
      {controls}
    </Figure>
  )
}

// each word's output: its row of softmax weights (the yellow grid from the step before, along the top, each column under
// its word) applied to every word's value. The row's weights drop down to the values, each v is scaled by its weight
// (faded, here), and the scaled copies drop down again and add up into that word's output. Two ticks per row
const WV_V = SG_WORDS.map((t) => PROJECTIONS.value.rows[t])
const WV_OUT = SF_WEIGHTS.map((w) => WV_V[0].map((_, d) => WV_V.reduce((sum, v, j) => sum + w[j] * v[d], 0)))
const wvShade = (v: number) => Math.max(0, Math.min(1, SG_ROWS[2].shade(v)))
const WV_ROW = 28
const WV_GRID_Y = SG.top + 14
const WV_V_Y = WV_GRID_Y + SG_WORDS.length * WV_ROW + 14
const WV = { weightY: WV_V_Y + 38, copyY: WV_V_Y + 48, outTop: WV_V_Y + 112, outRow: 26 }
const WV_OUT_W = D_K * SG.pitch - 2
const WV_OUT_X = SG.w / 2 - WV_OUT_W / 2
const WV_H = WV.outTop + SG_WORDS.length * WV.outRow + 34
const WV_STEP = 0.8

function WeightedValues() {
  const ref = useRef<SVGSVGElement>(null)
  const n = SG_WORDS.length
  const { cycle, shown, reduce, controls } = useStepLoop(ref, 2 * n, WV_STEP)
  const tick = shown - 1
  // which word's output is being built: phase 0 scales the values, phase 1 adds them up
  const active = !reduce && shown >= 1 && shown <= 2 * n ? { r: Math.floor(tick / 2), phase: tick % 2 } : null
  const placed = (r: number) => reduce || shown > 2 * r + 1

  const word = (c: number) => TOKENS[SG_WORDS[c]]
  const gridY = (r: number) => WV_GRID_Y + r * WV_ROW
  const wCellX = (c: number) => sgCx(c) - SC.cellW / 2
  const outY = (r: number) => WV.outTop + r * WV.outRow
  const r = active?.r ?? 0
  const w = SF_WEIGHTS[r]

  // a vector's cells, faded by `weight`: values in blue, outputs in pink
  const vec = (v: Vec, x: number, y: number, weight = 1, color = VALUE) =>
    v.map((x2, d) => (
      <rect
        key={d}
        x={x + d * SG.pitch}
        y={y}
        width={SG.cell}
        height={SG.cell}
        rx={3}
        fill={color}
        fillOpacity={(0.1 + wvShade(x2) * 0.8) * weight}
      />
    ))

  return (
    <Figure>
      <svg ref={ref} viewBox={`0 0 ${SG.w} ${WV_H}`} className="w-full select-none">
        {/* the words, their column of the weights grid, and their value underneath */}
        {SG_WORDS.map((t, c) => (
          <g key={c}>
            <text x={sgCx(c)} y={SG.top} textAnchor="middle" className="fill-foreground font-mono text-[13px]">
              {TOKENS[t]}
            </text>
            <text x={sgVecX(c, D_K) - 8} y={WV_V_Y + 12} textAnchor="end" fill={VALUE} className="font-mono text-[12px]">
              v{SUB[c]}
            </text>
            {vec(WV_V[c], sgVecX(c, D_K), WV_V_Y)}
          </g>
        ))}
        {SF_WEIGHTS.map((row, rr) => (
          <g key={rr}>
            <text x={wCellX(0) - 10} y={gridY(rr) + 15} textAnchor="end" fill={WEIGHT} className="font-mono text-[12px]">
              softmax
              <tspan baselineShift="sub" className="text-[10px]">
                {word(rr)}
              </tspan>
            </text>
            {row.map((x, c) => (
              <g key={c}>
                <rect x={wCellX(c)} y={gridY(rr)} width={SC.cellW} height={SC.cellH} rx={4} fill={WEIGHT} fillOpacity={0.08 + x * 0.7} />
                <text
                  x={sgCx(c)}
                  y={gridY(rr) + 15}
                  textAnchor="middle"
                  className={cn("font-mono text-[11px]", x > 0.6 ? "fill-background" : "fill-foreground")}
                >
                  {x.toFixed(2)}
                </text>
              </g>
            ))}
          </g>
        ))}

        {/* the outputs along the bottom */}
        <text x={SG.w / 2} y={WV.outTop - 14} textAnchor="middle" className="fill-muted-foreground font-mono text-[11px]">
          <tspan fill={SCORE}>output</tspan> = Σ <tspan fill={WEIGHT}>weight</tspan> × <tspan fill={VALUE}>v</tspan>
        </text>
        {SG_WORDS.map((_, rr) => (
          <g key={rr}>
            <text x={WV_OUT_X - 10} y={outY(rr) + 12} textAnchor="end" fill={SCORE} className="font-mono text-[12px]">
              output
              <tspan baselineShift="sub" className="text-[10px]">
                {word(rr)}
              </tspan>
            </text>
            {WV_V[0].map((_, d) => (
              <rect
                key={d}
                x={WV_OUT_X + d * SG.pitch}
                y={outY(rr)}
                width={SG.cell}
                height={SG.cell}
                rx={3}
                fill="none"
                className="stroke-foreground/15"
                strokeDasharray="3 4"
              />
            ))}
          </g>
        ))}
        <g key={`out-${cycle}`}>
          {SG_WORDS.map((_, rr) =>
            placed(rr) ? (
              <motion.g
                key={rr}
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.35 }}
              >
                {vec(WV_OUT[rr], WV_OUT_X, outY(rr), 1, SCORE)}
              </motion.g>
            ) : null,
          )}
        </g>

        {/* the active row's weights drop from the grid to under the values; each value is scaled by its weight */}
        {active && (
          <g key={`scale-${cycle}-${r}`}>
            {SG_WORDS.map((_, c) => (
              <g key={c}>
                <motion.g
                  initial={{ y: gridY(r) + 15 - WV.weightY, opacity: 0.4 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.45, delay: c * 0.05, ease: [0.16, 1, 0.3, 1] }}
                >
                  <text x={sgCx(c)} y={WV.weightY} textAnchor="middle" className="fill-muted-foreground font-mono text-[11px]">
                    × <tspan fill={WEIGHT}>{w[c].toFixed(2)}</tspan>
                  </text>
                </motion.g>
                {active.phase === 0 && (
                  <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.3 }}>
                    {vec(WV_V[c], sgVecX(c, D_K), WV.copyY, w[c])}
                  </motion.g>
                )}
                {c > 0 && (
                  <text x={sgCx(c) - SG.col / 2} y={WV.copyY + 12} textAnchor="middle" className="fill-muted-foreground font-mono text-[13px]">
                    +
                  </text>
                )}
              </g>
            ))}
            {/* the scaled copies drop into the output row and add up */}
            {active.phase === 1 &&
              SG_WORDS.map((_, c) => (
                <motion.g
                  key={`fly-${c}`}
                  initial={{ x: sgVecX(c, D_K) - WV_OUT_X, y: WV.copyY - outY(r), opacity: 1 }}
                  animate={{ x: 0, y: 0, opacity: 0 }}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                >
                  {vec(WV_V[c], WV_OUT_X, outY(r), w[c])}
                </motion.g>
              ))}
          </g>
        )}

        {/* the row of weights in use, and the output it builds */}
        {active && (
          <g className="pointer-events-none">
            <rect
              width={3 * SG.col + SC.cellW + 8}
              height={SC.cellH + 6}
              rx={6}
              fill="none"
              stroke={WEIGHT}
              strokeWidth={1.5}
              style={{ transform: `translate(${wCellX(0) - 4}px, ${gridY(r) - 3}px)`, transition: "transform 150ms ease-out" }}
            />
            <rect
              width={WV_OUT_W + 6}
              height={SG.cell + 6}
              rx={5}
              fill="none"
              stroke={SCORE}
              strokeWidth={1.5}
              style={{ transform: `translate(${WV_OUT_X - 3}px, ${outY(r) - 3}px)`, transition: "transform 150ms ease-out" }}
            />
          </g>
        )}

        <text x={SG.w / 2} y={WV_H - 10} textAnchor="middle" className="fill-muted-foreground font-mono text-[12px]">
          {!active ? (
            <>
              each word's <tspan fill={SCORE}>output</tspan>: every <tspan fill={VALUE}>value</tspan>, scaled by its <tspan fill={WEIGHT}>weight</tspan>, added up
            </>
          ) : (
            <>
              <tspan fill={SCORE}>output</tspan>
              <tspan baselineShift="sub" className="text-[10px]" fill={SCORE}>
                {word(r)}
              </tspan>{" "}
              ={" "}
              {w.map((x, c) => (
                <tspan key={c}>
                  {c > 0 && " + "}
                  <tspan fill={WEIGHT}>{x.toFixed(2)}</tspan>
                  <tspan fill={VALUE}>v{SUB[c]}</tspan>
                </tspan>
              ))}
            </>
          )}
        </text>
      </svg>
      {controls}
    </Figure>
  )
}

// step 1, the big picture, top to bottom: each word's embedding x goes into self-attention, where every word looks at
// every word, and comes out as z (step 6's outputs); a feed-forward network then works on each word's z on its own,
// giving r, which goes on into the next layer, which does the same again. One stage per tick
const LO = { word: 24, x: 38, attn: [76, 138], z: 162, ffn: [200, 246], r: 270, next: [308, 354], cell: 14, pitch: 16 }
const LO_H = 388
const LO_STAGES = 6
const LO_STEP = 1.1
// a made-up feed-forward network: a 4 × 4 weight matrix, then tanh
const LO_W = project(7).W.slice(0, D_K)
const LO_R = WV_OUT.map((z) => z.map((_, d) => Math.tanh(z.reduce((t, v, c) => t + v * LO_W[c][d] * 4, 0))))

function LayerOverview() {
  const ref = useRef<SVGSVGElement>(null)
  const { cycle, shown, reduce, controls } = useStepLoop(ref, LO_STAGES, LO_STEP)
  // the stage on show, 0 before the first; with reduced motion everything is there and nothing is lit
  const stage = reduce ? LO_STAGES : Math.min(shown, LO_STAGES)
  const lit = (s: number) => !reduce && shown === s
  const word = (c: number) => TOKENS[SG_WORDS[c]]
  const cx = sgCx
  const vec = (v: number[], c: number, y: number, color: string, shade: (v: number) => number) => {
    const w = v.length * LO.pitch - (LO.pitch - LO.cell)
    return v.map((val, d) => (
      <rect
        key={d}
        x={cx(c) - w / 2 + d * LO.pitch}
        y={y}
        width={LO.cell}
        height={LO.cell}
        rx={3}
        fill={color}
        fillOpacity={0.1 + Math.max(0, Math.min(1, shade(val))) * 0.8}
      />
    ))
  }
  // an arrow down each column, from y1 to y2, bright while its stage is on
  const arrows = (y1: number, y2: number, s: number) =>
    SG_WORDS.map((_, c) => (
      <path
        key={c}
        d={`M${cx(c)},${y1} V${y2} M${cx(c) - 4},${y2 - 5} L${cx(c)},${y2} L${cx(c) + 4},${y2 - 5}`}
        fill="none"
        strokeWidth={1.5}
        className={cn("transition-colors duration-300", lit(s) ? "stroke-foreground" : "stroke-muted-foreground/40")}
      />
    ))
  // a row of vectors that drops into place when its stage comes
  const rise = (s: number, y: number, label: string, color: string, values: number[][], shade: (v: number) => number) =>
    stage >= s && (
      <g key={`${label}-${cycle}`}>
        <text x={66} y={y + 11} textAnchor="end" fill={color} className="font-mono text-[12px]">
          {label}
        </text>
        {values.map((v, c) => (
          <motion.g
            key={c}
            initial={reduce ? false : { opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: c * 0.06, ease: [0.16, 1, 0.3, 1] }}
          >
            {vec(v, c, y, color, shade)}
          </motion.g>
        ))}
      </g>
    )
  const box = (s: number) => cn("transition-colors duration-300", lit(s) ? "stroke-foreground" : "stroke-foreground/25")
  const header = "fill-muted-foreground font-mono text-[11px]"

  return (
    <Figure>
      <svg ref={ref} viewBox={`0 0 ${SG.w} ${LO_H}`} className="w-full select-none">
        {SG_WORDS.map((_, c) => (
          <text key={c} x={cx(c)} y={LO.word} textAnchor="middle" className="fill-foreground font-mono text-[13px]">
            {word(c)}
          </text>
        ))}
        {rise(1, LO.x, "x", EMBED, SG_WORDS.map((_, c) => embRow(word(c))), (v) => v)}
        {arrows(LO.x + LO.cell + 4, LO.attn[0] - 3, 2)}

        {/* layer 1 */}
        <rect x={40} y={LO.attn[0] - 12} width={SG.w - 80} height={LO.ffn[1] + 14 - (LO.attn[0] - 12)} rx={12} fill="none" className="stroke-foreground/15" />
        {/* run up the outline's left edge, clear of the vectors */}
        <text
          x={30}
          y={(LO.attn[0] - 12 + LO.ffn[1] + 14) / 2}
          textAnchor="middle"
          transform={`rotate(-90 30 ${(LO.attn[0] - 12 + LO.ffn[1] + 14) / 2})`}
          className={header}
        >
          layer 1
        </text>
        <rect
          x={60}
          y={LO.attn[0]}
          width={SG.w - 120}
          height={LO.attn[1] - LO.attn[0]}
          rx={10}
          className={box(2)}
          fill={lit(2) ? "var(--muted)" : "none"}
        />
        {/* inside self-attention, every word looks at every word */}
        {stage >= 2 && (
          <g key={`mix-${cycle}`} className="pointer-events-none">
            {SG_WORDS.flatMap((_, i) =>
              SG_WORDS.map((_, j) => (
                <motion.path
                  key={`${i}-${j}`}
                  d={`M${cx(i)},${LO.attn[0] + 6} L${cx(j)},${LO.attn[1] - 6}`}
                  fill="none"
                  stroke={SCORE}
                  strokeWidth={1.25}
                  initial={reduce ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1, opacity: lit(2) ? 0.7 : 0.2 }}
                  transition={{ pathLength: { duration: 0.6, delay: i * 0.08 }, opacity: { duration: 0.3 } }}
                />
              )),
            )}
          </g>
        )}
        <text x={SG.w / 2} y={(LO.attn[0] + LO.attn[1]) / 2 + 4} textAnchor="middle" className="fill-foreground font-mono text-[12px]">
          {/* a halo in the card's colour keeps the label readable over the lines */}
          <tspan className="fill-foreground stroke-card" strokeWidth={6} paintOrder="stroke">
            self-attention
          </tspan>
        </text>
        {arrows(LO.attn[1] + 4, LO.z - 4, 3)}
        {rise(3, LO.z, "z", SCORE, WV_OUT, wvShade)}
        {arrows(LO.z + LO.cell + 4, LO.ffn[0] - 3, 4)}
        {SG_WORDS.map((_, c) => (
          <g key={c}>
            <rect
              x={cx(c) - 52}
              y={LO.ffn[0]}
              width={104}
              height={LO.ffn[1] - LO.ffn[0]}
              rx={8}
              className={box(4)}
              fill={lit(4) ? "var(--muted)" : "none"}
            />
            <text x={cx(c)} y={(LO.ffn[0] + LO.ffn[1]) / 2 + 4} textAnchor="middle" className="fill-foreground font-mono text-[11px]">
              feed forward
            </text>
          </g>
        ))}
        {arrows(LO.ffn[1] + 4, LO.r - 4, 5)}
        {rise(5, LO.r, "r", FFN_OUT, LO_R, (v) => (v + 1) / 2)}
        {arrows(LO.r + LO.cell + 4, LO.next[0] - 3, 6)}

        {/* layer 2, below: the same again */}
        <rect
          x={40}
          y={LO.next[0]}
          width={SG.w - 80}
          height={LO.next[1] - LO.next[0]}
          rx={10}
          fill="none"
          strokeDasharray="5 5"
          className={box(6)}
        />
        <text x={SG.w / 2} y={(LO.next[0] + LO.next[1]) / 2 + 4} textAnchor="middle" className={header}>
          layer 2: self-attention and feed forward again, and so on
        </text>

        <text x={SG.w / 2} y={LO_H - 8} textAnchor="middle" className="fill-muted-foreground font-mono text-[12px]">
          {stage === 1 ? (
            <>
              each word starts as its embedding <tspan fill={EMBED}>x</tspan>
            </>
          ) : stage === 2 ? (
            <>self-attention: every word looks at every word</>
          ) : stage === 3 ? (
            <>
              out comes <tspan fill={SCORE}>z</tspan>: each word's <tspan fill={EMBED}>x</tspan>, mixed with the words it attends to
            </>
          ) : stage === 4 ? (
            <>
              a feed-forward network then works on each word's <tspan fill={SCORE}>z</tspan> on its own
            </>
          ) : stage === 5 ? (
            <>
              out comes <tspan fill={FFN_OUT}>r</tspan> for each word
            </>
          ) : stage === 6 ? (
            <>
              <tspan fill={FFN_OUT}>r</tspan> goes on into the next layer, which does the same again
            </>
          ) : (
            <>one transformer layer, from the top down</>
          )}
        </text>
      </svg>
      {controls}
    </Figure>
  )
}

// the sentence across the middle, with an arc from the chosen word to every word: the thicker and brighter the arc, the
// more weight that word gets. Underneath, one column per word, the calculation behind those weights: the chosen word's
// query against every key, divided by √d_k, softmaxed, and every value scaled by its probability and added up into the
// chosen word's output. The dot products go one key per tick, over two rows marked q · k: entry by entry, a square of q
// (which stays put) and the matching square of that word's k fly together into their product in the × row, then the
// products drop one by one into the + row's single square, which brightens by each, and the total becomes the score. Then
// each later row takes a tick, and the output one. Clicking a word makes it the query and plays it again
const EX = { w: 640, left: 96, base: 168, top: 220, row: 32, cell: 11, pitch: 13, numW: 44, numH: 22 }
const EX_COL = (EX.w - EX.left) / TOKENS.length
const EX_V = PROJECTIONS.value.rows
// the rows under the words, top to bottom, and the tick each starts on (0: there from the start). The products and
// scores fill one key per tick, over the first EX_N ticks
const EX_ROWS = ["q", "k", "×", "+", "score", "÷ √d_k", "softmax", "v", "softmax × v", "output"] as const
const EX_N = TOKENS.length
const EX_AT = [0, 0, 1, 1, 1, EX_N + 1, EX_N + 2, 0, EX_N + 3, 0]
// softmax × v gets two ticks (EX_N + 3 and EX_N + 4), so the row can be highlighted before the multiplying starts
const EX_TICKS = EX_N + 5
// within a key's tick, in seconds: entry c's pair sets off at c × EX_GAP and takes EX_FLY to meet in its product; then
// product c sets off at EX_ADD + c × EX_GAP and takes EX_FLY to land in the sum; the score lands at EX_SCORE
const EX_GAP = 0.13
const EX_FLY = 0.3
const EX_ADD = (D_K - 1) * EX_GAP + EX_FLY + 0.08
const EX_SCORE = EX_ADD + (D_K - 1) * EX_GAP + EX_FLY + 0.05
const EX_H = EX.top + EX_ROWS.length * EX.row + 34
// every word's attention output, shown along the bottom whichever word is the query
const EX_OUTS = Q.map((q) => {
  const w = softmax(K.map((k) => dot(q, k) / Math.sqrt(D_K)))
  return EX_V[0].map((_, d) => EX_V.reduce((sum, v, j) => sum + w[j] * v[d], 0))
})
const EX_STEP = 1.6
// the last tick: each word's scaled v sets off EX_SUM_GAP after the one before and takes EX_SUM_FLY to reach the output
// the softmax × v tick, word by word, each EX_MUL_GAP after the one before: its probability drops onto its v (taking
// EX_MUL_FLY), then the v, now scaled by it, drops into the softmax × v row (taking EX_MUL_FLY again)
const EX_MUL_GAP = 0.1
const EX_MUL_FLY = 0.35
// how long the softmax × v row is highlighted on its own before the multiplying starts
const EX_MUL_START = 0.7
const EX_SUM_GAP = 0.09
const EX_SUM_FLY = 0.55
const EX_SUM_LAND = (TOKENS.length - 1) * EX_SUM_GAP + EX_SUM_FLY

function ArcExplorer() {
  const [query, setQuery] = useState(0)
  const ref = useRef<SVGSVGElement>(null)
  const { cycle, shown, reduce, controls, restart } = useStepLoop(ref, EX_TICKS, EX_STEP, undefined, true)
  const raw = K.map((k) => dot(Q[query], k))
  const scaled = raw.map((v) => v / Math.sqrt(D_K))
  const weights = softmax(scaled)
  const out = EX_OUTS[query]
  const at = (r: number) => reduce || shown >= EX_AT[r]
  // during the scores, the key being dotted with q; after them, the row being worked out, if any
  const key = !reduce && shown >= 1 && shown <= EX_N ? shown - 1 : null
  const live =
    reduce || key !== null || shown >= EX_TICKS ? -1 : shown === EX_N + 4 ? EX_ROWS.indexOf("softmax × v") : EX_AT.indexOf(shown)
  const lit = (r: number) => (key !== null ? r <= 4 : live < 0 || r === live)
  const done = reduce || shown >= EX_TICKS
  const x = (j: number) => EX.left + (j + 0.5) * EX_COL
  const rowY = (r: number) => EX.top + r * EX.row
  // where entry c of a vector in row r, column j sits
  const entryX = (j: number, c: number) => x(j) - (D_K * EX.pitch - (EX.pitch - EX.cell)) / 2 + c * EX.pitch
  const entryY = (r: number) => rowY(r) + (EX.numH - EX.cell) / 2
  // the sum in the + row: a single square, as it's one number, that gets brighter by each product as it lands. It's at
  // full brightness at this query's top score
  const sumX = (j: number) => x(j) - EX.cell / 2
  const sumY = entryY(3)
  const sumShade = (v: number) => 0.08 + (v / topRaw) * 0.82
  // the sum after each product, and when each product lands on the square
  const running = (j: number) => Q[query].map((_, c) => Q[query].slice(0, c + 1).reduce((t, v, cc) => t + v * K[j][cc], 0))
  const landings = Q[query].map((_, c) => EX_ADD + c * EX_GAP + EX_FLY)
  const topRaw = Math.max(...raw, 1e-9)
  const topScaled = Math.max(...scaled, 1e-9)
  const vShade = (v: number) => Math.max(0, Math.min(1, (v - PROJECTIONS.value.lo) / (PROJECTIONS.value.hi - PROJECTIONS.value.lo)))
  const two = (v: number) => (Math.abs(v) < 0.005 ? "0.00" : v.toFixed(2))
  const one = (v: number) => (Math.abs(v) < 0.05 ? "0" : v.toFixed(1))

  const vec = (v: Vec, cx: number, y: number, color: string, shade: (v: number) => number, weight = 1, cell = EX.cell, pitch = EX.pitch) =>
    v.map((val, d) => (
      <rect
        key={d}
        x={cx - (v.length * pitch - (pitch - cell)) / 2 + d * pitch}
        y={y}
        width={cell}
        height={cell}
        rx={2}
        fill={color}
        fillOpacity={(0.1 + shade(val) * 0.8) * weight}
      />
    ))
  const number = (v: number, top: number, cx: number, y: number) => (
    <>
      <rect x={cx - EX.numW / 2} y={y} width={EX.numW} height={EX.numH} rx={4} fill={WEIGHT} fillOpacity={0.08 + (v / top) * 0.6} />
      <text x={cx} y={y + 15} textAnchor="middle" className={cn("font-mono text-[11px]", v / top > 0.7 ? "fill-background" : "fill-foreground")}>
        {two(v)}
      </text>
    </>
  )
  // what goes in row r, column j
  const cell = (r: number, j: number) => {
    const y = rowY(r)
    const cx = x(j)
    const mid = y + (EX.numH - EX.cell) / 2
    switch (EX_ROWS[r]) {
      case "q":
        return vec(Q[j], cx, mid, QUERY, (v) => v / GAIN)
      case "k":
        return vec(K[j], cx, mid, KEY, (v) => v / GAIN)
      case "score":
        return number(raw[j], topRaw, cx, y)
      case "÷ √d_k":
        return number(scaled[j], topScaled, cx, y)
      case "softmax":
        return number(weights[j], 1, cx, y)
      case "v":
        return vec(EX_V[j], cx, mid, VALUE, vShade)
      case "softmax × v":
        return vec(EX_V[j], cx, mid, VALUE, vShade, weights[j])
      case "output":
        return vec(EX_OUTS[j], cx, mid, SCORE, vShade)
    }
  }

  const pick = (j: number) => {
    setQuery(j)
    restart()
  }

  return (
    <Figure
      caption={
        <span className="inline-flex items-center gap-1.5 font-mono">
          <Hand className="size-3.5" />
          click a word to make it the query
        </span>
      }
    >
      <svg ref={ref} viewBox={`0 0 ${EX.w} ${EX_H}`} className="w-full select-none">
        {TOKENS.map((_, j) => {
          if (j === query) return null
          const dx = x(j) - x(query)
          const w = weights[j]
          return (
            <path
              key={j}
              d={`M${x(query)},${EX.base} Q${x(query) + dx / 2},${EX.base - Math.abs(dx) * 0.62} ${x(j)},${EX.base}`}
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth={1 + w * 9}
              strokeOpacity={0.12 + w * 0.88}
              className="text-foreground transition-[stroke-width,stroke-opacity] duration-300"
            />
          )
        })}
        {TOKENS.map((t, j) => (
          <g key={j} className="cursor-pointer" onClick={() => pick(j)}>
            <rect
              x={x(j) - EX_COL / 2 + 3}
              y={EX.base + 6}
              width={EX_COL - 6}
              height={26}
              rx={7}
              className={j === query ? "fill-card" : "fill-transparent"}
              stroke={j === query ? QUERY : "transparent"}
            />
            <text
              x={x(j)}
              y={EX.base + 23}
              textAnchor="middle"
              fill={j === query ? QUERY : "currentColor"}
              className="font-mono text-[12px] text-foreground"
            >
              {t}
            </text>
          </g>
        ))}

        {/* the calculation, a row at a time */}
        {EX_ROWS.map((name, r) =>
          name === "×" || name === "+" ? (
            // the dot product's two rows share one label: × multiplies each pair of entries, + adds the products up
            <text key={name} x={EX.left - 12} y={rowY(r) + 15} textAnchor="end" className="fill-muted-foreground font-mono text-[12px]">
              {name}
            </text>
          ) : (
            <text
              key={name}
              x={EX.left - 12}
              y={rowY(r) + 15}
              textAnchor="end"
              fill={
                name === "q" ? QUERY : name === "k" ? KEY : name === "v" || name === "softmax × v" ? VALUE : name === "output" ? SCORE : WEIGHT
              }
              className={cn("font-mono text-[11px] transition-opacity", !lit(r) && "opacity-50")}
            >
              {name}
            </text>
          ),
        )}
        <g className={cn("transition-opacity", !lit(2) && "opacity-50")}>
          <text x={EX.left - 34} y={(rowY(2) + rowY(3)) / 2 + 15} textAnchor="end" fill={WEIGHT} className="font-mono text-[11px]">
            q · k
          </text>
          <path
            d={`M${EX.left - 24},${rowY(2) + 4} q-4,0 -4,4 V${rowY(3) + EX.numH - 8} q0,4 4,4`}
            fill="none"
            className="stroke-muted-foreground"
            strokeWidth={1}
          />
        </g>
        <g key={`${cycle}-${query}`}>
          {EX_ROWS.map((_, r) =>
            at(r) ? (
              <motion.g
                key={r}
                initial={reduce || EX_AT[r] === 0 ? false : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                {TOKENS.map((_, j) =>
                  r === 2 ? (
                    // the products appear one entry at a time, as their pair of squares lands
                    (reduce || shown > j) && (
                      <g key={j}>
                        {Q[query].map((v, c) => {
                          const p = v * K[j][c]
                          return (
                            <motion.rect
                              key={c}
                              x={x(j) - (D_K * EX.pitch - (EX.pitch - EX.cell)) / 2 + c * EX.pitch}
                              y={rowY(r) + (EX.numH - EX.cell) / 2}
                              width={EX.cell}
                              height={EX.cell}
                              rx={2}
                              fill={WEIGHT}
                              fillOpacity={0.1 + (p / (GAIN * GAIN)) * 0.8}
                              initial={reduce || key !== j ? false : { opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.12, delay: c * EX_GAP + EX_FLY * 0.8 }}
                            />
                          )
                        })}
                      </g>
                    )
                  ) : r === 3 ? (
                    // the running sum: one square that brightens by each product as it lands, up to the score
                    (reduce || shown > j) && (
                      <g key={j}>
                        <rect x={sumX(j) - 2} y={sumY - 2} width={EX.cell + 4} height={EX.cell + 4} rx={3} fill="none" className="stroke-foreground/30" />
                        <motion.rect
                          x={sumX(j)}
                          y={sumY}
                          width={EX.cell}
                          height={EX.cell}
                          rx={2}
                          fill={WEIGHT}
                          initial={!reduce && key === j ? { fillOpacity: sumShade(0) } : false}
                          animate={{ fillOpacity: !reduce && key === j ? [0, 0, ...running(j)].map(sumShade) : sumShade(raw[j]) }}
                          transition={
                            !reduce && key === j
                              ? { duration: landings[D_K - 1], ease: "easeOut", times: [0, EX_ADD / landings[D_K - 1], ...landings.map((t) => t / landings[D_K - 1])] }
                              : { duration: 0 }
                          }
                        />
                      </g>
                    )
                  ) : r === 4 ? (
                    // then the total becomes the score
                    (reduce || shown > j) && (
                      <motion.g
                        key={j}
                        initial={reduce || key !== j ? false : { opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: EX_SCORE }}
                      >
                        {cell(r, j)}
                      </motion.g>
                    )
                  ) : (
                    <motion.g
                      key={j}
                      initial={reduce || EX_AT[r] === 0 ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: EX_ROWS[r] === "softmax × v" ? EX_MUL_START + j * EX_MUL_GAP + EX_MUL_FLY * 1.85 : j * 0.05 }}
                    >
                      {cell(r, j)}
                    </motion.g>
                  ),
                )}
              </motion.g>
            ) : null,
          )}
          {/* the dot product in progress, square by square: q's entry c and k's entry c fly into their product, and then
              the products fly into the score */}
          {key !== null && (
            <g key={`fly-${key}`} className="pointer-events-none">
              {Q[query].map((qv, c) => {
                const to = { x: entryX(key, c), y: entryY(2) }
                const pair = [
                  { from: { x: entryX(query, c), y: entryY(0) }, color: QUERY, v: qv / GAIN },
                  { from: { x: entryX(key, c), y: entryY(1) }, color: KEY, v: K[key][c] / GAIN },
                ]
                return (
                  <g key={c}>
                    {pair.map((p, i) => (
                      <motion.rect
                        key={i}
                        x={to.x}
                        y={to.y}
                        width={EX.cell}
                        height={EX.cell}
                        rx={2}
                        fill={p.color}
                        fillOpacity={0.15 + p.v * 0.8}
                        initial={{ x: p.from.x - to.x, y: p.from.y - to.y, opacity: 0 }}
                        animate={{ x: 0, y: 0, opacity: [0, 1, 1, 0] }}
                        transition={{
                          x: { duration: EX_FLY, delay: c * EX_GAP, ease: "easeInOut" },
                          y: { duration: EX_FLY, delay: c * EX_GAP, ease: "easeInOut" },
                          opacity: { duration: EX_FLY, delay: c * EX_GAP, times: [0, 0.1, 0.8, 1] },
                        }}
                      />
                    ))}
                    {/* the product, dropping into the sum */}
                    <motion.rect
                      x={sumX(key)}
                      y={sumY}
                      width={EX.cell}
                      rx={2}
                      fill={WEIGHT}
                      fillOpacity={0.15 + ((qv * K[key][c]) / (GAIN * GAIN)) * 0.8}
                      height={EX.cell}
                      initial={{ x: to.x - sumX(key), y: to.y - sumY, opacity: 0 }}
                      animate={{ x: 0, y: 0, opacity: [0, 1, 1, 0] }}
                      transition={{
                        x: { duration: EX_FLY, delay: EX_ADD + c * EX_GAP, ease: "easeInOut" },
                        y: { duration: EX_FLY, delay: EX_ADD + c * EX_GAP, ease: "easeInOut" },
                        opacity: { duration: EX_FLY, delay: EX_ADD + c * EX_GAP, times: [0, 0.1, 0.8, 1] },
                      }}
                    />
                  </g>
                )
              })}
            </g>
          )}
        </g>
        {/* the word being worked on: a box around its q, and around its output, which flashes as it's finished */}
        <rect
          x={x(query) - EX.numW / 2 - 4}
          y={rowY(0) - 3}
          width={EX.numW + 8}
          height={EX.numH + 6}
          rx={6}
          fill="none"
          stroke={QUERY}
          strokeWidth={1.25}
          className="pointer-events-none"
        />
        <motion.rect
          key={`out-${cycle}-${query}-${done}`}
          x={x(query) - EX.numW / 2 - 4}
          y={rowY(EX_ROWS.length - 1) - 3}
          width={EX.numW + 8}
          height={EX.numH + 6}
          rx={6}
          fill={SCORE}
          stroke={SCORE}
          strokeWidth={1.25}
          className="pointer-events-none"
          initial={{ fillOpacity: 0 }}
          animate={{ fillOpacity: done && !reduce ? [0, 0.35, 0] : 0 }}
          transition={{ duration: 0.8, delay: EX_SUM_LAND }}
        />
        {/* softmax × v: each word's probability box drops onto its v, then the v, scaled by it, drops into the
            softmax × v row */}
        {EX_ROWS[live] === "softmax × v" && !reduce && (
          <g key={`mul-${cycle}-${query}`} className="pointer-events-none">
            {TOKENS.map((_, j) => {
              const vY = rowY(EX_ROWS.indexOf("v"))
              const toY = rowY(EX_ROWS.indexOf("softmax × v"))
              const at = EX_MUL_START + j * EX_MUL_GAP
              return (
                <g key={j}>
                  {/* the probability's own box from the softmax row, shaded the same but without its number, dropping
                      onto the v */}
                  <motion.rect
                    x={x(j) - EX.numW / 2}
                    y={vY}
                    width={EX.numW}
                    height={EX.numH}
                    rx={4}
                    fill={WEIGHT}
                    fillOpacity={0.08 + weights[j] * 0.6}
                    initial={{ y: rowY(EX_ROWS.indexOf("softmax")) - vY, opacity: 0 }}
                    animate={{ y: 0, opacity: [0, 1, 1, 0] }}
                    transition={{
                      y: { duration: EX_MUL_FLY, delay: at, ease: "easeOut" },
                      opacity: { duration: EX_MUL_FLY * 2, delay: at, times: [0, 0.1, 0.75, 1] },
                    }}
                  />
                  <motion.g
                    initial={{ y: vY - toY, opacity: 0 }}
                    animate={{ y: 0, opacity: [0, 1, 1, 0] }}
                    transition={{
                      y: { duration: EX_MUL_FLY, delay: at + EX_MUL_FLY, ease: "easeInOut" },
                      opacity: { duration: EX_MUL_FLY + 0.15, delay: at + EX_MUL_FLY, times: [0, 0.1, 0.8, 1] },
                    }}
                  >
                    {vec(EX_V[j], x(j), toY + (EX.numH - EX.cell) / 2, VALUE, vShade, Math.max(weights[j], 0.15))}
                  </motion.g>
                </g>
              )
            })}
          </g>
        )}
        {/* the sum into the output: every word's scaled v flies down into the query's output, entry by entry, and they
            add up there */}
        {done && !reduce && (
          <g key={`sum-${cycle}-${query}`} className="pointer-events-none">
            <rect
              x={EX.left - 4}
              y={rowY(EX_ROWS.indexOf("softmax × v")) - 3}
              width={EX.w - EX.left + 2}
              height={EX.numH + 6}
              rx={6}
              fill="none"
              stroke={VALUE}
              strokeWidth={1.25}
            />
            {TOKENS.map((_, j) =>
              EX_V[j].map((v, c) => {
                const from = { x: entryX(j, c), y: entryY(EX_ROWS.indexOf("softmax × v")) }
                const to = { x: entryX(query, c), y: entryY(EX_ROWS.length - 1) }
                return (
                  <motion.rect
                    key={`${j}-${c}`}
                    x={to.x}
                    y={to.y}
                    width={EX.cell}
                    height={EX.cell}
                    rx={2}
                    fill={VALUE}
                    fillOpacity={(0.1 + vShade(v) * 0.8) * Math.max(weights[j], 0.15)}
                    initial={{ x: from.x - to.x, y: from.y - to.y, opacity: 0 }}
                    animate={{ x: 0, y: 0, opacity: [0, 1, 1, 0] }}
                    transition={{
                      x: { duration: EX_SUM_FLY, delay: j * EX_SUM_GAP, ease: "easeInOut" },
                      y: { duration: EX_SUM_FLY, delay: j * EX_SUM_GAP, ease: "easeInOut" },
                      opacity: { duration: EX_SUM_FLY, delay: j * EX_SUM_GAP, times: [0, 0.1, 0.85, 1] },
                    }}
                  />
                )
              }),
            )}
            <motion.text
              x={x(query) + EX.numW / 2 + 6}
              y={rowY(EX_ROWS.length - 1) - 1}
              textAnchor="middle"
              fill={SCORE}
              className="font-mono text-[12px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{ duration: EX_SUM_LAND + 0.6, times: [0, 0.15, 0.8, 1] }}
            >
              Σ
            </motion.text>
          </g>
        )}
        {/* the key being dotted with q: an orange box around its k, moving from word to word */}
        {key !== null && (
          <rect
            width={EX.numW + 8}
            height={EX.numH + 6}
            rx={6}
            fill="none"
            stroke={KEY}
            strokeWidth={1.25}
            className="pointer-events-none"
            style={{ transform: `translate(${x(key) - EX.numW / 2 - 4}px, ${rowY(1) - 3}px)`, transition: "transform 200ms ease-out" }}
          />
        )}
        {/* the row being worked out: yellow for the scores and probabilities, blue for the scaled values */}
        {live > 4 && (
          <rect
            x={EX.left - 4}
            width={EX.w - EX.left + 2}
            height={EX.numH + 6}
            rx={6}
            fill="none"
            stroke={EX_ROWS[live] === "softmax × v" ? VALUE : WEIGHT}
            strokeWidth={1.25}
            className="pointer-events-none"
            style={{ transform: `translateY(${rowY(live) - 3}px)`, transition: "transform 200ms ease-out, stroke 200ms" }}
          />
        )}

        <text x={EX.w / 2} y={EX_H - 8} textAnchor="middle" className="fill-muted-foreground font-mono text-[12px]">
          {key !== null ? (
            <>
              <tspan fill={QUERY}>q{SUB[query]}</tspan> · <tspan fill={KEY}>k{SUB[key]}</tspan> ={" "}
              {Q[query].map((v, c) => `${one(v)}×${one(K[key][c])}`).join(" + ")} ={" "}
              <tspan fill={WEIGHT}>{two(raw[key])}</tspan>
            </>
          ) : live === 5 ? (
            <>
              divide each <tspan fill={WEIGHT}>score</tspan> by √d_k = {Math.sqrt(D_K)}
            </>
          ) : live === 6 ? (
            <>
              <tspan fill={WEIGHT}>softmax</tspan> the row: probabilities that add up to 1, the arcs above
            </>
          ) : live === 8 ? (
            <>
              scale each word's <tspan fill={VALUE}>v</tspan> by its probability
            </>
          ) : done ? (
            <>
              <tspan fill={SCORE}>output</tspan> = ({out.map(two).join(", ")}), the scaled{" "}
              <tspan fill={VALUE}>v</tspan>'s added up
            </>
          ) : (
            <>
              how <tspan fill={QUERY}>{TOKENS[query]}</tspan> gets its attention output
            </>
          )}
        </text>
      </svg>
      {controls}
    </Figure>
  )
}

const STEP_1 = `x = embed(tokens)  # [n, d_model], one row per token
Q = x @ W_Q        # [n, d_k]
K = x @ W_K        # [n, d_k]
V = x @ W_V        # [n, d_v]`

const STEP_2 = `def attention(Q, K, V, causal=False):
    d_k = Q.shape[-1]
    scores = Q @ K.transpose(-2, -1) / d_k ** 0.5  # [n, n]: every query against every key
    if causal:
        n = scores.shape[-1]
        later = torch.triu(torch.ones(n, n, dtype=torch.bool), diagonal=1)
        scores = scores.masked_fill(later, float("-inf"))  # no looking ahead
    weights = scores.softmax(dim=-1)  # each row sums to 1
    return weights @ V                # [n, d_v]: a weighted mix of values per token`

const BUILT_IN = `out = F.scaled_dot_product_attention(Q, K, V, is_causal=True)`

// the formula with each part labelled underneath, matching the other notes
const FORMULA = [
  `\\mathrm{Attention}(${texColor(QUERY, "Q")}, ${texColor(KEY, "K")}, ${texColor(VALUE, "V")}) =`,
  `\\underbrace{\\mathrm{softmax}}_{${texNote("per word\nor token", WEIGHT)}} \\Big(`,
  `\\underbrace{${texColor(QUERY, "Q")}${texColor(KEY, "K")}^{\\top}}_{${texNote("scores", WEIGHT)}}`,
  `/`,
  `\\underbrace{\\sqrt{d_k}}_{${texNote("divide by\nsquare root")}}`,
  `\\Big)`,
  `\\underbrace{${texColor(VALUE, "V")}}_{${texNote("distribute the\nvalue vectors", VALUE)}}`,
].join(" ")
