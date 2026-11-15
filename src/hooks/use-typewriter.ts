import { useEffect, useState } from "react"

// Types each phrase, pauses, deletes it, then moves on to the next one.
export function useTypewriter(phrases: string[], { typeMs = 45, deleteMs = 22, holdMs = 1800 } = {}) {
  const [index, setIndex] = useState(0)
  const [text, setText] = useState("")
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const phrase = phrases[index % phrases.length]

    if (!deleting && text === phrase) {
      const id = setTimeout(() => setDeleting(true), holdMs)
      return () => clearTimeout(id)
    }
    if (deleting && text === "") {
      setDeleting(false)
      setIndex((i) => i + 1)
      return
    }

    const id = setTimeout(
      () => setText(deleting ? phrase.slice(0, text.length - 1) : phrase.slice(0, text.length + 1)),
      deleting ? deleteMs : typeMs,
    )
    return () => clearTimeout(id)
  }, [text, deleting, index, phrases, typeMs, deleteMs, holdMs])

  return text
}
