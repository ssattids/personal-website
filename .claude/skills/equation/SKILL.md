---
name: equation
description: Add a hover tooltip naming what a derivative means. Use when a note's prose has a derivative (d/dx, ∂p/∂x, a gradient) or the user asks for an equation tooltip.
---

Every derivative written in a note's prose gets a `Tip` from `@/notes/parts` that reads it aloud in words, so a reader who can't parse the notation can hover it.

## Steps

1. Find each derivative in the note's `<M>` strings: `\tfrac{d}{dx} …`, `\tfrac{\partial y}{\partial x}`, and the like. Done when every one is listed.
2. Split each `<M>` so the derivative is its own `<M>`, and the rest of the equation (`= …`) a second one.
3. Wrap the derivative in `Tip`, worded `gradient of <y> with respect to <x>`, with the symbols as `<M>`.
4. Wrap the `Tip` and the rest of the equation in `<span className="whitespace-nowrap">` so the equation never breaks between them.
5. Import `Tip` from `@/notes/parts`, then run `npx tsc -b`. Done when every derivative is wrapped and it type-checks.

## Shape

Before:

```tsx
For softmax, <M>{"\\tfrac{\\partial p_i}{\\partial x_i} = p_i (1 - p_i)"}</M> is simple to calculate.
```

After:

```tsx
For softmax,{" "}
<span className="whitespace-nowrap">
  <Tip tip={<>gradient of <M>{"p_i"}</M> with respect to <M>{"x_i"}</M></>}>
    <M>{"\\tfrac{\\partial p_i}{\\partial x_i}"}</M>
  </Tip>{" "}
  <M>{"= p_i (1 - p_i)"}</M>
</span>{" "}
is simple to calculate.
```

Punctuation that follows the equation (`,` `.` `:`) goes straight after `</span>` with no space.

## Scope

Tooltips go on derivatives in prose and accordions. Display formulas built from `texColor`/`texNote` strings (`<Formula>`) already carry their annotations as underbraces.
