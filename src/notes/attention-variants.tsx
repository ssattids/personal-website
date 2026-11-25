import { useRef, useState, type ReactNode } from "react"
import { motion } from "motion/react"
import { Hand } from "lucide-react"

import { cn } from "@/lib/utils"
import { useStepLoop } from "@/notes/attention"
import {
  Bullets,
  Code,
  Components,
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

// the attention note's colours: embeddings green, queries purple, keys orange, values blue, attention weights yellow
const EMBED = "oklch(0.74 0.15 150)"
const QUERY = "oklch(0.7 0.17 300)"
const KEY = "oklch(0.74 0.16 55)"
const VALUE = "oklch(0.7 0.14 240)"
const WEIGHT = "oklch(0.85 0.16 95)"

const C = ({ c, children }: { c: string; children: ReactNode }) => <span style={{ color: c }}>{children}</span>
const Query = ({ children = "query" }: { children?: ReactNode }) => <C c={QUERY}>{children}</C>
const Key = ({ children = "key" }: { children?: ReactNode }) => <C c={KEY}>{children}</C>
const Value = ({ children = "value" }: { children?: ReactNode }) => <C c={VALUE}>{children}</C>

type Vec = number[]

const dot = (a: Vec, b: Vec) => a.reduce((s, x, k) => s + x * b[k], 0)
const softmax = (xs: number[]) => {
  // subtract the max first so exp never overflows; a masked -Infinity score comes out as weight 0
  const top = Math.max(...xs)
  const e = xs.map((x) => Math.exp(x - top))
  const total = e.reduce((s, x) => s + x, 0)
  return e.map((x) => x / total)
}

// the attention note's sentence and toy vectors, without "out". Queries and keys have four features,
// [money, place, action, person]; a trained model learns its own
const WORDS = ["I", "went", "to", "the", "bank", "to", "get", "money"]
const RAW_Q: Vec[] = [
  [0, 0, 1, 0], // I: wants what it did
  [0, 0.7, 0, 0.7], // went: wants who went, and where
  [0, 1, 0, 0], // to: wants a place
  [0.5, 0.5, 0, 0], // the: wants the noun it introduces
  [1, 0, 0, 0], // bank: wants a hint of which bank, here money
  [0, 0, 1, 0], // to: wants the action it leads to
  [1, 0, 0, 0], // get: wants what is got
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
  [1, 0, 0, 0], // money
]
// scaled by 3 like the attention note's, so the weights are sharp enough to read, then divided by √d_k = 2
const SELF_SCORES = RAW_Q.map((q) => RAW_K.map((k) => (dot(q, k) * 9) / 2))
const BANK = WORDS.indexOf("bank")

// a French translation of the start of the sentence, attending to the English. Hand-picked scores:
// each French word mostly lines up with the English word it translates
const SOURCE = ["I", "went", "to", "the", "bank"]
const TARGET = ["je", "suis", "allé", "à", "la", "banque"]
const CROSS_SCORES = [
  [3, 0, 0, 0, 0], // je: I
  [2, 2, 0, 0, 0], // suis: I went
  [0, 3, 0, 0, 0], // allé: went
  [0, 0.5, 3, 0, 0], // à: to
  [0, 0, 0, 3, 1], // la: the (bank)
  [0, 0, 0, 0.5, 3.5], // banque: bank
]

export function AttentionVariantsNote() {
  return (
    <>
      <Section>
        <H2>Background</H2>
        <Bullets
          items={[
            <>
              Attention lets each word update itself using the words around it.
              <SubBullets
                items={[
                  <>
                    Make sure you read this note on <NoteLink to="/notes/attention">Attention</NoteLink> first.
                  </>,
                ]}
              />
            </>,
            "Transformers use it in three ways: self-attention, masked self-attention and cross-attention.",
            "The maths is the same in all three. They differ in where the queries, keys and values come from, and which words each word may look at.",
          ]}
        />
      </Section>

      <Section>
        <H2>Query, key and value, intuitively</H2>
        <Bullets
          items={[
            <>
              Attention is a soft lookup, like searching a library. Every word plays three roles:
              <SubBullets
                items={[
                  <>
                    <Query>Query</Query>: what this word is looking for. "bank" asks: is anything here about money?
                  </>,
                  <>
                    <Key>Key</Key>: the label each word can be found by. "money" is labelled as about money.
                  </>,
                  <>
                    <Value>Value</Value>: what a word hands over once it's found: what "money" means here.
                  </>,
                ]}
              />
            </>,
            <>
              A <Query /> is scored against every <Key /> with a dot product, and{" "}
              <NoteLink to="/notes/softmax">softmax</NoteLink> turns the scores into <C c={WEIGHT}>weights</C> that add up
              to 1. The word's output is the <Value>values</Value> mixed by those weights.
            </>,
          ]}
        />
      </Section>

      <Section>
        <H2>Self-attention</H2>
        <Bullets
          items={[
            <>
              The <Query>queries</Query>, <Key>keys</Key> and <Value>values</Value> all come from the same sentence, so
              every word looks at every word, itself included.
            </>,
            '"bank" looks both ways and finds "money" further on, so it learns this is the money kind of bank.',
            "Encoders like BERT use it: they read a whole sentence at once to understand it.",
          ]}
        />
        <Figure caption={<ClickHint />}>
          <AttentionMap queries={WORDS} keys={WORDS} scores={SELF_SCORES} start={BANK} />
        </Figure>
      </Section>

      <Section>
        <H2>Masked self-attention</H2>
        <Bullets
          items={[
            <>
              The <Query>queries</Query>, <Key>keys</Key> and <Value>values</Value> all come from the same sentence, as in
              self-attention, but each word only looks at itself and the words before it.
            </>,
            <>
              Typically this is used to train text generation models, where we can only look at words that have been
              generated so far.
              <SubBullets items={["GPT and every chatbot use it: they write one word at a time."]} />
            </>,
          ]}
        />
        <MaskExplorer />
        <H3>Masked self-attention - mechanics in practice</H3>
        <Bullets
          items={[
            "To apply masked self-attention we can slightly modify the original attention mechanism by adding a mask.",
            <>
              The mask adds <M>{"-\\infty"}</M> to every score for a later word before{" "}
              <NoteLink to="/notes/softmax">softmax</NoteLink>. <M>{"e^{-\\infty} = 0"}</M>, so those words get weight 0
              and the rest still add up to 1.
            </>,
          ]}
        />
        <Formula tex={MASK_FORMULA} animate />
        <Components
          items={[
            <>
              <M>{"M"}</M> = the mask: <M>{"0"}</M> on and below the diagonal, <M>{"-\\infty"}</M> above it. For three
              words,{" "}
              <M>{"\\begin{bmatrix} 0 & -\\infty & -\\infty \\\\ 0 & 0 & -\\infty \\\\ 0 & 0 & 0 \\end{bmatrix}"}</M>
            </>,
          ]}
        />
      </Section>

      <Section>
        <H2>Cross-attention</H2>
        <Bullets
          items={[
            <>
              Two sequences meet. The <Query>queries</Query> come from one, and the <Key>keys</Key> and{" "}
              <Value>values</Value> from the other.
            </>,
            'In translation, the French being written asks the English sentence what to say next: "banque" finds "bank".',
            "The grid is a rectangle, one row per French word and one column per English word, and nothing is masked: the English is all there already.",
            "It's how outputs listen to inputs: translation, speech to text (Whisper listening to audio) and image generation (Stable Diffusion's image following the prompt).",
          ]}
        />
        <Formula tex={CROSS_FORMULA} animate />
        <Components
          items={[
            <>
              <M>{"X_{\\text{dec}}"}</M> = the translation so far, from the decoder: it makes the <Query>queries</Query>
            </>,
            <>
              <M>{"X_{\\text{enc}}"}</M> = the source sentence, from the encoder: it makes the <Key>keys</Key> and{" "}
              <Value>values</Value>
            </>,
            <>
              <M>{"W_Q, W_K, W_V"}</M> = learned weights that turn each word into its query, key and value
            </>,
            <>
              <M>{"d_k"}</M> = the length of each key; dividing by <M>{"\\sqrt{d_k}"}</M> keeps the scores from growing too
              large
            </>,
          ]}
        />
        <Figure caption={<ClickHint />}>
          <AttentionMap
            queries={TARGET}
            keys={SOURCE}
            scores={CROSS_SCORES}
            start={TARGET.indexOf("banque")}
            queryFrom="French"
            keyFrom="English"
          />
        </Figure>
      </Section>

      <Section>
        <H2>Side by side</H2>
        <Bullets
          items={[
            "Each kind is a different shape of grid: full, lower triangle, or a rectangle between two sequences.",
            "A translation model uses all three: self-attention in the encoder, then masked self-attention and cross-attention in each decoder layer.",
          ]}
        />
        <Comparison />
      </Section>

      <Section>
        <H2>An example with all use-cases - Machine Translation</H2>
        <TranslationAnimation />
      </Section>

      <Section>
        <H2>In code</H2>
        <Bullets
          items={[
            "One function covers all three. Pass the same sequence twice for self-attention, add the mask for masked, and pass two sequences for cross.",
          ]}
        />
        <Code>{CODE}</Code>
      </Section>

      <Section>
        <H2>Takeaways</H2>
        <Bullets
          items={[
            "The query is what a word looks for, the key what it can be found by, the value what it hands over.",
            "Self-attention: queries, keys and values from one sentence, and every word sees every word.",
            "Masked self-attention: the same, but each word only sees itself and earlier words, for writing text.",
            "Cross-attention: queries from one sequence, keys and values from another, so an output can read its input.",
          ]}
        />
      </Section>
    </>
  )
}

// the caption under the self and masked figures
function ClickHint() {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono">
      <Hand className="size-3.5" />
      click a <Query /> item to see which other items the attention mechanism attends to
    </span>
  )
}

function MaskExplorer() {
  return (
    <Figure caption={<ClickHint />}>
      <AttentionMap queries={WORDS} keys={WORDS} scores={SELF_SCORES} start={BANK} mask />
    </Figure>
  )
}

// the same attention drawn two ways: the chosen query's links to every key, and the whole grid of weights.
// Click a word on the left, or a row of the grid, to choose the query
const ROW = 28
const LINK_TOP = 30
const CELL = 26
const GRID_LEFT = 56
const GRID_TOP = 68

function AttentionMap({
  queries,
  keys,
  scores,
  start,
  mask = false,
  queryFrom = "queries",
  keyFrom = "keys and values",
}: {
  queries: string[]
  keys: string[]
  scores: number[][]
  start: number
  mask?: boolean
  queryFrom?: string
  keyFrom?: string
}) {
  const [sel, setSel] = useState(start)
  const hidden = (i: number, j: number) => mask && j > i
  const weights = scores.map((row, i) => softmax(row.map((s, j) => (hidden(i, j) ? -Infinity : s))))
  const y = (i: number) => LINK_TOP + i * ROW + ROW / 2
  const linkH = LINK_TOP + Math.max(queries.length, keys.length) * ROW
  const gridW = GRID_LEFT + keys.length * CELL
  const gridH = GRID_TOP + queries.length * CELL

  return (
    <>
      <div className="grid items-start gap-6 sm:grid-cols-2">
        <svg viewBox={`0 0 320 ${linkH}`} className="w-full select-none font-mono text-[12px]">
          <text x={92} y={14} textAnchor="end" fill={QUERY} className="text-[10px]">
            {queryFrom}
          </text>
          <text x={228} y={14} fill={KEY} className="text-[10px]">
            {keyFrom}
          </text>
          {keys.map((_, j) =>
            hidden(sel, j) ? null : (
              <line
                key={j}
                x1={100}
                x2={220}
                y1={y(sel)}
                y2={y(j)}
                stroke={WEIGHT}
                strokeWidth={1 + weights[sel][j] * 7}
                strokeOpacity={0.15 + weights[sel][j] * 0.85}
                strokeLinecap="round"
              />
            ),
          )}
          {queries.map((w, i) => (
            <text
              key={i}
              x={92}
              y={y(i)}
              dy="0.35em"
              textAnchor="end"
              onClick={() => setSel(i)}
              fill={i === sel ? QUERY : "currentColor"}
              className={cn("cursor-pointer", i === sel ? "font-semibold" : "text-muted-foreground")}
            >
              {w}
            </text>
          ))}
          {keys.map((w, j) => (
            <g key={j} className={hidden(sel, j) ? "opacity-30" : undefined}>
              <text x={228} y={y(j)} dy="0.35em" fill={KEY}>
                {w}
              </text>
              <text x={316} y={y(j)} dy="0.35em" textAnchor="end" className="fill-muted-foreground text-[10px]">
                {hidden(sel, j) ? "hidden" : `${Math.round(weights[sel][j] * 100)}%`}
              </text>
            </g>
          ))}
        </svg>

        <svg viewBox={`0 0 ${gridW + 32} ${gridH + 4}`} className="mx-auto w-full max-w-72 select-none font-mono text-[10px]">
          {keys.map((w, j) => (
            <text
              key={j}
              transform={`translate(${GRID_LEFT + j * CELL + CELL / 2 + 3}, ${GRID_TOP - 6}) rotate(-50)`}
              fill={KEY}
            >
              {w}
            </text>
          ))}
          {queries.map((w, i) => (
            <g key={i} onClick={() => setSel(i)} className="cursor-pointer">
              <text x={GRID_LEFT - 6} y={GRID_TOP + i * CELL + CELL / 2} dy="0.35em" textAnchor="end" fill={i === sel ? QUERY : "currentColor"} className={i === sel ? undefined : "text-muted-foreground"}>
                {w}
              </text>
              {keys.map((_, j) => (
                <g key={j}>
                  <rect
                    x={GRID_LEFT + j * CELL + 1}
                    y={GRID_TOP + i * CELL + 1}
                    width={CELL - 2}
                    height={CELL - 2}
                    rx={3}
                    fill={hidden(i, j) ? "transparent" : WEIGHT}
                    fillOpacity={hidden(i, j) ? 0 : 0.06 + weights[i][j] * 0.94}
                    className={hidden(i, j) ? "stroke-foreground/10" : undefined}
                    strokeDasharray={hidden(i, j) ? "2 3" : undefined}
                  />
                </g>
              ))}
            </g>
          ))}
          <rect
            x={GRID_LEFT - 1}
            y={GRID_TOP + sel * CELL - 1}
            width={keys.length * CELL + 2}
            height={CELL + 2}
            rx={4}
            fill="none"
            stroke={QUERY}
            strokeWidth={1.5}
          />
        </svg>
      </div>
    </>
  )
}

// a small icon of each kind's grid, filled where a query may look
function MiniGrid({ rows, cols, mask = false }: { rows: number; cols: number; mask?: boolean }) {
  const S = 9
  return (
    <svg viewBox={`0 0 ${cols * S} ${rows * S}`} style={{ width: cols * S, height: rows * S }} className="shrink-0">
      {Array.from({ length: rows }, (_, i) =>
        Array.from({ length: cols }, (_, j) => (
          <rect
            key={`${i}-${j}`}
            x={j * S + 0.5}
            y={i * S + 0.5}
            width={S - 1}
            height={S - 1}
            rx={1.5}
            fill={WEIGHT}
            fillOpacity={mask && j > i ? 0.08 : 0.8}
          />
        )),
      )}
    </svg>
  )
}

const KINDS = [
  { name: "Self", grid: <MiniGrid rows={4} cols={4} />, q: "the sentence", kv: "the same sentence", sees: "every word", used: "BERT, encoders" },
  { name: "Masked self", grid: <MiniGrid rows={4} cols={4} mask />, q: "the text so far", kv: "the same text", sees: "itself and earlier words", used: "GPT, chatbots" },
  { name: "Cross", grid: <MiniGrid rows={3} cols={5} />, q: "the output (decoder)", kv: "the input (encoder)", sees: "the whole input", used: "translation, Whisper" },
]

function Comparison() {
  return (
    <Figure>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] text-left text-xs">
          <thead className="font-mono text-muted-foreground">
            <tr>
              <th className="pb-3 font-normal" />
              <th className="pb-3 font-normal">
                <Query>queries</Query> from
              </th>
              <th className="pb-3 font-normal">
                <Key>keys</Key> and <Value>values</Value> from
              </th>
              <th className="pb-3 font-normal">each word sees</th>
              <th className="pb-3 font-normal">used in</th>
            </tr>
          </thead>
          <tbody>
            {KINDS.map((k) => (
              <tr key={k.name} className="border-t">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-3">
                    {k.grid}
                    <span className="font-medium text-foreground">{k.name}</span>
                  </div>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">{k.q}</td>
                <td className="py-3 pr-4 text-muted-foreground">{k.kv}</td>
                <td className="py-3 pr-4 text-muted-foreground">{k.sees}</td>
                <td className="py-3 text-muted-foreground">{k.used}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Figure>
  )
}

// the original encoder-decoder Transformer translating "my teddy bear is cute ." into French. The encoder (green, left)
// runs once; then the decoder (right) runs once per French word, each pass lighting its blocks from the bottom up and
// ending in a probability for every word in a small vocabulary. The winner joins the decoder's input for the next pass
const MT_SRC = ["my", "teddy bear", "is", "cute", "."]
const MT_OUT = ["mon", "nounours", "est", "mignon", ".", "[EOS]"]
const MT_VOCAB = ["le", "mon", "chat", "nounours", "est", "très", "mignon", ".", "[EOS]"]
// how tall the losing words' bars stand, rotated a place each pass so the chart changes
const MT_NOISE = [0.22, 0.12, 0.3, 0.16, 0.08, 0.26, 0.14, 0.2, 0.1]
const DECODER = "oklch(0.78 0.12 190)"

// viewBox units. EX and DX are the two stacks' centres; LX and RX their residual lines, the encoder's on its left and the
// decoder's on its right; GAP_X is where the encoder's output runs down between the stacks. y values are top edges or
// centres, listed bottom up
const MT_W = 664
const MT_H = 734
const EX = 165
const DX = 470
const LX = 45
const RX = 590
const FEED_X = 648 // the chosen word runs back down to the decoder's input here, right of everything
const GAP_X = 318
const BOX_W = 200
const PLUS_R = 9
const TOK_C = 644 // token row centre
const TOK_TOP = TOK_C - 11
const BOT_IN = 614 // both stacks' inner bottom edge; the dashed outline sits 8 outside
const SPLIT1 = 596 // where the input splits into V, K and Q, and the first residual leaves
const ATT1 = 540 // self-attention, and masked self-attention, 28 tall
const P1 = 516 // first ⊕
const SPLIT2 = 488 // encoder: second residual leaves. decoder: Q and the second residual leave at SPLIT2_D
const SPLIT2_D = 480
const ENC_Y = 466 // the encoder's output, running along under cross-attention's V and K
const ATT2 = 410 // encoder feed-forward, and decoder cross-attention
const P2 = 386
const ENC_TOP = 362 // the encoder's inner top edge
const ENC_TURN = 330 // the encoder's output turns right here
const SPLIT3 = 366 // decoder: third residual leaves
const FFN_D = 312 // decoder feed-forward
const P3 = 288
const DEC_TOP = 262 // the decoder's inner top edge
const LIN = 202
const SMX = 158
const BAR_BASE = 138 // the probabilities, rising up to BAR_MAX from here
const BAR_MAX = 58
const WORD = 24 // the chosen word's box, 22 tall
const MT_CAPTION = MT_H - 10

// ticks: 1-3 the encoder (self-attention, feed-forward, output), then 6 per French word: the decoder's input fed
// in, masked self-attention, cross-attention, feed-forward, softmax, and the word chosen
const MT_ENC = 3
const MT_PASS = 6
const MT_TICKS = MT_ENC + MT_OUT.length * MT_PASS
const MT_STEP = 1.1

// token boxes laid out left to right, centred on cx; widths from the character count of the monospace font
const CHAR_W = 6.6
function layoutTokens(words: string[], cx: number) {
  const widths = words.map((w) => w.length * CHAR_W + 10)
  const total = widths.reduce((s, w) => s + w, 0) + (words.length - 1) * 6
  let x = cx - total / 2
  return words.map((w, i) => {
    const box = { w, x, width: widths[i] }
    x += widths[i] + 6
    return box
  })
}

function TranslationAnimation() {
  const ref = useRef<SVGSVGElement>(null)
  const { cycle, shown, reduce, controls } = useStepLoop(ref, MT_TICKS, MT_STEP)
  // the tick on show; with reduced motion the finished translation, nothing lit
  const stage = reduce ? MT_TICKS : Math.min(shown, MT_TICKS)
  const live = !reduce && shown <= MT_TICKS
  const decoding = stage > MT_ENC
  // which French word this pass writes, and which of its six ticks it's on
  const pass = decoding ? Math.floor((stage - MT_ENC - 1) / MT_PASS) : 0
  const phase = decoding ? (stage - MT_ENC - 1) % MT_PASS : -1
  const on = {
    encAtt: live && stage === 1,
    encFfn: live && stage === 2,
    encOut: live && (stage === 3 || phase === 2),
    feed: live && phase === 0,
    mask: live && phase === 1,
    cross: live && phase === 2,
    decFfn: live && phase === 3,
    head: live && phase === 4,
    pick: live && phase === 5,
  }
  // the probabilities come out of softmax first, then the winning word on the next tick
  const predicted = phase >= 4 ? MT_OUT[pass] : null
  // the word stays in its box while it's fed back at the start of the next pass
  const chosen = phase === 5 ? MT_OUT[pass] : phase === 0 && pass > 0 ? MT_OUT[pass - 1] : null
  // [BOS] then every word written so far; the newest rises in as it's fed back
  const input = ["[BOS]", ...MT_OUT.slice(0, pass)]
  const last = layoutTokens(input, DX).at(-1)!
  const inputEnd = last.x + last.width

  const wire = (lit: boolean) => cn("transition-colors duration-300", lit ? "stroke-foreground" : "stroke-muted-foreground/40")
  // a line, with an open arrowhead at its end pointing up, left or right
  const up = (x: number, y: number) => `M${x - 4},${y + 5} L${x},${y} L${x + 4},${y + 5}`
  const left = (x: number, y: number) => `M${x + 5},${y - 4} L${x},${y} L${x + 5},${y + 4}`
  const right = (x: number, y: number) => `M${x - 5},${y - 4} L${x},${y} L${x - 5},${y + 4}`
  const path = (d: string, lit: boolean) => <path d={d} fill="none" strokeWidth={1.5} className={wire(lit)} />
  const box = (cx: number, y: number, label: string, lit: boolean, h = 28) => (
    <g>
      <rect
        x={cx - BOX_W / 2}
        y={y}
        width={BOX_W}
        height={h}
        rx={6}
        className={cn(wire(lit), lit ? "fill-muted" : "fill-card")}
      />
      <text x={cx} y={y + h / 2} dy="0.35em" textAnchor="middle" className="fill-foreground font-mono text-[12px]">
        {label}
      </text>
    </g>
  )
  const plus = (cx: number, cy: number, lit: boolean) => (
    <g>
      <circle cx={cx} cy={cy} r={PLUS_R} className={cn(wire(lit), "fill-card")} strokeWidth={1.5} />
      <path d={`M${cx - 5},${cy} H${cx + 5} M${cx},${cy - 5} V${cy + 5}`} strokeWidth={1.5} className={wire(lit)} />
    </g>
  )
  const letter = (x: number, y: number, l: "Q" | "K" | "V") => (
    <text x={x + 5} y={y} dy="0.35em" fill={{ Q: QUERY, K: KEY, V: VALUE }[l]} className="font-mono text-[11px]">
      {l}
    </text>
  )
  const tokens = (words: string[], cx: number, appear: number) =>
    layoutTokens(words, cx).map((t, i) => (
      <motion.g
        key={`${t.w}-${i}-${cycle}`}
        initial={reduce || i < appear ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <rect x={t.x} y={TOK_TOP} width={t.width} height={22} rx={3} fill="none" strokeDasharray="3 3" className="stroke-foreground/30" />
        <text x={t.x + t.width / 2} y={TOK_C} dy="0.35em" textAnchor="middle" className="fill-foreground font-mono text-[11px]">
          {t.w}
        </text>
      </motion.g>
    ))
  const header = "fill-muted-foreground font-mono text-[11px]"
  // a bracket under a row of tokens, naming it in the colour of the stack it feeds
  const bracket = (words: string[], cx: number, label: string, color: string) => {
    const row = layoutTokens(words, cx)
    const [x0, x1] = [row[0].x, row.at(-1)!.x + row.at(-1)!.width]
    const y = TOK_TOP + 22 + 5
    return (
      <g>
        <path d={`M${x0},${y} v5 H${x1} v-5`} fill="none" stroke={color} strokeOpacity={0.5} strokeWidth={1} />
        <text x={(x0 + x1) / 2} y={y + 20} textAnchor="middle" fill={color} className="font-mono text-[11px]">
          {label}
        </text>
      </g>
    )
  }

  return (
    <Figure>
      <svg ref={ref} viewBox={`0 0 ${MT_W} ${MT_H}`} className="w-full select-none">
        {/* the two stacks: a tinted layer inside a dashed outline, repeated N times */}
        <rect x={LX - 18} y={ENC_TOP - 8} width={EX - LX + 133 + 8} height={BOT_IN - ENC_TOP + 16} rx={10} fill="none" strokeDasharray="3 3" className="stroke-foreground/25" />
        <rect x={LX - 10} y={ENC_TOP} width={EX - LX + 125} height={BOT_IN - ENC_TOP} rx={8} fill={EMBED} fillOpacity={0.07} stroke={EMBED} strokeOpacity={0.35} />
        <text x={LX - 22} y={ENC_TOP - 2} textAnchor="end" className={header}>
          N×
        </text>
        <text x={EX + 108} y={ENC_TOP + 14} textAnchor="end" fill={EMBED} className="font-mono text-[11px]">
          encoder
        </text>
        <rect x={DX - 138} y={DEC_TOP - 8} width={RX - DX + 163} height={BOT_IN - DEC_TOP + 16} rx={10} fill="none" strokeDasharray="3 3" className="stroke-foreground/25" />
        <rect x={DX - 130} y={DEC_TOP} width={RX - DX + 147} height={BOT_IN - DEC_TOP} rx={8} fill={DECODER} fillOpacity={0.07} stroke={DECODER} strokeOpacity={0.35} />
        <text x={RX + 29} y={DEC_TOP - 2} className={header}>
          ×N
        </text>
        <text x={DX - 122} y={DEC_TOP + 14} fill={DECODER} className="font-mono text-[11px]">
          decoder
        </text>

        {/* encoder: the English splits into V, K and Q for self-attention, with a residual round the left */}
        {path(`M${EX},${TOK_TOP} V${ATT1 + 28} ${up(EX, ATT1 + 28)}`, on.encAtt)}
        {path(`M${LX},${SPLIT1} H${EX + 70} M${EX - 70},${SPLIT1} V${ATT1 + 28} ${up(EX - 70, ATT1 + 28)} M${EX + 70},${SPLIT1} V${ATT1 + 28} ${up(EX + 70, ATT1 + 28)}`, on.encAtt)}
        {path(`M${LX},${SPLIT1} V${P1} H${EX - PLUS_R} ${right(EX - PLUS_R, P1)}`, on.encAtt)}
        {letter(EX - 70, SPLIT1 - 13, "V")}
        {letter(EX, SPLIT1 - 13, "K")}
        {letter(EX + 70, SPLIT1 - 13, "Q")}
        {box(EX, ATT1, "Self-Attention", on.encAtt)}
        {path(`M${EX},${ATT1} V${P1 + PLUS_R} ${up(EX, P1 + PLUS_R)}`, on.encAtt)}
        {plus(EX, P1, on.encAtt)}
        {/* then the feed-forward network, with its own residual */}
        {path(`M${EX},${P1 - PLUS_R} V${ATT2 + 28} ${up(EX, ATT2 + 28)}`, on.encFfn)}
        {path(`M${EX},${SPLIT2} H${LX} V${P2} H${EX - PLUS_R} ${right(EX - PLUS_R, P2)}`, on.encFfn)}
        {box(EX, ATT2, "FFNN", on.encFfn)}
        {path(`M${EX},${ATT2} V${P2 + PLUS_R} ${up(EX, P2 + PLUS_R)}`, on.encFfn)}
        {plus(EX, P2, on.encFfn)}
        {/* the encoder's output crosses over to become cross-attention's V and K */}
        {path(
          `M${EX},${P2 - PLUS_R} V${ENC_TURN} H${GAP_X} V${ENC_Y} H${DX - 30} V${ATT2 + 28} ${up(DX - 30, ATT2 + 28)} M${DX - 80},${ENC_Y} V${ATT2 + 28} ${up(DX - 80, ATT2 + 28)}`,
          on.encOut,
        )}
        {letter(DX - 80, ENC_Y - 14, "V")}
        {letter(DX - 30, ENC_Y - 14, "K")}

        {/* decoder: the French so far splits into V, K and Q for masked self-attention, with a residual round the right */}
        {path(`M${DX},${TOK_TOP} V${SPLIT1}`, on.feed || on.mask)}
        {path(`M${DX},${SPLIT1} V${ATT1 + 28} ${up(DX, ATT1 + 28)}`, on.mask)}
        {path(`M${DX - 70},${SPLIT1} H${RX} M${DX - 70},${SPLIT1} V${ATT1 + 28} ${up(DX - 70, ATT1 + 28)} M${DX + 70},${SPLIT1} V${ATT1 + 28} ${up(DX + 70, ATT1 + 28)}`, on.mask)}
        {path(`M${RX},${SPLIT1} V${P1} H${DX + PLUS_R} ${left(DX + PLUS_R, P1)}`, on.mask)}
        {letter(DX - 70, SPLIT1 - 13, "V")}
        {letter(DX, SPLIT1 - 13, "K")}
        {letter(DX + 70, SPLIT1 - 13, "Q")}
        {box(DX, ATT1, "Masked Self-Attention", on.mask)}
        {path(`M${DX},${ATT1} V${P1 + PLUS_R} ${up(DX, P1 + PLUS_R)}`, on.mask)}
        {plus(DX, P1, on.mask)}
        {/* its output becomes cross-attention's Q, with a residual */}
        {path(`M${DX},${P1 - PLUS_R} V${SPLIT2_D} H${RX} M${DX + 70},${SPLIT2_D} V${ATT2 + 28} ${up(DX + 70, ATT2 + 28)}`, on.cross)}
        {path(`M${RX},${SPLIT2_D} V${P2} H${DX + PLUS_R} ${left(DX + PLUS_R, P2)}`, on.cross)}
        {letter(DX + 70, ENC_Y - 14, "Q")}
        {box(DX, ATT2, "Cross-Attention", on.cross)}
        {path(`M${DX},${ATT2} V${P2 + PLUS_R} ${up(DX, P2 + PLUS_R)}`, on.cross)}
        {plus(DX, P2, on.cross)}
        {/* then the feed-forward network, with its own residual */}
        {path(`M${DX},${P2 - PLUS_R} V${FFN_D + 28} ${up(DX, FFN_D + 28)}`, on.decFfn)}
        {path(`M${DX},${SPLIT3} H${RX} V${P3} H${DX + PLUS_R} ${left(DX + PLUS_R, P3)}`, on.decFfn)}
        {box(DX, FFN_D, "FFNN", on.decFfn)}
        {path(`M${DX},${FFN_D} V${P3 + PLUS_R} ${up(DX, P3 + PLUS_R)}`, on.decFfn)}
        {plus(DX, P3, on.decFfn)}

        {/* out of the stack: linear, softmax, a probability per word, and then the winner */}
        {path(`M${DX},${P3 - PLUS_R} V${LIN + 28} ${up(DX, LIN + 28)}`, on.head)}
        {box(DX, LIN, "Linear", on.head)}
        {path(`M${DX},${LIN} V${SMX + 28} ${up(DX, SMX + 28)}`, on.head)}
        {box(DX, SMX, "Softmax", on.head)}
        {path(`M${DX},${SMX} V${BAR_BASE + 2} ${up(DX, BAR_BASE + 2)}`, on.head)}
        <line x1={DX - 125} x2={DX + 125} y1={BAR_BASE} y2={BAR_BASE} className="stroke-foreground/40" />
        {MT_VOCAB.map((w, i) => {
          const x = DX - 110 + (i * 220) / (MT_VOCAB.length - 1)
          const win = predicted === w
          const h = (predicted ? (win ? 1 : MT_NOISE[(i + pass) % MT_NOISE.length]) : 0.04) * BAR_MAX
          return (
            <g key={w}>
              <motion.line
                x1={x}
                x2={x}
                y1={BAR_BASE}
                animate={{ y2: BAR_BASE - h }}
                initial={false}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                stroke={win ? WEIGHT : undefined}
                strokeWidth={win ? 3 : 2}
                className={win ? undefined : "stroke-muted-foreground/60"}
              />
              <motion.circle
                cx={x}
                r={3.5}
                animate={{ cy: BAR_BASE - h }}
                initial={false}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                fill={win ? WEIGHT : undefined}
                className={win ? undefined : "fill-muted-foreground"}
              />
            </g>
          )
        })}
        <text x={DX - 135} y={BAR_BASE - 30} textAnchor="end" className={header}>
          a probability for every
        </text>
        <text x={DX - 135} y={BAR_BASE - 16} textAnchor="end" className={header}>
          word in the vocabulary
        </text>
        {path(`M${DX},${BAR_BASE - BAR_MAX - 8} V${WORD + 22} ${up(DX, WORD + 22)}`, on.pick)}
        <rect
          x={DX - 42}
          y={WORD}
          width={84}
          height={22}
          rx={3}
          fill="none"
          strokeDasharray="3 3"
          stroke={chosen ? WEIGHT : undefined}
          className={chosen ? undefined : "stroke-foreground/30"}
        />
        <text
          x={DX}
          y={WORD + 11}
          dy="0.35em"
          textAnchor="middle"
          fill={chosen ? WEIGHT : undefined}
          className={cn("font-mono text-[12px]", chosen ? "font-semibold" : "fill-muted-foreground")}
        >
          {chosen ?? "?"}
        </text>

        {/* the chosen word fed back in as the decoder's newest input */}
        {path(`M${DX + 42},${WORD + 11} H${FEED_X} V${TOK_C} H${inputEnd + 4} ${left(inputEnd + 4, TOK_C)}`, on.feed && pass > 0)}

        {/* the inputs: the English once, and the French written so far, newest word rising in */}
        {tokens(MT_SRC, EX, MT_SRC.length)}
        {tokens(input, DX, input.length - 1)}
        {bracket(MT_SRC, EX, "original English", EMBED)}
        {bracket(input, DX, "French translation", DECODER)}

        <text x={MT_W / 2} y={MT_CAPTION} textAnchor="middle" className="fill-muted-foreground font-mono text-[12px]">
          {mtCaption(stage, phase, pass)}
        </text>
      </svg>
      {controls}
    </Figure>
  )
}

function mtCaption(stage: number, phase: number, pass: number): ReactNode {
  if (stage === 0) return <>translating "my teddy bear is cute ." into French, one word at a time</>
  if (stage === 1) return <>encoder self-attention: every English word looks at every English word</>
  if (stage === 2) return <>a feed-forward network works on each word; each ⊕ adds back its input</>
  if (stage === 3)
    return (
      <>
        the encoder's output becomes the <tspan fill={KEY}>keys</tspan> and <tspan fill={VALUE}>values</tspan> for
        cross-attention
      </>
    )
  if (phase === 0)
    return pass === 0 ? (
      <>the special [BOS] token is fed to the decoder</>
    ) : (
      <>
        the special [BOS] token and "{MT_OUT.slice(0, pass - 1).map((w) => `${w} `)}
        <tspan fill={WEIGHT}>{MT_OUT[pass - 1]}</tspan>" are fed to the decoder
      </>
    )
  if (phase === 1) return <>masked self-attention: each French word sees only itself and earlier ones</>
  if (phase === 2)
    return (
      <>
        cross-attention: French <tspan fill={QUERY}>queries</tspan> look at the English <tspan fill={KEY}>keys</tspan> and{" "}
        <tspan fill={VALUE}>values</tspan>
      </>
    )
  if (phase === 3) return <>a feed-forward network works on each French word</>
  if (phase === 4)
    return (
      <>
        linear + softmax: a probability for every word; "<tspan fill={WEIGHT}>{MT_OUT[pass]}</tspan>" is the highest
      </>
    )
  return MT_OUT[pass] === "[EOS]" ? (
    <>[EOS] comes out, so the translation is done: "mon nounours est mignon ."</>
  ) : (
    <>
      "<tspan fill={WEIGHT}>{MT_OUT[pass]}</tspan>" comes out
    </>
  )
}

const [Q_, K_, V_] = [texColor(QUERY, "Q"), texColor(KEY, "K"), texColor(VALUE, "V")]

const MASK_FORMULA = [
  `\\text{Masked self-attention} = \\mathrm{softmax} \\Big( \\dfrac{${Q_}${K_}^{\\top}}{\\sqrt{d_k}}`,
  `+ \\underbrace{M}_{${texNote("0 for earlier words,\nminus infinity\nfor later ones")}} \\Big) ${V_}`,
].join(" ")

// Q, K and V written out: the queries from the decoder, the keys and values from the encoder
const CROSS_FORMULA = [
  `\\text{Cross-attention} = \\mathrm{softmax} \\Big( \\dfrac{`,
  `(${texColor(EMBED, "X_{\\text{dec}}")} ${texColor(QUERY, "W_Q")})`,
  `(${texColor(EMBED, "X_{\\text{enc}}")} ${texColor(KEY, "W_K")})^{\\top}`,
  `}{\\sqrt{d_k}} \\Big) \\, ${texColor(EMBED, "X_{\\text{enc}}")} ${texColor(VALUE, "W_V")}`,
].join(" ")

const CODE = `import torch

def attention(x_q, x_kv, W_Q, W_K, W_V, causal=False):
    Q = x_q @ W_Q                            # [m, d_k]: queries from one sequence
    K = x_kv @ W_K                           # [n, d_k]: keys and values from another,
    V = x_kv @ W_V                           # or the same one
    scores = Q @ K.T / K.shape[-1] ** 0.5    # [m, n]: every query against every key
    if causal:
        later = torch.triu(torch.ones_like(scores, dtype=torch.bool), diagonal=1)
        scores = scores.masked_fill(later, float("-inf"))  # no looking ahead
    return scores.softmax(dim=-1) @ V        # [m, d_v]: a weighted mix of values

attention(x, x, W_Q, W_K, W_V)                # self-attention
attention(x, x, W_Q, W_K, W_V, causal=True)   # masked self-attention
attention(x_dec, x_enc, W_Q, W_K, W_V)        # cross-attention`
