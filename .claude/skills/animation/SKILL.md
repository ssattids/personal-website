---
name: animation
description: Build or change an animated or interactive figure in a note. Use when a note needs a diagram that plays in steps, or one the reader clicks, drags or toggles.
---

A note's figure has to land for a skimmer: the point shows within a second, the endpoints stay still, and only what flows between them moves. Model new figures on `TranslationAnimation` and `AttentionMap` in `src/notes/attention-variants.tsx`.

## Steps

1. Decide which kind it is: **played** (steps through on its own) or **interactive** (waits for the reader). Done when you can name the one thing each step, or each click, shows.
2. Build it inside `Figure` from `@/notes/parts` as an SVG with a `viewBox` and `className="w-full select-none"`. Name every layout number as a constant with a one-line comment. Done when no bare coordinates are left in the JSX.
3. Apply the rules below for its kind. Done when every rule holds.
4. Run `npx tsc -b` and `npm run build`, then open the note in Chrome on `npx vite --port 5199`. Step through every tick, or click every control. Zoom into the edges, the labels and the caption. Done when every step's caption is right, no text is clipped or crowded, and the console has no errors.

## Rules for every figure

- **Colours mean one thing across the page:** query purple, key orange, value blue, weights and winners yellow, embeddings green. Reuse the note's existing colour constants. Never introduce a new hue for an existing idea.
- **Lit and unlit:** what the current step uses is `stroke-foreground`; everything else is `stroke-muted-foreground/40`. Both carry `transition-colors duration-300`.
- **Motion:** new things rise in (`opacity 0, y 8` → `1, 0`) with `ease: [0.16, 1, 0.3, 1]` over 0.4s.
- **Endpoints stay still:** boxes, labels and axes are static; only values, highlights and tokens move.
- **Room for text:** size the `viewBox` for the longest label and caption the figure ever shows, not the first frame.
- **Labels:** a row of inputs gets a thin bracket underneath, with its name below it in the colour of whatever the row feeds.

## Played figures

- Drive them with `useStepLoop(ref, count, step)` from `@/notes/attention`. It plays only while the figure is on screen, holds the finished figure, loops, and returns `controls` (previous, play/pause, next) to render under the SVG.
- One idea per step, with a caption inside the SVG that says what that step does. Colour its key words as the diagram colours them.
- With reduced motion, show the finished state with nothing lit.
- Played figures get no hand hint: the controls already invite the reader.

## Interactive figures

An interactive figure, one that waits for a click, drag or toggle rather than playing on its own, always shows a hand icon and a short, lowercase suggestion saying what to do and what the reader will see:

```tsx
import { Hand } from "lucide-react"

<Figure
  caption={
    <span className="inline-flex items-center gap-1.5 font-mono">
      <Hand className="size-3.5" />
      click a word to make it the query
    </span>
  }
>
```

- If the figure already has a prose caption, put the hint on its own line under the SVG: `<p className="mt-2 flex items-center justify-end gap-1.5 font-mono text-xs text-muted-foreground">`, holding the same `Hand` and text.
- Name the verb the reader uses: "click", "drag" or "pick".
- Open on an interesting selection (`start={…}`), so the figure already teaches something before anyone touches it.
