import type { ComponentType } from "react"

import { AttentionNote } from "@/notes/attention"
import { ContrastiveLossNote } from "@/notes/contrastive-loss"
import { CosineDistanceNote } from "@/notes/cosine-distance"
import { CrossEntropyNote } from "@/notes/cross-entropy-loss"
import { EmbeddingsNote } from "@/notes/embeddings"
import { EuclideanDistanceNote } from "@/notes/euclidean-distance"
import { NegativeLogLikelihoodNote } from "@/notes/negative-log-likelihood"
import { SoftmaxNote } from "@/notes/softmax"
import { TripletLossNote } from "@/notes/triplet-loss"

// note bodies by post slug; each one also needs a matching entry in `posts`
export const notes: Record<string, ComponentType> = {
  "attention": AttentionNote,
  "contrastive-loss": ContrastiveLossNote,
  "cosine-distance": CosineDistanceNote,
  "cross-entropy-loss": CrossEntropyNote,
  "embeddings": EmbeddingsNote,
  "euclidean-distance": EuclideanDistanceNote,
  "negative-log-likelihood": NegativeLogLikelihoodNote,
  "softmax": SoftmaxNote,
  "triplet-loss": TripletLossNote,
}
