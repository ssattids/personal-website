import type { ReactNode } from "react"
import { ChevronDown } from "lucide-react"
import { Link } from "react-router"

import { cn } from "@/lib/utils"
import { Tex } from "@/components/tex"
import { Card } from "@/components/ui/card"

// building blocks shared by the notes: prose, formulas, and figure controls

export const texColor = (c: string, tex: string) => `\\htmlStyle{color: ${c}}{${tex}}`
// a "\n" in the text stacks it, so a long label doesn't widen a narrow symbol like Σ
export const texNote = (text: string) =>
  `\\htmlStyle{color: var(--muted-foreground); font-family: var(--font-sans)}{\\substack{${text
    .split("\n")
    .map((l) => `\\text{${l}}`)
    .join("\\\\")}}}`

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="mt-16 text-2xl first:mt-0 font-semibold tracking-tight sm:text-3xl">{children}</h2>
}

// spaced-out section with a "§ 01" counter above the title
export function Section({ children }: { children: ReactNode }) {
  return (
    <section
      className={cn(
        "mt-12 [counter-increment:note-sec] first:mt-0 sm:mt-16",
        "[&>h2]:before:mb-3 [&>h2]:before:block [&>h2]:before:font-mono [&>h2]:before:text-xs [&>h2]:before:font-normal [&>h2]:before:tracking-widest [&>h2]:before:text-muted-foreground",
        "[&>h2]:before:[content:'§_'_counter(note-sec,decimal-leading-zero)]",
      )}
    >
      {children}
    </section>
  )
}

export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="mt-4 space-y-3 text-muted-foreground">
      {items.map((t, i) => (
        <li key={i} className="flex gap-3 leading-relaxed">
          <span className="mt-2.5 size-1 shrink-0 rounded-full bg-foreground" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  )
}

export function SubBullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="mt-3 space-y-2">
      {items.map((t, i) => (
        <li key={i} className="flex gap-3 leading-relaxed">
          <span className="mt-2.5 size-1 shrink-0 rounded-full border border-foreground" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  )
}

export function Accordion({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <details className="group rounded-xl border px-4 text-muted-foreground">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3 font-medium text-foreground [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="pb-4">{children}</div>
    </details>
  )
}

export function Components({ items }: { items: ReactNode[] }) {
  return (
    <div className="mt-4">
      <Accordion title="The components">
        <SubBullets items={items} />
      </Accordion>
    </div>
  )
}

export function M({ children }: { children: string }) {
  return <Tex className="text-foreground">{children}</Tex>
}

export function Figure({ caption, children }: { caption?: string; children: ReactNode }) {
  return (
    <figure className="mt-6">
      <Card className="gap-0 p-5 sm:p-6">{children}</Card>
      {caption && <figcaption className="mt-2 text-xs text-muted-foreground">{caption}</figcaption>}
    </figure>
  )
}

export function Formula({ tex }: { tex: string }) {
  return (
    <Figure>
      <Tex display className="text-[0.7rem] sm:text-xl">
        {tex}
      </Tex>
    </Figure>
  )
}

export function Readout({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-lg border bg-muted/40 px-4 py-3 font-mono text-sm">
      {children}
    </div>
  )
}

export function Toggle<T extends number>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string; color: string }[]
}) {
  return (
    <div className="inline-flex rounded-full border bg-muted/40 p-1 font-mono text-xs">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors",
            value === o.value ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <span className="size-2 rounded-full" style={{ background: o.color }} />
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Slider({
  value,
  onChange,
  label,
  min = 0.01,
  max = 0.99,
  step = 0.01,
  format = (v) => v.toFixed(2),
}: {
  value: number
  onChange: (v: number) => void
  label: string
  min?: number
  max?: number
  step?: number
  format?: (v: number) => string
}) {
  return (
    <label className="mt-3 flex items-center gap-4 font-mono text-xs text-muted-foreground">
      <span className="w-24 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--signal-1)]"
      />
      <span className="w-10 text-right text-foreground">{format(value)}</span>
    </label>
  )
}

export function NoteLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="text-foreground underline decoration-muted-foreground/50 underline-offset-4 transition-colors hover:decoration-foreground"
    >
      {children}
    </Link>
  )
}
