import { memo, useRef, type ReactNode } from "react"
import { AnimatePresence, motion } from "motion/react"

import { Tex } from "@/components/tex"
import { cn } from "@/lib/utils"
import { useStepLoop } from "@/notes/attention"
import { Accordion, Bullets, Figure, H2, M, Section } from "@/notes/parts"

// embeddings green, as in the attention notes; the feed-forward network teal, as in the attention note. Attention
// purple, the encoder layer yellow and the pooler orange are this note's own; the total is plain white, so it doesn't
// read as one more layer sum
const EMBED = "oklch(0.74 0.15 150)"
const LAYER = "oklch(0.85 0.16 95)"
const ATTN = "oklch(0.7 0.17 300)"
const FFN = "oklch(0.78 0.12 190)"
const NORM = "oklch(0.7 0 0)"
const POOL = "oklch(0.74 0.16 55)"
const TOTAL = "var(--foreground)"

// BERT-base's settings
const VOCAB = 30522
const POSITIONS = 512
const SEGMENTS = 2
const HIDDEN = 768
const HEADS = 12
const HEAD_DIM = HIDDEN / HEADS // 64: the heads split the 768 numbers between them
const FF = 4 * HIDDEN // 3,072
const LAYERS = 12

type Cat = "emb" | "attn" | "ffn" | "norm" | "pool"
const CAT_COLOR: Record<Cat, string> = { emb: EMBED, attn: ATTN, ffn: FFN, norm: NORM, pool: POOL }

// one number in a size, written both as a symbol and as BERT-base's value, so the two columns can't disagree
type Factor = { sym: string; num: string; value: number }
const texNum = (n: number) => n.toLocaleString("en-US").replace(/,/g, "{,}")
const factor = (sym: string, value: number): Factor => ({ sym, num: texNum(value), value })
// factors in brackets, joined by × or ·
const group = (op: string, ...fs: Factor[]): Factor => ({
  sym: `(${fs.map((f) => f.sym).join(op)})`,
  num: `(${fs.map((f) => f.num).join(op)})`,
  value: fs.reduce((p, f) => p * f.value, 1),
})
const TIMES = " \\times "
const D_MODEL = "d_{\\text{model}}"
// the symbols in the key
const F = {
  V: factor("V", VOCAB),
  P: factor("P", POSITIONS),
  S: factor("S", SEGMENTS),
  DM: factor(D_MODEL, HIDDEN),
  H: factor("H", HEADS),
  DQ: factor("d_q", HEAD_DIM),
  DK: factor("d_k", HEAD_DIM),
  DV: factor("d_v", HEAD_DIM),
  FF: factor(`4${D_MODEL}`, FF),
  TWO: factor("2", 2),
  THREE: factor("3", 3),
}

// a weight matrix or bias vector, and the factors that multiply to its number of parameters. `oneHead`, for the
// attention heads' own weights, is the size counted first, for one head, before the heads are introduced
type Tensor = { sym: string; factors: Factor[]; oneHead?: Factor[] }
const size = (fs: Factor[]) => fs.reduce((p, f) => p * f.value, 1)
const symbols = (fs: Factor[]) => fs.map((f) => f.sym).join(TIMES)
const numbers = (fs: Factor[]) => fs.map((f) => f.num).join(TIMES)
// one of a head's own matrices or biases: sized for one head, then for all H
const perHead = (sym: string, ...one: Factor[]): Tensor => ({
  sym,
  oneHead: one,
  factors: [F.H, one.length > 1 ? group(TIMES, ...one) : one[0]],
})

// every box in the diagram, with the weights inside it, in the order the figure counts them
type Part = { id: string; cat: Cat; tensors: Tensor[] }
const PARTS: Part[] = [
  { id: "tok", cat: "emb", tensors: [{ sym: "E_{\\text{tok}}", factors: [F.V, F.DM] }] },
  { id: "pos", cat: "emb", tensors: [{ sym: "E_{\\text{pos}}", factors: [F.P, F.DM] }] },
  { id: "seg", cat: "emb", tensors: [{ sym: "E_{\\text{seg}}", factors: [F.S, F.DM] }] },
  { id: "embNorm", cat: "norm", tensors: [{ sym: "\\gamma, \\beta", factors: [F.TWO, F.DM] }] },
  // each head has its own query, key and value matrices, each turning a token's d_model numbers into d_q, d_k or d_v,
  // and a bias for each
  {
    id: "qkv",
    cat: "attn",
    tensors: [
      perHead("W_Q", F.DM, F.DQ),
      perHead("b_Q", F.DQ),
      perHead("W_K", F.DM, F.DK),
      perHead("b_K", F.DK),
      perHead("W_V", F.DM, F.DV),
      perHead("b_V", F.DV),
    ],
  },
  // the heads' outputs, each a value-sized d_v numbers, joined end to end are H · d_v = d_model numbers long
  {
    id: "out",
    cat: "attn",
    tensors: [
      { sym: "W_O", factors: [group(" \\cdot ", F.H, F.DV), F.DM] },
      { sym: "b_O", factors: [F.DM] },
    ],
  },
  { id: "norm1", cat: "norm", tensors: [{ sym: "\\gamma_1, \\beta_1", factors: [F.TWO, F.DM] }] },
  {
    id: "up",
    cat: "ffn",
    tensors: [
      { sym: "W_1", factors: [F.DM, F.FF] },
      { sym: "b_1", factors: [F.FF] },
    ],
  },
  {
    id: "down",
    cat: "ffn",
    tensors: [
      { sym: "W_2", factors: [F.FF, F.DM] },
      { sym: "b_2", factors: [F.DM] },
    ],
  },
  { id: "norm2", cat: "norm", tensors: [{ sym: "\\gamma_2, \\beta_2", factors: [F.TWO, F.DM] }] },
  {
    id: "pool",
    cat: "pool",
    tensors: [
      { sym: "W_{\\text{pool}}", factors: [F.DM, F.DM] },
      { sym: "b_{\\text{pool}}", factors: [F.DM] },
    ],
  },
]
const part = (id: string) => PARTS.find((p) => p.id === id)!
const partSize = (p: Part) => p.tensors.reduce((s, t) => s + size(t.factors), 0)
const EMB_IDS = ["tok", "pos", "seg", "embNorm"]
const LAYER_IDS = ["qkv", "out", "norm1", "up", "down", "norm2"]
const total = (ids: string[]) => ids.reduce((s, id) => s + partSize(part(id)), 0)
const EMB_TOTAL = total(EMB_IDS)
const LAYER_TOTAL = total(LAYER_IDS)
const ALL_LAYERS = [factor("L", LAYERS), factor("\\text{layer}", LAYER_TOTAL)]
const TOTAL_COUNT = EMB_TOTAL + size(ALL_LAYERS) + partSize(part("pool"))

// one tick per box, subtotal or total, and one where the heads multiply Q, K and V. `lit` names what the diagram lights
type Sum = { kind: "sum"; id: string; label: string; factors?: Factor[]; count: number; color: string; lit: string[] }
type Step = { kind: "part"; id: string } | { kind: "heads"; id: string } | Sum
const STEPS: Step[] = [
  ...EMB_IDS.map((id): Step => ({ kind: "part", id })),
  { kind: "sum", id: "embTotal", label: "embeddings total", count: EMB_TOTAL, color: EMBED, lit: [...EMB_IDS, "embGroup"] },
  // Q, K and V for one head, then for all of them
  ...LAYER_IDS.flatMap((id): Step[] => (id === "qkv" ? [{ kind: "part", id }, { kind: "heads", id: "heads" }] : [{ kind: "part", id }])),
  {
    kind: "sum",
    id: "layerTotal",
    label: "one layer total",
    count: LAYER_TOTAL,
    color: LAYER,
    lit: [...LAYER_IDS, "heads", "layerGroup"],
  },
  {
    kind: "sum",
    id: "layers",
    label: "12 layers",
    factors: ALL_LAYERS,
    count: size(ALL_LAYERS),
    color: LAYER,
    lit: [...LAYER_IDS, "heads", "layerGroup", "encoders"],
  },
  { kind: "part", id: "pool" },
  {
    kind: "sum",
    id: "total",
    label: "total",
    count: TOTAL_COUNT,
    color: TOTAL,
    lit: [...EMB_IDS, ...LAYER_IDS, "heads", "pool", "embGroup", "layerGroup", "encoders"],
  },
]
const STEP_SECONDS = 2
const tickOf = (id: string) => STEPS.findIndex((s) => s.id === id) + 1
// the tick the heads are counted on: from here Q, K and V are sized for all 12, and stacked as cards
const HEADS_TICK = tickOf("heads")
// the tick attention out is counted on: from here its box is thick with the heads' outputs
const OUT_TICK = tickOf("out")
// the tick the 12 layers are counted on: from here each layer's weights count 12 times in the bar, and the diagram
// shows the 12 one after another
const LAYERS_TICK = tickOf("layers")
const litBy = (s: Step) => (s.kind === "part" ? [s.id] : s.kind === "heads" ? ["qkv", "heads"] : s.lit)
// a tensor's factors on a tick: one head's until the heads are counted
const factorsAt = (t: Tensor, tick: number) => (t.oneHead && tick < HEADS_TICK ? t.oneHead : t.factors)
// the parameters a tick counts: a box's weights, the heads' Q, K and V, or a sum
const countAt = (tick: number) => {
  const s = STEPS[tick - 1]
  if (s.kind === "sum") return s.count
  return part(s.kind === "heads" ? "qkv" : s.id).tensors.reduce((n, t) => n + size(factorsAt(t, tick)), 0)
}

// the table's rows, top down: a header over each group, then each tick's weights or sum. `tick` is when a row appears
type Row =
  | { kind: "header"; tick: number; text: string; color: string }
  | { kind: "tensor"; tick: number; cat: Cat; tensor: Tensor }
  | { kind: "sum"; tick: number; sum: Sum }
const HEADERS: Record<string, [string, string]> = {
  tok: ["embeddings", EMBED],
  qkv: ["encoder layer", LAYER],
  pool: ["pooler", POOL],
}
const ROWS: Row[] = STEPS.flatMap((s, i): Row[] => {
  const tick = i + 1
  if (s.kind === "sum") return [{ kind: "sum", tick, sum: s }]
  // the heads add no rows: they resize the Q, K and V rows above
  if (s.kind === "heads") return []
  const p = part(s.id)
  const header = HEADERS[s.id]
  return [
    ...(header ? [{ kind: "header" as const, tick, text: header[0], color: header[1] }] : []),
    ...p.tensors.map((tensor) => ({ kind: "tensor" as const, tick, cat: p.cat, tensor })),
  ]
})

// a shape a box takes in or gives out, as factors so its symbols and numbers can't disagree, and what it holds
type Shape = [factors: Factor[], what: ReactNode]
// a count bullet is a lead-in and the expression for its tick's count. Every one ends "resulting in {expression} =
// {total} parameters.", the total being what the tick counts in the table, so the two can't disagree
type Count = [lead: ReactNode, expression: string]
type CaptionText = { why: ReactNode; input?: Shape; output?: Shape; count?: Count }
// what the embeddings, and so BERT as a whole, take in
const IDS: Shape = [
  [F.P, F.THREE],
  <>
    <M>{"P"}</M> token ids, <M>{"P"}</M> position ids and <M>{"P"}</M> segment ids for each token
  </>,
]
// what each tick says, under the figure: where its count comes from, then, behind "Learn more", why its weights are
// there, with the shapes its box takes in and gives out. The opening, before anything is counted, has only the why
const CAPTION_TEXT: CaptionText[] = [
  {
    why: "Each box in the diagram holds weights and biases, numbers BERT learns in training. The table counts them box by box.",
  },
  {
    why: "For each token in the sequence we look up its embedding or vector from a lookup table.",
    input: [[F.P], "one token id for each position"],
    output: [[F.P, F.DM], "the looked-up vector for each token"],
    count: [
      <>
        There is a vector of size <M>{`${D_MODEL} = 768`}</M> for each token in our vocabulary of size{" "}
        <M>{"V = 30{,}522"}</M>
      </>,
      "30{,}522 \\times 768",
    ],
  },
  {
    why: "Attention on its own doesn't see word order, so the position embeddings give each place in the input a learned vector too.",
    input: [[F.P], "the position of each token, picking its row"],
    output: [[F.P, F.DM], "a position vector for each token"],
    count: [
      <>
        There is a vector of size <M>{`${D_MODEL} = 768`}</M> for each of the <M>{"P = 512"}</M> positions, the longest
        input BERT can read
      </>,
      "512 \\times 768",
    ],
  },
  {
    why: "BERT is often given two sentences at once, like a question and a passage, so the segment embeddings mark which one each token is in.",
    input: [[F.P], <>the segment of each token, A or B, picking one of the <M>{"S = 2"}</M> rows</>],
    output: [[F.P, F.DM], "a segment vector for each token"],
    count: [
      <>
        There is a vector of size <M>{`${D_MODEL} = 768`}</M> for each of the <M>{"S = 2"}</M> segments, sentence A and
        sentence B
      </>,
      "2 \\times 768",
    ],
  },
  {
    why: "A token's three rows are added into one vector, and LayerNorm rescales it to mean 0 and variance 1, which keeps training stable.",
    input: [
      [F.P, F.DM],
      <>
        the maximum input sequence size of <M>{"P"}</M>, with each token of size <M>{D_MODEL}</M> being the sum of its
        token lookup, position, and segment embeddings
      </>,
    ],
    output: [[F.P, F.DM], "since it is a layer normalization and dimensions don't change"],
    count: [
      <>
        There is a learned scale <M>{"\\gamma"}</M> and shift <M>{"\\beta"}</M> for each of the{" "}
        <M>{`${D_MODEL} = 768`}</M> numbers
      </>,
      "2 \\times 768",
    ],
  },
  {
    why: (
      <>
        The embeddings hand the encoder one vector of <M>{`${D_MODEL} = 768`}</M> numbers per token: what it is{" "}
        (<M>{"E_{\\text{tok}}"}</M>), where it sits (<M>{"E_{\\text{pos}}"}</M>), and which sentence it's in{" "}
        (<M>{"E_{\\text{seg}}"}</M>).
      </>
    ),
    input: IDS,
    output: [[F.P, F.DM], "one vector per token for the first encoder layer"],
    count: [
      "We add up the four embedding boxes, the token table alone being 98% of them",
      "23{,}440{,}896 + 393{,}216 + 1{,}536 + 1{,}536",
    ],
  },
  {
    why: "Attention lets tokens share information: each head gives every token a query to search with, a key to be found by and a value to pass on.",
    input: [[F.P, F.DM], "the vector of each token coming into the layer"],
    output: [[F.P, F.DQ], "one each for the head's queries, keys and values"],
    count: [
      <>
        For one head, each of <M>{"W_Q, W_K, W_V"}</M> maps <M>{`${D_MODEL} = 768`}</M> numbers to{" "}
        <M>{"d_q = d_k = d_v = 64"}</M> and has a 64-number bias
      </>,
      "3 \\times (768 \\times 64 + 64)",
    ],
  },
  {
    why: (
      <>
        With <M>{"H = 12"}</M> heads, each with its own <M>{"W_Q, W_K, W_V"}</M>, a token can look for 12 different
        things at once, like the next word or a verb's object.
      </>
    ),
    input: [[F.P, F.DM], "the same for every head"],
    output: [[F.H, F.P, F.DQ], "one each for the queries, keys and values"],
    count: [
      <>
        Each of the <M>{"H = 12"}</M> heads, only <M>{`${D_MODEL} / H = 64`}</M> wide, has its own{" "}
        <M>{"W_Q, W_K, W_V"}</M>
      </>,
      "12 \\times 147{,}648",
    ],
  },
  {
    why: "The 12 heads each work alone, so attention out mixes their outputs together, letting what one found combine with what the others found.",
    input: [[F.P, group(" \\cdot ", F.H, F.DV)], "the 12 heads' outputs for each token, joined end to end"],
    output: [[F.P, F.DM], "one mixed vector per token"],
    count: [
      <>
        The 12 heads' outputs of <M>{"d_v = 64"}</M> numbers join into <M>{"H \\cdot d_v = 768"}</M>, which{" "}
        <M>{"W_O"}</M> maps to <M>{`${D_MODEL} = 768`}</M> with a 768-number bias
      </>,
      "768 \\times 768 + 768",
    ],
  },
  {
    why: "The residual add puts attention's output on top of each token's vector, so the layer refines it rather than replacing it. LayerNorm then rescales the sum.",
    input: [[F.P, F.DM], "attention's output added to the layer's input, which has the same shape"],
    output: [[F.P, F.DM], "since it is a layer normalization and dimensions don't change"],
    count: [
      <>
        The add has no weights, and the LayerNorm has its own <M>{"\\gamma_1"}</M> and <M>{"\\beta_1"}</M> for each of
        the <M>{`${D_MODEL} = 768`}</M> numbers
      </>,
      "2 \\times 768",
    ],
  },
  {
    why: "Attention shares information between tokens; the feed-forward network then works on each token alone, first widening it to make room for many features.",
    input: [[F.P, F.DM], "each token's vector after attention"],
    output: [[F.P, F.FF], "each token widened four times"],
    count: [
      <>
        <M>{"W_1"}</M> maps each token's <M>{`${D_MODEL} = 768`}</M> numbers to <M>{`4${D_MODEL} = 3{,}072`}</M>, with
        a 3,072-number bias
      </>,
      "768 \\times 3{,}072 + 3{,}072",
    ],
  },
  {
    why: "After a GELU, feed-forward down brings each token back to 768 numbers, so it can be added onto the token's vector.",
    input: [[F.P, F.FF], "the widened tokens after the GELU"],
    output: [[F.P, F.DM], "each token narrowed back, so it can be added onto its input"],
    count: [
      <>
        <M>{"W_2"}</M> maps the <M>{`4${D_MODEL} = 3{,}072`}</M> numbers back to <M>{`${D_MODEL} = 768`}</M>, with a
        768-number bias
      </>,
      "3{,}072 \\times 768 + 768",
    ],
  },
  {
    why: "As after attention, the feed-forward output is added onto each token's vector, and LayerNorm rescales the sum for the next layer.",
    input: [[F.P, F.DM], "the feed-forward output added to its input"],
    output: [[F.P, F.DM], "since it is a layer normalization and dimensions don't change"],
    count: [
      <>
        Again the add has no weights, and this LayerNorm has its own <M>{"\\gamma_2"}</M> and <M>{"\\beta_2"}</M> for
        each of the <M>{`${D_MODEL} = 768`}</M> numbers
      </>,
      "2 \\times 768",
    ],
  },
  {
    why: "That's one encoder layer: attention shares information between tokens, the feed-forward network works on each token, and an add & LayerNorm follows both.",
    input: [[F.P, F.DM], "one vector per token"],
    output: [[F.P, F.DM], "the same shape it takes in, which is what lets the layers stack"],
    count: [
      "Attention makes up a third of the layer, the feed-forward network two thirds and the two LayerNorms almost nothing",
      "2{,}362{,}368 + 4{,}722{,}432 + 3{,}072",
    ],
  },
  {
    why: (
      <>
        One layer can only do so much, so BERT stacks <M>{"L = 12"}</M> layers, each building on what the one below it
        found.
      </>
    ),
    input: [[F.P, F.DM], "from the embeddings"],
    output: [[F.P, F.DM], "each token's final vector, shaped by the whole input"],
    count: [<>Each of the <M>{"L = 12"}</M> layers has its own weights</>, "12 \\times 7{,}087{,}872"],
  },
  {
    why: "Tasks about the whole input, like classifying a review, need one vector for it; the pooler makes it from the final [CLS] token.",
    input: [[F.DM], "the final vector of the [CLS] token"],
    output: [[F.DM], "one vector standing for the whole input"],
    count: [
      <>
        <M>{"W_{\\text{pool}}"}</M> maps the [CLS] token's <M>{`${D_MODEL} = 768`}</M> numbers to 768, with a
        768-number bias
      </>,
      "768 \\times 768 + 768",
    ],
  },
  {
    why: "Every one of these numbers is learned: first in pre-training, mostly by predicting masked-out words, then adjusted again when BERT is fine-tuned for a task.",
    input: IDS,
    output: [[F.P, F.DM], <>a vector for each token, plus one of <M>{`${D_MODEL} = 768`}</M> from the pooler</>],
    count: [
      "We add up the embeddings, the 12 layers and the pooler, the layers being 78% of it",
      "23{,}837{,}184 + 85{,}054{,}464 + 590{,}592",
    ],
  },
]
// a shape bullet: "Input dimensionality: {symbols} = {numbers}, {what}."
const dimensions = (label: string, [factors, what]: Shape) => (
  <>
    {label} dimensionality: <M>{`${symbols(factors)} = ${numbers(factors)}`}</M>, {what}.
  </>
)
// each tick's count bullet and background bullets. The opening has nothing to count, so its why stands in for the
// count, and the figure never opens on an empty caption
const CAPTIONS = CAPTION_TEXT.map(({ why, input, output, count }, tick): { count: ReactNode; background: ReactNode[] } => {
  if (!count) return { count: why, background: [] }
  const [lead, expression] = count
  return {
    count: (
      <>
        {lead}, resulting in <M>{`${expression} = ${texNum(countAt(tick))}`}</M> parameters.
      </>
    ),
    background: [why, input && dimensions("Input", input), output && dimensions("Output", output)].filter(Boolean),
  }
})

// what each symbol stands for, under the figure, in the order the figure brings them in, and what in the diagram uses
// it, so the key can fade the symbols a step doesn't use
type KeyRow = [string, ReactNode, string[]]
const SIZES: KeyRow[] = [
  [`V = ${texNum(VOCAB)}`, "tokens in the vocabulary", ["tok"]],
  [`${D_MODEL} = ${texNum(HIDDEN)}`, "numbers in each token's vector, the hidden size", PARTS.map((p) => p.id)],
  [`P = ${texNum(POSITIONS)}`, "positions, the longest input in tokens", ["pos"]],
  [`S = ${texNum(SEGMENTS)}`, "segments, sentence A and sentence B", ["seg"]],
  [
    `d_q = d_k = d_v = ${texNum(HEAD_DIM)}`,
    <>
      numbers in each head's query, key and value vectors, so the 12 heads' outputs join back into 768{" "}
      <span className="whitespace-nowrap">
        (each is <M>{`${D_MODEL} / H`}</M>)
      </span>
    </>,
    ["qkv", "out"],
  ],
  // lit by the heads rather than by Q, K and V's box, which is counted for one head before H comes in
  [`H = ${texNum(HEADS)}`, "number of attention heads", ["heads", "out"]],
  [`4${D_MODEL} = ${texNum(FF)}`, "the feed-forward network's width", ["up", "down"]],
  [`L = ${texNum(LAYERS)}`, "encoder layers", ["encoders"]],
]
const WEIGHTS: KeyRow[] = [
  ["E_{\\text{tok}}", "the token embeddings, one row for each token in the vocabulary", ["tok"]],
  ["E_{\\text{pos}}", "the position embeddings, one row for each position in the input", ["pos"]],
  ["E_{\\text{seg}}", "the segment embeddings, one row for sentence A and one for sentence B", ["seg"]],
  ["\\gamma, \\beta", "a LayerNorm's scale and shift", ["embNorm", "norm1", "norm2"]],
  ["W, b", "a weight matrix and a bias vector", ["qkv", "out", "up", "down", "pool"]],
  ["W_Q, W_K, W_V", "make each head's queries, keys and values", ["qkv"]],
  ["W_O", "mixes the heads' outputs back together", ["out"]],
  ["W_1, W_2", "the feed-forward network's two layers", ["up", "down"]],
]

const fmt = (n: number) => n.toLocaleString("en-US")
// where each cell of the table sits: four columns when there's room, otherwise two lines per row, the weights and
// their count on the first, their size in symbols and in numbers on the second
const CELL = {
  name: "col-start-1 row-start-1",
  size: "col-start-1 row-start-2 md:col-start-2 md:row-start-1",
  nums: "col-start-2 row-start-2 md:col-start-3 md:row-start-1",
  count: "col-start-2 row-start-1 text-right tabular-nums md:col-start-4",
}
// the rows' side padding, tighter on phones so the table fits a 360px screen; the running total shares it to line up
const PAD_X = "px-1 md:px-1.5"
const EASE = [0.16, 1, 0.3, 1] as const
const RISE = 8 // how far below its place a row waits before it rises in
// the table re-renders on every tick; its formulas never change, so skip re-typesetting them
const TexMemo = memo(Tex)

export function BertParametersNote() {
  return (
    <>
      <Section>
        <H2>Background</H2>
        <Bullets
          items={["BERT-base has about 110 million parameters: let us visualize where all these parameters come from."]}
        />
      </Section>

      <Section>
        <H2>Visually counting the parameters</H2>
        <ParameterCount />
      </Section>
    </>
  )
}

function ParameterCount() {
  const ref = useRef<HTMLDivElement>(null)
  const { shown, reduce, controls } = useStepLoop(ref, STEPS.length, STEP_SECONDS, { prevWraps: true })
  // the tick on show; with reduced motion the finished count, nothing lit
  const tick = reduce ? STEPS.length : Math.min(shown, STEPS.length)
  const live = !reduce && shown <= STEPS.length
  const lit = new Set(live && tick > 0 ? litBy(STEPS[tick - 1]) : [])

  // the running total, split by kind: Q, K and V count for one head until the heads are counted, and a layer's
  // weights count once until the 12 layers are counted, then 12 times
  const bar = (Object.keys(CAT_COLOR) as Cat[]).map((cat) => ({
    cat,
    count: STEPS.slice(0, tick).reduce((s, st) => {
      if (st.kind !== "part" || part(st.id).cat !== cat) return s
      const now = part(st.id).tensors.reduce((n, t) => n + size(factorsAt(t, tick)), 0)
      return s + now * (LAYER_IDS.includes(st.id) && tick >= LAYERS_TICK ? LAYERS : 1)
    }, 0),
  }))
  const running = bar.reduce((s, b) => s + b.count, 0)

  return (
    <Figure>
      {/* side by side, the diagram gives up width before the table has to scroll */}
      <div ref={ref} className="grid gap-6 md:grid-cols-[minmax(10rem,16rem)_minmax(min-content,1fr)] md:gap-5">
        <Diagram lit={lit} heads={tick >= HEADS_TICK} thick={tick >= OUT_TICK} layers={tick >= LAYERS_TICK} />
        <div className="min-w-0">
          <Ledger tick={tick} live={live} />
          <div className={cn("mt-1", PAD_X)}>
            <div className="flex h-2.5 overflow-hidden rounded-sm bg-muted">
              {bar.map((b) => (
                <div
                  key={b.cat}
                  className="h-full transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{ width: `${(b.count / TOTAL_COUNT) * 100}%`, background: CAT_COLOR[b.cat] }}
                />
              ))}
            </div>
            <div className="mt-1.5 flex justify-between font-mono text-[11px]">
              <span className="text-muted-foreground">running total</span>
              <span className="tabular-nums">
                {fmt(running)} / {fmt(TOTAL_COUNT)}
              </span>
            </div>
          </div>
        </div>
      </div>
      <Caption tick={tick} />
      {controls}
      <Key lit={lit} />
    </Figure>
  )
}

// every weight matrix and bias, its size in symbols and in numbers, and its parameters; rows appear tick by tick but
// keep their space from the start, so the figure never changes height
function Ledger({ tick, live }: { tick: number; live: boolean }) {
  // scrolls sideways only on the narrowest phones; the rows still to come sit RISE low, so the bottom padding holds
  // them and the table never scrolls up and down
  return (
    <div className="overflow-x-auto overflow-y-hidden" style={{ paddingBottom: RISE }}>
      <div className="grid w-full min-w-max grid-cols-[auto_1fr] gap-x-2 font-mono text-[11px] md:grid-cols-[auto_auto_auto_1fr] md:gap-x-3 [&_.katex]:text-[1.1em]">
        <div className={cn("col-span-2 grid grid-cols-subgrid pb-1 text-[10px] text-muted-foreground md:col-span-4", PAD_X)}>
          <span className={CELL.name}>weights</span>
          <span className={CELL.size}>param size expression</span>
          <span className={CELL.nums}>in numbers</span>
          <span className={CELL.count}>total parameters</span>
        </div>
        {ROWS.map((r, i) => {
          const on = r.tick <= tick
          // a row is current on its own tick; Q, K and V's rows again when the heads resize them
          const current = r.tick === tick || (tick === HEADS_TICK && r.kind === "tensor" && !!r.tensor.oneHead)
          return (
            <motion.div
              key={i}
              initial={false}
              animate={{ opacity: on ? 1 : 0, y: on ? 0 : RISE }}
              transition={{ duration: on ? 0.4 : 0.2, ease: EASE }}
              className={cn(
                "relative col-span-2 grid grid-cols-subgrid items-baseline rounded-md py-[2px] transition-colors duration-300 md:col-span-4",
                PAD_X,
                live && current && r.kind !== "header" && "bg-muted",
                r.kind === "header" && "mt-1",
                // subtotals and the total sit under a rule
                r.kind === "sum" &&
                  !r.sum.factors &&
                  "mt-1 before:absolute before:inset-x-1 before:-top-[2px] before:border-t before:border-foreground/20 md:before:inset-x-1.5",
              )}
            >
              <RowCells row={r} tick={tick} live={live} />
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function RowCells({ row, tick, live }: { row: Row; tick: number; live: boolean }) {
  if (row.kind === "header")
    return (
      <span className="col-span-2 md:col-span-4" style={{ color: row.color }}>
        {row.text}
      </span>
    )
  // the formulas are wrapped in spans, since Tex's own span can't take the cell's placement
  const formulas = (factors: Factor[]) => (
    <>
      <span className={CELL.size}>
        <TexMemo className="text-muted-foreground">{symbols(factors)}</TexMemo>
      </span>
      <span className={CELL.nums}>
        <TexMemo className="text-muted-foreground">{numbers(factors)}</TexMemo>
      </span>
    </>
  )
  if (row.kind === "tensor") {
    const { sym, factors, oneHead } = row.tensor
    const now = factorsAt(row.tensor, tick)
    return (
      <>
        <span className={cn(CELL.name, "flex items-center gap-1.5")}>
          <span className="size-1.5 shrink-0 rounded-full" style={{ background: CAT_COLOR[row.cat] }} />
          <TexMemo className="text-foreground">{sym}</TexMemo>
        </span>
        {oneHead ? (
          <>
            <Resized cell={CELL.size} tex={symbols(now)} full={symbols(factors)} live={live} />
            <Resized cell={CELL.nums} tex={numbers(now)} full={numbers(factors)} live={live} />
          </>
        ) : (
          formulas(factors)
        )}
        <span className={CELL.count}>
          {oneHead ? (
            <Rise key={size(now)} live={live}>
              {fmt(size(now))}
            </Rise>
          ) : (
            fmt(size(factors))
          )}
        </span>
      </>
    )
  }
  const { label, factors, count, color } = row.sum
  return (
    <>
      <span className={cn(CELL.name, "font-semibold", !factors && "md:col-span-3")} style={{ color }}>
        {label}
      </span>
      {factors && formulas(factors)}
      <span className={cn(CELL.count, "font-semibold")} style={{ color }}>
        {fmt(count)}
      </span>
    </>
  )
}

// a value that rises in each time it changes, as Q, K and V's do when the heads are counted
function Rise({ live, className, children }: { live: boolean; className?: string; children: ReactNode }) {
  return (
    <motion.span
      className={cn("inline-block", className)}
      initial={live ? { opacity: 0, y: RISE } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      {children}
    </motion.span>
  )
}

// a formula that grows when the heads are counted: the one for this tick rises in over a hidden copy of the full one,
// which holds the column at its widest so nothing beside it moves
function Resized({ cell, tex, full, live }: { cell: string; tex: string; full: string; live: boolean }) {
  return (
    <span className={cn(cell, "grid")}>
      <TexMemo className="invisible col-start-1 row-start-1">{full}</TexMemo>
      <Rise key={tex} live={live} className="col-start-1 row-start-1">
        <TexMemo className="text-muted-foreground">{tex}</TexMemo>
      </Rise>
    </span>
  )
}

// the count shows, and the background waits behind "Learn more", which stays open or shut from one tick to the next
function Caption({ tick }: { tick: number }) {
  // every tick's bullets in the one cell, all but this tick's hidden, so the cell is always as tall as the longest and
  // the controls under the caption never move
  const stack = (bullets: ReactNode[][]) => (
    <div className="grid">
      {bullets.map((items, i) => (
        <ul key={i} className={cn("col-start-1 row-start-1 space-y-0.5", i !== tick && "invisible")}>
          {items.map((b, k) => (
            <li key={k} className="flex gap-2.5 leading-relaxed">
              <span className="mt-2 size-1 shrink-0 rounded-full bg-foreground" />
              <span className="min-w-0 flex-1 text-pretty">{b}</span>
            </li>
          ))}
        </ul>
      ))}
    </div>
  )
  return (
    <div className="mt-4 space-y-1 text-xs text-muted-foreground [&_.katex]:text-[1.1em]">
      <p className="font-medium text-foreground">Parameter count explanation:</p>
      {stack(CAPTIONS.map((c) => [c.count]))}
      {/* a tick with no background, the opening, hides "Learn more" but keeps its room, so the controls stay put */}
      <div className={cn("pt-2", CAPTIONS[tick].background.length === 0 && "invisible")}>
        <Accordion title="Learn more">{stack(CAPTIONS.map((c) => c.background))}</Accordion>
      </div>
    </div>
  )
}

// while a step is on show, the symbols it doesn't use fade; with nothing lit, before the first step and once the count
// is done, every symbol shows
function Key({ lit }: { lit: Set<string> }) {
  // each list under a heading set like the caption's
  const list = (heading: string, items: KeyRow[]) => (
    <div>
      <p className="font-medium text-foreground">{heading}</p>
      <ul className="mt-1 space-y-1 text-pretty">
        {items.map(([sym, meaning, usedBy]) => {
          const faded = lit.size > 0 && !usedBy.some((id) => lit.has(id))
          return (
            <li key={sym} className={cn("transition-opacity duration-300", faded && "opacity-40")}>
              <M>{sym}</M>
              <span className="text-muted-foreground">: {meaning}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
  return (
    <div className="mt-5 grid gap-x-8 gap-y-4 border-t pt-4 text-xs sm:grid-cols-2 [&_.katex]:text-[1.1em]">
      {list("Weights notation:", WEIGHTS)}
      {list("Parameter size notation:", SIZES)}
    </div>
  )
}

// the diagram's viewBox units, drawn bottom up around the centre line DX
const DW = 248
const DH = 546
const DX = 119
const MINI_W = 58 // the three embedding tables, and Q, K, V, side by side
const MINI_GAP = 14 // room for the heads' cards stacked behind Q, K and V
const BOX_W = 3 * MINI_W + 2 * MINI_GAP // a full-width box
const GROUP_W = BOX_W + 28 // the embeddings and encoder-layer outlines
const BOX_H = 24
const NORM_H = 22 // the LayerNorm boxes, a little slimmer
const OUT_H = 36 // the attention-out box once it takes in every head's output
const CARDS = 3 // the cards stacked behind each of Q, K and V once the heads are counted
const CARD_D = 3 // how far each card is offset
const POOL_Y = 6 // top edges, top down
const LAYER_TOP = 52
const LAYER_LABEL = 67
const NORM2_Y = 80
const DOWN_Y = 116
const UP_Y = 154
const NORM1_Y = 192
const OUT_C = 246 // the attention-out box's centre, which stays put as it thickens
const QKV_Y = 282
const QKV_FORK = 314 // where the line up from the embeddings splits for Q, K and V
const HEADS_LABEL = 328 // under the fork
const LAYER_BOTTOM = 334
// the 12 layers, each collapsed to a box, one after another in the height the one drawn out takes
const ENC_GAP = 6 // the wire from one layer up into the next
const ENC_H = (LAYER_BOTTOM - LAYER_TOP - (LAYERS - 1) * ENC_GAP) / LAYERS
const EMB_TOP = 360
const EMB_LABEL = 375
const EMB_NORM_Y = 386
const TABLES_Y = 440
const TABLES_FORK = 471 // where the line up from the input tokens splits for the token and segment tables
const EMB_BOTTOM = 478
const TOK_C = 502 // the input tokens' centre

const INPUT = ["[CLS]", "my", "dog", "[SEP]"]

function Diagram({ lit, heads, thick, layers }: { lit: Set<string>; heads: boolean; thick: boolean; layers: boolean }) {
  const wire = (on: boolean) => cn("transition-colors duration-300", on ? "stroke-foreground" : "stroke-muted-foreground/40")
  const move = { duration: 0.4, ease: EASE }
  const box = (id: string, cx: number, y: number, w: number, h: number, label: string, font = "text-[11px]") => {
    const on = lit.has(id)
    // the top edge and height animate, so a box can thicken in place
    const shape = { x: cx - w / 2, width: w, rx: 5, initial: false, animate: { attrY: y, height: h }, transition: move } as const
    return (
      <g>
        <motion.rect {...shape} className={cn(wire(on), "fill-card")} />
        <motion.rect
          {...shape}
          fill={CAT_COLOR[part(id).cat]}
          className="transition-opacity duration-300"
          opacity={on ? 0.3 : 0.08}
        />
        <text x={cx} y={y + h / 2} dy="0.35em" textAnchor="middle" className={cn("fill-foreground font-mono", font)}>
          {label}
        </text>
      </g>
    )
  }
  // three boxes side by side, centred on DX
  const miniX = (i: number) => DX + (i - 1) * (MINI_W + MINI_GAP)
  // the other heads' cards behind a Q, K or V box: tucked out of sight behind it, then fanned up and to the right
  // once the heads are counted
  const cards = (cx: number) =>
    Array.from({ length: CARDS }, (_, j) => CARDS - j).map((k) => (
      <motion.g key={k} initial={false} animate={{ x: heads ? k * CARD_D : 0, y: heads ? -k * CARD_D : 0 }} transition={move}>
        <rect x={cx - MINI_W / 2} y={QKV_Y} width={MINI_W} height={BOX_H} rx={5} className={cn(wire(lit.has("heads")), "fill-card")} />
        <rect
          x={cx - MINI_W / 2}
          y={QKV_Y}
          width={MINI_W}
          height={BOX_H}
          rx={5}
          fill={ATTN}
          className="transition-opacity duration-300"
          opacity={lit.has("heads") ? 0.3 : 0.08}
        />
      </motion.g>
    ))
  const outH = thick ? OUT_H : BOX_H
  // the top edge of layer i's box, counting up from the first, which sits on the embeddings
  const encY = (i: number) => LAYER_BOTTOM - ENC_H - i * (ENC_H + ENC_GAP)
  // the encoder layer's outline, drawn out, or collapsed into the first of the 12 once they're counted
  const layerShape = {
    x: DX - GROUP_W / 2,
    width: GROUP_W,
    rx: 8,
    initial: false,
    animate: { attrY: layers ? encY(0) : LAYER_TOP, height: layers ? ENC_H : LAYER_BOTTOM - LAYER_TOP },
    transition: { ...move, delay: layers ? 0 : 0.1 },
  } as const
  // the routes into each box, each drawn up from where its input comes from. Dashes march along the routes into what
  // the step lights, so a sum's run into all it adds up; once the 12 layers are boxes, the routes inside one go with it
  const straight = (x: number, from: number, to: number) => `M${x},${from} V${to}`
  // from the middle of the input tokens, up the spine and along the fork under the tables, into table i
  const table = (i: number) => `M${DX},${TOK_C - 11} V${TABLES_FORK} H${miniX(i)} V${TABLES_Y + BOX_H}`
  const routes: Record<string, string[]> = {
    tok: [table(0)],
    pos: [table(1)],
    seg: [table(2)],
    embNorm: [0, 1, 2].map((i) => straight(miniX(i), TABLES_Y, EMB_NORM_Y + BOX_H)),
    // from the embeddings, up the spine and along the fork under Q, K and V
    qkv: [0, 1, 2].map((i) => `M${DX},${EMB_NORM_Y} V${QKV_FORK} H${miniX(i)} V${QKV_Y + BOX_H}`),
    out: [0, 1, 2].map((i) => straight(miniX(i), QKV_Y, OUT_C + outH / 2)),
    norm1: [straight(DX, OUT_C - outH / 2, NORM1_Y + NORM_H)],
    up: [straight(DX, NORM1_Y, UP_Y + BOX_H)],
    down: [straight(DX, UP_Y, DOWN_Y + BOX_H)],
    norm2: [straight(DX, DOWN_Y, NORM2_Y + NORM_H)],
    // from the embeddings up through all 12 layers
    encoders: [straight(DX, EMB_NORM_Y, encY(LAYERS - 1) + ENC_H)],
    pool: [straight(DX, encY(LAYERS - 1), POOL_Y + BOX_H)],
  }
  const flows = [...lit].filter((id) => !(layers && LAYER_IDS.includes(id))).flatMap((id) => routes[id] ?? [])
  const tokens = layoutTokens(INPUT, DX)
  const [x0, x1] = [tokens[0].x, tokens.at(-1)!.x + tokens.at(-1)!.width]

  return (
    <svg viewBox={`0 0 ${DW} ${DH}`} className="mx-auto w-full max-w-64 select-none md:max-w-none md:self-center">
      {/* the spine the data flows up, behind every box */}
      <path d={`M${DX},${TOK_C - 11} V${POOL_Y + BOX_H}`} strokeWidth={1.5} className={wire(false)} />

      {box("pool", DX, POOL_Y, BOX_W, BOX_H, "pooler ([CLS])")}

      {/* the encoder layer on a red ground, as the embeddings are on a green one */}
      <motion.rect {...layerShape} className={cn(wire(lit.has("layerGroup")), "fill-card")} />
      <motion.rect {...layerShape} fill={LAYER} opacity={0.06} />
      <path d={`M${DX},${LAYER_BOTTOM} V${POOL_Y + BOX_H}`} strokeWidth={1.5} className={wire(false)} />
      <motion.g initial={false} animate={{ opacity: layers ? 0 : 1 }} transition={{ duration: 0.2, delay: layers ? 0 : 0.3 }}>
        <text x={DX - GROUP_W / 2 + 8} y={LAYER_LABEL} fill={LAYER} className="font-mono text-[11px]">
          encoder
        </text>
        {box("norm2", DX, NORM2_Y, BOX_W, NORM_H, "add & LayerNorm")}
        {box("down", DX, DOWN_Y, BOX_W, BOX_H, "feed-forward down")}
        {box("up", DX, UP_Y, BOX_W, BOX_H, "feed-forward up")}
        {box("norm1", DX, NORM1_Y, BOX_W, NORM_H, "add & LayerNorm")}
        {/* attention out thickens once every head's output is joined in it */}
        {box("out", DX, OUT_C - outH / 2, BOX_W, outH, "attention out")}
        {/* the spine feeds K; this fork off it feeds Q and V, so each of the three gets the embeddings' output */}
        <path
          d={`M${miniX(0)},${QKV_Y + BOX_H} V${QKV_FORK} H${miniX(2)} V${QKV_Y + BOX_H}`}
          fill="none"
          strokeWidth={1.5}
          className={wire(false)}
        />
        {[0, 1, 2].map((i) => (
          <g key={i}>{cards(miniX(i))}</g>
        ))}
        {box("qkv", miniX(0), QKV_Y, MINI_W, BOX_H, "Q")}
        {box("qkv", miniX(1), QKV_Y, MINI_W, BOX_H, "K")}
        {box("qkv", miniX(2), QKV_Y, MINI_W, BOX_H, "V")}
        <text
          x={DX + GROUP_W / 2 - 8}
          y={HEADS_LABEL}
          textAnchor="end"
          fill={ATTN}
          className="font-mono text-[11px] transition-opacity duration-300"
          opacity={heads ? 1 : 0}
        >
          12 heads
        </text>
      </motion.g>

      {/* the embeddings: three tables added together, then a LayerNorm */}
      <rect
        x={DX - GROUP_W / 2}
        y={EMB_TOP}
        width={GROUP_W}
        height={EMB_BOTTOM - EMB_TOP}
        rx={8}
        className={cn(wire(lit.has("embGroup")), "fill-card")}
      />
      <rect x={DX - GROUP_W / 2} y={EMB_TOP} width={GROUP_W} height={EMB_BOTTOM - EMB_TOP} rx={8} fill={EMBED} opacity={0.06} />
      <text x={DX - GROUP_W / 2 + 8} y={EMB_LABEL} fill={EMBED} className="font-mono text-[11px]">
        embeddings
      </text>
      <path d={`M${DX},${EMB_BOTTOM} V${EMB_NORM_Y}`} strokeWidth={1.5} className={wire(false)} />
      {[0, 2].map((i) => (
        <path key={i} d={`M${miniX(i)},${TABLES_Y} V${EMB_NORM_Y + BOX_H}`} strokeWidth={1.5} className={wire(false)} />
      ))}
      {/* the spine feeds the position table; this fork off it feeds the token and segment tables */}
      <path
        d={`M${miniX(0)},${TABLES_Y + BOX_H} V${TABLES_FORK} H${miniX(2)} V${TABLES_Y + BOX_H}`}
        fill="none"
        strokeWidth={1.5}
        className={wire(false)}
      />

      {/* dashes march up the routes into what the step counts */}
      <AnimatePresence>
        {flows.map((d) => (
          <motion.path
            key={d}
            d={d}
            fill="none"
            strokeWidth={1.5}
            strokeDasharray="4 6"
            className="stroke-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, strokeDashoffset: [20, 0] }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 0.3 }, strokeDashoffset: { duration: 0.8, ease: "linear", repeat: Infinity } }}
          />
        ))}
      </AnimatePresence>

      {/* the 12 layers one after another, each one's output the next one's input. They're drawn over the dashes, which
          show between them */}
      {Array.from({ length: LAYERS }, (_, i) => (
        <motion.g
          key={i}
          initial={false}
          animate={{ opacity: layers ? 1 : 0, y: layers ? 0 : RISE }}
          transition={{ duration: 0.3, ease: EASE, delay: layers ? 0.35 + i * 0.07 : 0 }}
        >
          <rect x={DX - GROUP_W / 2} y={encY(i)} width={GROUP_W} height={ENC_H} rx={6} className={cn(wire(lit.has("encoders")), "fill-card")} />
          <rect
            x={DX - GROUP_W / 2}
            y={encY(i)}
            width={GROUP_W}
            height={ENC_H}
            rx={6}
            fill={LAYER}
            className="transition-opacity duration-300"
            opacity={lit.has("encoders") ? 0.3 : 0.08}
          />
          <text x={DX} y={encY(i) + ENC_H / 2} dy="0.35em" textAnchor="middle" className="fill-foreground font-mono text-[10px]">
            encoder {i + 1}
          </text>
        </motion.g>
      ))}

      {box("embNorm", DX, EMB_NORM_Y, BOX_W, BOX_H, "LayerNorm")}
      {box("tok", miniX(0), TABLES_Y, MINI_W, BOX_H, "token", "text-[10px]")}
      {box("pos", miniX(1), TABLES_Y, MINI_W, BOX_H, "position", "text-[10px]")}
      {box("seg", miniX(2), TABLES_Y, MINI_W, BOX_H, "segment", "text-[10px]")}

      {/* the input, bracketed and named in the colour of what it feeds */}
      {tokens.map((t) => (
        <g key={t.x}>
          <rect x={t.x} y={TOK_C - 11} width={t.width} height={22} rx={3} fill="none" strokeDasharray="3 3" className="stroke-foreground/30" />
          <text x={t.x + t.width / 2} y={TOK_C} dy="0.35em" textAnchor="middle" className="fill-foreground font-mono text-[11px]">
            {t.w}
          </text>
        </g>
      ))}
      <path d={`M${x0},${TOK_C + 16} v5 H${x1} v-5`} fill="none" stroke={EMBED} strokeOpacity={0.5} />
      <text x={DX} y={TOK_C + 36} textAnchor="middle" fill={EMBED} className="font-mono text-[11px]">
        input tokens
      </text>
    </svg>
  )
}

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
