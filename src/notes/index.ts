import type { ComponentType } from "react"

import { ContrastiveLossNote } from "@/notes/contrastive-loss"
import { CrossEntropyNote } from "@/notes/cross-entropy-loss"
import { EmbeddingsNote } from "@/notes/embeddings"
import { NegativeLogLikelihoodNote } from "@/notes/negative-log-likelihood"
import { TripletLossNote } from "@/notes/triplet-loss"

// note bodies by post slug; each one also needs a matching entry in `posts`
export const notes: Record<string, ComponentType> = {
  "contrastive-loss": ContrastiveLossNote,
  "cross-entropy-loss": CrossEntropyNote,
  "embeddings": EmbeddingsNote,
  "negative-log-likelihood": NegativeLogLikelihoodNote,
  "triplet-loss": TripletLossNote,
}
