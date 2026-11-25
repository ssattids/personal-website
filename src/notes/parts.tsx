import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { useInView, useReducedMotion } from "motion/react"
import { ChevronDown } from "lucide-react"
import { Link } from "react-router"

import { cn } from "@/lib/utils"
import { Tex } from "@/components/tex"
import { Card } from "@/components/ui/card"

// building blocks shared by the notes: prose, formulas, and figure controls

export const texColor = (c: string, tex: string) => `\\htmlStyle{color: ${c}}{${tex}}`
// a "\n" in the text stacks it, so a long label doesn't widen a narrow symbol like Σ
export const texNote = (text: string, color = "var(--muted-foreground)") =>
  `\\htmlClass{tex-note}{\\htmlStyle{color: ${color}; font-family: var(--font-sans)}{\\substack{${text
    .split("\n")
    .map((l) => `\\text{${l}}`)
    .join("\\\\")}}}}`

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="mt-16 text-2xl first:mt-0 font-semibold tracking-tight sm:text-3xl">{children}</h2>
}

export function H3({ children }: { children: ReactNode }) {
  return <h3 className="mt-10 text-lg font-semibold tracking-tight sm:text-xl">{children}</h3>
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
          <span className="min-w-0 flex-1">{t}</span>
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
          <span className="min-w-0 flex-1">{t}</span>
        </li>
      ))}
    </ul>
  )
}

export function Accordion({ id, title, children }: { id?: string; title: ReactNode; children: ReactNode }) {
  return (
    <details id={id} className="group scroll-mt-24 rounded-xl border px-4 text-muted-foreground">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3 font-medium text-foreground [&::-webkit-details-marker]:hidden">
        {/* one flex item, so a title made of several pieces of text stays a single run */}
        <span>{title}</span>
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

// a label that pops up above its children on hover or keyboard focus; it starts centred on them and is nudged
// sideways when that would run off the edge of the window
export function Tip({ tip, children }: { tip: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [shift, setShift] = useState(0)
  const place = () => {
    const half = ref.current!.offsetWidth / 2
    const term = ref.current!.parentElement!.getBoundingClientRect()
    const centre = term.left + term.width / 2
    // keep 8px clear of both edges of the window
    const overLeft = 8 - (centre - half)
    const overRight = centre + half - (window.innerWidth - 8)
    setShift(overLeft > 0 ? overLeft : overRight > 0 ? -overRight : 0)
  }
  return (
    <span tabIndex={0} onPointerEnter={place} onFocus={place} className="group/tip relative inline-block cursor-help outline-none">
      {children}
      <span
        ref={ref}
        role="tooltip"
        style={{ transform: `translateX(calc(-50% + ${shift}px))` }}
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 whitespace-nowrap rounded-md border bg-popover px-2 py-1 font-sans text-xs text-popover-foreground opacity-0 shadow-md transition-opacity group-hover/tip:opacity-100 group-focus-visible/tip:opacity-100"
      >
        {tip}
      </span>
    </span>
  )
}

export function Figure({ caption, children }: { caption?: ReactNode; children: ReactNode }) {
  return (
    <figure className="mt-6">
      <Card className="gap-0 p-5 sm:p-6">
        {children}
        {caption && <figcaption className="mt-4 text-right text-xs text-muted-foreground">{caption}</figcaption>}
      </Card>
    </figure>
  )
}

// `animate` keeps the symbols still and plays the annotations in left to right once the formula scrolls into view:
// each underbrace stretches open from its centre, then its label rises in underneath
export function Formula({ tex, animate = false }: { tex: string; animate?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const reduce = useReducedMotion()
  const play = animate && !reduce

  // hide before first paint so the annotations don't flash in and then vanish
  useLayoutEffect(() => {
    if (play) ref.current!.querySelectorAll<HTMLElement>(".katex-stretchy, .tex-note").forEach((p) => (p.style.opacity = "0"))
  }, [play])

  useEffect(() => {
    if (!play || !inView) return
    const el = ref.current!
    const braces = el.querySelectorAll<HTMLElement>(".katex-stretchy")
    const notes = el.querySelectorAll<HTMLElement>(".tex-note")
    const ease = "cubic-bezier(0.16, 1, 0.3, 1)"
    braces.forEach((b, i) => {
      b.style.opacity = ""
      b.animate([{ transform: "scaleX(0)", opacity: 0 }, { transform: "scaleX(1)", opacity: 1 }], {
        duration: 400,
        delay: i * 110,
        easing: ease,
        fill: "backwards",
      })
    })
    notes.forEach((n, i) => {
      n.style.opacity = ""
      n.animate([{ transform: "translateY(6px)", opacity: 0 }, { transform: "none", opacity: 1 }], {
        duration: 400,
        delay: i * 110 + 150,
        easing: ease,
        fill: "backwards",
      })
    })
  }, [play, inView])

  return (
    <Figure>
      <div ref={ref}>
        <Tex display className="text-[0.7rem] sm:text-xl">
          {tex}
        </Tex>
      </div>
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
  className,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string; color: string }[]
  className?: string
}) {
  return (
    <div className={cn("inline-flex rounded-full border bg-muted/40 p-1 font-mono text-xs", className)}>
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
  color = "var(--signal-1)",
}: {
  value: number
  onChange: (v: number) => void
  label: ReactNode
  min?: number
  max?: number
  step?: number
  format?: (v: number) => string
  color?: string
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
        className="w-full"
        style={{ accentColor: color }}
      />
      <span className="w-10 text-right text-foreground">{format(value)}</span>
    </label>
  )
}

// a block of code; everything after a # on a line is drawn as a muted comment
export function Code({ children }: { children: string }) {
  return (
    <pre className="mt-4 overflow-x-auto rounded-lg border bg-muted/40 px-4 py-3 font-mono text-xs leading-relaxed sm:text-sm">
      {children.split("\n").map((line, i) => {
        const at = line.indexOf("#")
        return (
          <div key={i}>
            {at < 0 ? line || " " : line.slice(0, at)}
            {at >= 0 && <span className="text-muted-foreground">{line.slice(at)}</span>}
          </div>
        )
      })}
    </pre>
  )
}

export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-foreground underline decoration-muted-foreground/50 underline-offset-4 transition-colors hover:decoration-foreground"
    >
      {children}
    </a>
  )
}

// a link to an Accordion further down the same note: opens it and scrolls it into view
export function AccordionLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <a
      href={`#${to}`}
      onClick={(e) => {
        e.preventDefault()
        const el = document.getElementById(to)
        if (el instanceof HTMLDetailsElement) el.open = true
        el?.scrollIntoView({ behavior: "smooth", block: "start" })
      }}
      className="underline decoration-muted-foreground/50 underline-offset-4 transition-colors hover:decoration-foreground"
    >
      {children}
    </a>
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
