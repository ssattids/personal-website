import { useState } from "react"
import { MotionConfig } from "motion/react"
import { BrowserRouter, Route, Routes } from "react-router"

import { CommandPalette } from "@/components/command-palette"
import { SiteHeader } from "@/components/site-header"
import { ThemeProvider } from "@/components/theme-provider"
import { TokenRain } from "@/components/token-rain"
import { Toaster } from "@/components/ui/sonner"
import { Kbd } from "@/components/ui/kbd"
import { ExperiencePage } from "@/pages/experience"
import { HomePage } from "@/pages/home"

export default function App() {
  const [paletteOpen, setPaletteOpen] = useState(false)

  return (
    <ThemeProvider>
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <SiteHeader onOpenPalette={() => setPaletteOpen(true)} />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/experience/:id" element={<ExperiencePage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
          <footer className="p-2 pt-0">
            <div className="dark mx-auto flex flex-col items-center justify-between gap-3 rounded-3xl bg-background px-6 py-8 font-mono text-xs text-muted-foreground sm:flex-row sm:px-10 dark:ring-1 dark:ring-white/10">
              <p>© {new Date().getFullYear()} Salar Satti · built with React + shadcn/ui</p>
              <p className="flex items-center gap-1.5">
                Press <Kbd>⌘K</Kbd> · or try ↑↑↓↓←→←→BA
              </p>
            </div>
          </footer>
          <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
          <TokenRain />
          <Toaster position="bottom-center" />
        </BrowserRouter>
      </MotionConfig>
    </ThemeProvider>
  )
}
