import { useId, type ReactNode } from "react"

import { cn } from "@/lib/utils"

const CELL = 70
// grid cells that get the warm gradient fill, as [col, row]
const LIT_CELLS = [
  [5, 0],
  [0, 1],
  [3, 3],
  [7, 7],
  [3, 8],
  [12, 8],
  [16, 2],
  [20, 5],
]

type Backdrop = "grid" | "beam" | "none"

// Black rounded card every section sits in. It always uses the dark tokens,
// so its contents look the same whichever theme the page is in.
export function Panel({
  id,
  backdrop = "grid",
  className,
  innerClassName,
  children,
}: {
  id?: string
  backdrop?: Backdrop
  className?: string
  innerClassName?: string
  children: ReactNode
}) {
  return (
    <section id={id} className={cn("w-full p-2", className)}>
      <div
        className={cn(
          "dark relative isolate h-full w-full overflow-hidden rounded-3xl bg-background text-foreground dark:ring-1 dark:ring-white/10",
          innerClassName,
        )}
      >
        {backdrop === "grid" && <GridBackdrop />}
        {backdrop === "beam" && (
          <>
            <GridBackdrop />
            <TopBeam />
          </>
        )}
        <div className="relative z-10 h-full">{children}</div>
      </div>
    </section>
  )
}

// faint grid with a few lit cells, fading out towards the bottom
export function GridBackdrop({ className }: { className?: string }) {
  // ids must be unique per instance since SVG ids are document-global
  const uid = useId().replace(/:/g, "")

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 h-[min(50%,40rem)] opacity-20 mask-[linear-gradient(to_bottom,transparent_0%,black_50%,transparent_100%)]",
        className,
      )}
    >
      <svg width="100%" height="100%">
        <defs>
          <pattern id={`${uid}-grid`} width={CELL} height={CELL} patternUnits="userSpaceOnUse">
            <rect width={CELL} height={CELL} fill="transparent" stroke="rgba(255,255,255,0.08)" />
          </pattern>
          <linearGradient id={`${uid}-lit`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FA9A63" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#FA9A63" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${uid}-grid)`} />
        {LIT_CELLS.map(([c, r]) => (
          <rect key={`${c}-${r}`} x={c * CELL} y={r * CELL} width={CELL} height={CELL} fill={`url(#${uid}-lit)`} />
        ))}
      </svg>
    </div>
  )
}

// soft warm light falling from the top edge
export function TopBeam({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-x-0 top-0 flex justify-center opacity-40", className)}
    >
      <svg width="1424" height="651" viewBox="0 0 1424 651" fill="none" overflow="visible" className="shrink-0">
        <g style={{ mixBlendMode: "plus-lighter", filter: "blur(300px)" }}>
          <path d="M611.5 51L495 -188H959L849.5 51H611.5Z" fill="#FA9A63" fillOpacity="0.1" />
        </g>
        <g style={{ mixBlendMode: "plus-lighter", filter: "blur(200px)" }}>
          <path d="M611.5 219L495 -188H959L849.5 219H611.5Z" fill="#FFD99F" />
        </g>
        <g style={{ mixBlendMode: "plus-lighter", filter: "blur(80px)" }}>
          <path d="M656.49 43L568 -219H829L768.219 43H656.49Z" fill="#F6B253" fillOpacity="0.8" />
        </g>
      </svg>
    </div>
  )
}
