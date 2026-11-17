import type { ComponentType } from "react"

import { CrossEntropyNote } from "@/notes/cross-entropy-loss"

// note bodies by post slug; each one also needs a matching entry in `posts`
export const notes: Record<string, ComponentType> = {
  "cross-entropy-loss": CrossEntropyNote,
}
