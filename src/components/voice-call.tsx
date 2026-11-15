import type { ReactNode } from "react"
import { User } from "lucide-react"

import { cn } from "@/lib/utils"
import { Waveform } from "@/components/waveform"

// A human and an AI agent talking, with the voice waveform between them.
export function VoiceCall() {
  return (
    <div className="flex h-6 items-center gap-1" aria-hidden>
      <Speaker side="left">
        <User className="size-4 text-muted-foreground" strokeWidth={1.5} />
      </Speaker>
      <Waveform className="h-6" bars={24} />
      <Speaker side="right">
        <span className="flex size-4 items-center justify-center rounded-[3px] border border-muted-foreground font-mono text-[7px] leading-none text-muted-foreground">
          AI
        </span>
      </Speaker>
    </div>
  )
}

// A static speaker with a speech bubble whose tail points back at them.
function Speaker({ side, children }: { side: "left" | "right"; children: ReactNode }) {
  return (
    <div className={cn("flex h-full flex-col justify-between", side === "left" ? "items-start" : "items-end")}>
      <span
        className={cn(
          "flex h-2 w-3 flex-col justify-center gap-px rounded-[3px] border border-muted-foreground/60 px-[2px]",
          side === "left" ? "ml-2 rounded-bl-none" : "mr-2 rounded-br-none"
        )}
      >
        <span className="h-px w-full bg-muted-foreground/60" />
        <span className="h-px w-2/3 bg-muted-foreground/60" />
      </span>
      {children}
    </div>
  )
}
