const PINS = [0.3, 0.7]

// A static processor chip with pins on both sides, used as the model step in
// the role visuals.
export function Chip({ label }: { label: string }) {
  return (
    <div className="relative flex size-8 shrink-0 items-center justify-center rounded-[5px] border border-muted-foreground/60 font-mono text-[10px] text-muted-foreground">
      {PINS.flatMap((t) =>
        ["-left-[3px]", "-right-[3px]"].map((side) => (
          <span
            key={`${side}${t}`}
            className={`absolute ${side} h-px w-[3px] bg-muted-foreground/60`}
            style={{ top: `${t * 100}%` }}
          />
        ))
      )}
      {label}
    </div>
  )
}
