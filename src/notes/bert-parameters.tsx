import { memo, useRef, type ReactNode } from "react"
import { motion } from "motion/react"

import { Tex } from "@/components/tex"
import { cn } from "@/lib/utils"
import { useStepLoop } from "@/notes/attention"
import { Bullets, Figure, H2, M, NoteLink, Section } from "@/notes/parts"

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

const C = ({ c, children }: { c: string; children: ReactNode }) => <span style={{ color: c }}>{children}</span>
// d_model in the captions' plain text
const DModel = () => (
  <>
    d<sub>model</sub>
  </>
)

// what each tick says, under the figure
const CAPTIONS: ReactNode[] = [
  <>
    BERT-base (L = 12, <DModel /> = 768, H = 12): count every weight matrix and bias
  </>,
  <>
    token embeddings: a row of <DModel /> = 768 numbers for each of the V = 30,522 tokens
  </>,
  <>position embeddings: a row for each of the P = 512 positions</>,
  <>segment embeddings: a row for sentence A and a row for sentence B</>,
  <>
    LayerNorm: a scale γ and a shift β for each of the <DModel /> = 768 numbers
  </>,
  <>
    the <C c={EMBED}>embeddings</C>: 23.8 million, almost all of it the token table
  </>,
  <>Q, K and V: one attention head has its own 768 × 64 matrices and 64-number biases</>,
  <>
    <C c={ATTN}>H = 12 heads</C>, each with its own Q, K and V: 12 times as many parameters
  </>,
  <>attention out: the 12 heads' 64 numbers are joined back into 768, then mixed together</>,
  <>add & LayerNorm: the residual add has no weights; the norm has its own γ and β</>,
  <>
    feed-forward up: W₁ widens each token from 768 to 4<DModel /> = 3,072 numbers
  </>,
  <>feed-forward down: W₂ narrows it from 3,072 back to 768</>,
  <>add & LayerNorm: one more γ and β</>,
  <>
    one layer: 7.1 million, two thirds of it the <C c={FFN}>feed-forward network</C>
  </>,
  <>L = 12 layers, each with its own weights: 85 million</>,
  <>
    pooler: one <DModel /> × <DModel /> layer on the [CLS] token, for sentence-level tasks
  </>,
  <>
    total: <C c={TOTAL}>109,482,240</C>, about 110 million
  </>,
]

// what each symbol stands for, under the figure, in the order the figure brings them in
const SIZES: [string, ReactNode][] = [
  [`V = ${texNum(VOCAB)}`, "tokens in the vocabulary"],
  [`${D_MODEL} = ${texNum(HIDDEN)}`, "numbers in each token's vector, the hidden size"],
  [`P = ${texNum(POSITIONS)}`, "positions, the longest input in tokens"],
  [`S = ${texNum(SEGMENTS)}`, "segments, sentence A and sentence B"],
  [
    `d_q = d_k = d_v = ${texNum(HEAD_DIM)}`,
    <>
      numbers in each head's query, key and value vectors, so the 12 heads' outputs join back into 768{" "}
      <span className="whitespace-nowrap">
        (each is <M>{`${D_MODEL} / H`}</M>)
      </span>
    </>,
  ],
  [`H = ${texNum(HEADS)}`, "number of attention heads"],
  [`4${D_MODEL} = ${texNum(FF)}`, "the feed-forward network's width"],
  [`L = ${texNum(LAYERS)}`, "encoder layers"],
]
const WEIGHTS: [string, string][] = [
  ["E", "an embedding table, one row per token, position or segment"],
  ["\\gamma, \\beta", "a LayerNorm's scale and shift"],
  ["W, b", "a weight matrix and a bias vector"],
  ["W_Q, W_K, W_V", "make each head's queries, keys and values"],
  ["W_O", "mixes the heads' outputs back together"],
  ["W_1, W_2", "the feed-forward network's two layers"],
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
          items={[
            "BERT-base has about 110 million parameters: the weights and biases it learns in training.",
            <>
              It's an embedding table, then 12 identical encoder layers of{" "}
              <NoteLink to="/notes/attention">self-attention</NoteLink> and a feed-forward network, then a small pooler.
            </>,
            <>
              Three numbers describe it: <M>{"L = 12"}</M> layers, <M>{`${D_MODEL} = 768`}</M> numbers per token, and{" "}
              <M>{"H = 12"}</M> attention heads. Those, plus the vocabulary, the input length and the two segments, set the
              size of every matrix.
            </>,
          ]}
        />
      </Section>

      <Section>
        <H2>Counting the parameters</H2>
        <ParameterCount />
      </Section>
    </>
  )
}

function ParameterCount() {
  const ref = useRef<HTMLDivElement>(null)
  const { shown, reduce, controls } = useStepLoop(ref, STEPS.length, STEP_SECONDS)
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
      <p className="mt-4 min-h-8 text-center font-mono text-xs text-muted-foreground">{CAPTIONS[tick]}</p>
      {controls}
      <Key />
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
          <span className={CELL.size}>size</span>
          <span className={CELL.nums}>in numbers</span>
          <span className={CELL.count}>parameters</span>
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

function Key() {
  const list = (items: [string, ReactNode][]) => (
    <ul className="space-y-1 text-pretty">
      {items.map(([sym, meaning]) => (
        <li key={sym}>
          <M>{sym}</M>
          <span className="text-muted-foreground">: {meaning}</span>
        </li>
      ))}
    </ul>
  )
  return (
    <div className="mt-5 grid gap-x-8 gap-y-4 border-t pt-4 text-xs sm:grid-cols-2 [&_.katex]:text-[1.1em]">
      {list(SIZES)}
      {list(WEIGHTS)}
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
const HEADS_LABEL = 322
const LAYER_BOTTOM = 334
// the 12 layers, each collapsed to a box, one after another in the height the one drawn out takes
const ENC_GAP = 6 // the wire from one layer up into the next
const ENC_H = (LAYER_BOTTOM - LAYER_TOP - (LAYERS - 1) * ENC_GAP) / LAYERS
const EMB_TOP = 360
const EMB_LABEL = 375
const EMB_NORM_Y = 386
const TABLES_Y = 440
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
      <path d={`M${DX},${LAYER_BOTTOM} V${POOL_Y + BOX_H}`} strokeWidth={1.5} className={wire(lit.has("encoders"))} />
      <motion.g initial={false} animate={{ opacity: layers ? 0 : 1 }} transition={{ duration: 0.2, delay: layers ? 0 : 0.3 }}>
        <text x={DX - GROUP_W / 2 + 8} y={LAYER_LABEL} fill={LAYER} className="font-mono text-[11px]">
          encoder layer
        </text>
        <text x={DX + GROUP_W / 2 - 8} y={LAYER_LABEL} textAnchor="end" fill={LAYER} className="font-mono text-[11px]">
          ×12
        </text>
        {box("norm2", DX, NORM2_Y, BOX_W, NORM_H, "add & LayerNorm")}
        {box("down", DX, DOWN_Y, BOX_W, BOX_H, "feed-forward down")}
        {box("up", DX, UP_Y, BOX_W, BOX_H, "feed-forward up")}
        {box("norm1", DX, NORM1_Y, BOX_W, NORM_H, "add & LayerNorm")}
        {/* attention out thickens once every head's output is joined in it */}
        {box("out", DX, OUT_C - outH / 2, BOX_W, outH, "attention out")}
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

      {/* the 12 layers one after another, each one's output the next one's input */}
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
