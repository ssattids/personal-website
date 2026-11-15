import { useEffect } from "react"

import { Contact } from "@/sections/contact"

export function ContactPage() {
  useEffect(() => {
    document.title = "Contact · Salar Satti"
    window.scrollTo({ top: 0, behavior: "instant" })
  }, [])

  return (
    <main>
      <Contact className="min-h-svh" />
    </main>
  )
}
