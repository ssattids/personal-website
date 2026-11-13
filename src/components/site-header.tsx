import { NavLink } from "react-router-dom"
import { House } from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"

const links = [
  { to: "/experience", label: "Experience" },
  { to: "/projects", label: "Projects" },
  { to: "/education", label: "Education" },
  { to: "/blog", label: "Blog" },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-4xl items-center gap-1 px-4">
        <Button asChild variant="ghost" size="icon" aria-label="Home">
          <NavLink to="/">
            <House />
          </NavLink>
        </Button>
        <div className="flex flex-1 items-center gap-1 overflow-x-auto">
          {links.map(({ to, label }) => (
            <NavLink key={to} to={to}>
              {({ isActive }) => (
                <Button asChild variant={isActive ? "secondary" : "ghost"} size="sm">
                  <span>{label}</span>
                </Button>
              )}
            </NavLink>
          ))}
        </div>
        <ThemeToggle />
      </nav>
    </header>
  )
}
