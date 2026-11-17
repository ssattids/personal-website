export const PAGES = [
  { path: "/", label: "About" },
  { path: "/blog", label: "Notes" },
  { path: "/contact", label: "Contact" },
] as const

// sections of the About page, reachable from the command palette
export const SECTIONS = [
  { id: "experience", label: "Experience" },
  { id: "story", label: "Story" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "education", label: "Education" },
] as const

export function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
}

export const TOKEN_RAIN_EVENT = "token-rain"
