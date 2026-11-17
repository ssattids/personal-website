import { useEffect } from "react"

import { Blog } from "@/sections/blog"

export function BlogPage() {
  useEffect(() => {
    document.title = "Notes · Salar Satti"
    window.scrollTo({ top: 0, behavior: "instant" })
  }, [])

  return (
    <main>
      <Blog className="min-h-svh" />
    </main>
  )
}
