import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Pill with a status dot: pulsing green while active, plain grey once it's in the past.
export function StatusBadge({ children, active = false, className }: { children: React.ReactNode; active?: boolean; className?: string }) {
  return (
    <Badge variant="outline" className={cn("gap-2 rounded-full bg-background/60 px-3 py-1 backdrop-blur", className)}>
      <span className="relative flex size-2">
        {active && <span className="absolute inline-flex size-full animate-ping rounded-full bg-signal-3 opacity-75" />}
        <span className={cn("relative inline-flex size-2 rounded-full", active ? "bg-signal-3" : "bg-muted-foreground/60")} />
      </span>
      {children}
    </Badge>
  )
}
