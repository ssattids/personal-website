import type { ComponentType } from "react"

import { CrossEntropyNote } from "@/notes/cross-entropy-loss"
import { NegativeLogLikelihoodNote } from "@/notes/negative-log-likelihood"

// note bodies by post slug; each one also needs a matching entry in `posts`
export const notes: Record<string, ComponentType> = {
  "cross-entropy-loss": CrossEntropyNote,
  "negative-log-likelihood": NegativeLogLikelihoodNote,
}
