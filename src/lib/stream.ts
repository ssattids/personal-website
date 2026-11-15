// Shared timing for the role visuals that stream particles from one thing to
// another: each particle crosses its lane once per period, fading in and out
// at the ends.
export const STREAM_PERIOD = 2.4

export function streamTransition(delay: number) {
  const base = { duration: STREAM_PERIOD, repeat: Infinity, ease: "linear" as const, delay }
  return { ...base, opacity: { ...base, times: [0, 0.15, 0.85, 1] } }
}

export const streamOpacity = [0, 1, 1, 0]
