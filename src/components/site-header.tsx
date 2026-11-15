import { useEffect, useState } from "react"
import { motion, useScroll, useSpring } from "motion/react"
import { Command } from "lucide-react"
import { useLocation } from "react-router"

import { SECTIONS } from "@/lib/sections"
import { useGoToSection } from "@/hooks/use-go-to-section"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"

export function SiteHeader({ onOpenPalette }: { onOpenPalette: () => void }) {
  const [active, setActive] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 200, damping: 40 })
  const { pathname } = useLocation()
  const goToSection = useGoToSection()

  useEffect(() => {
    setActive(null)
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })

    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
      },
      { rootMargin: "-45% 0px -50% 0px" },
    )
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    }
    return () => {
      window.removeEventListener("scroll", onScroll)
      observer.disconnect()
    }
    // sections only exist on the homepage, so re-observe after every page change
  }, [pathname])

  return (
    <>
      <motion.div
        className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-linear-to-r from-signal-1 to-signal-2"
        style={{ scaleX: progress }}
      />
      <header className="dark fixed inset-x-0 top-4 z-40 flex justify-center px-4 text-foreground">
        <nav
          className={cn(
            "flex items-center gap-1 rounded-full border bg-background/70 px-2 py-1.5 backdrop-blur-xl transition-all duration-300",
            scrolled && "shadow-lg shadow-black/40",
          )}
        >
          <a
            href="/#top"
            onClick={(e) => {
              e.preventDefault()
              goToSection("top")
            }}
            className="flex size-8 items-center justify-center rounded-full bg-foreground font-mono text-xs font-bold text-background"
            aria-label="Back to top"
          >
            SS
          </a>
          <ul className="hidden items-center md:flex">
            {SECTIONS.map((s) => (
              <li key={s.id} className="relative">
                <a
                  href={`/#${s.id}`}
                  onClick={(e) => {
                    e.preventDefault()
                    goToSection(s.id)
                  }}
                  className={cn(
                    "relative z-10 block rounded-full px-3 py-1.5 text-sm transition-colors",
                    active === s.id ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {s.label}
                </a>
                {active === s.id && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-full bg-accent"
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}
              </li>
            ))}
          </ul>
          <Button variant="ghost" size="sm" className="gap-1.5 rounded-full text-muted-foreground" onClick={onOpenPalette}>
            <Command className="md:hidden" />
            <span className="hidden md:inline">Search</span>
            <Kbd className="hidden md:inline-flex">⌘K</Kbd>
          </Button>
          <ThemeToggle />
        </nav>
      </header>
    </>
  )
}
