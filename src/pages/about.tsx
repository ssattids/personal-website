import { useEffect } from "react"
import { useLocation } from "react-router"

import { Education } from "@/sections/education"
import { Experience } from "@/sections/experience"
import { Hero } from "@/sections/hero"
import { Projects } from "@/sections/projects"
import { Skills } from "@/sections/skills"
import { Stats } from "@/sections/stats"
import { TrainingRun } from "@/sections/training-run"

export function AboutPage() {
  const { hash } = useLocation()

  // arriving from another page with a #section: jump straight to it
  useEffect(() => {
    document.title = "Salar Satti · Data Scientist"
    const el = hash && document.getElementById(hash.slice(1))
    if (el) el.scrollIntoView({ behavior: "instant", block: "start" })
    else window.scrollTo({ top: 0, behavior: "instant" })
    // only on mount: in-page navigation scrolls on its own
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main>
      <Hero />
      <Stats />
      <Experience />
      <TrainingRun />
      <Skills />
      <Projects />
      <Education />
    </main>
  )
}
