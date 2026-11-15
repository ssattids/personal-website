export const SECTIONS = [
  { id: "experience", label: "Experience" },
  { id: "story", label: "Story" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "education", label: "Education" },
  { id: "contact", label: "Contact" },
  { id: "blog", label: "Blog" },
] as const

export function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
}

export const TOKEN_RAIN_EVENT = "token-rain"
