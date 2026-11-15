import { useCallback } from "react"
import { useLocation, useNavigate } from "react-router"

import { scrollToSection } from "@/lib/sections"

// Scrolls to a homepage section, or goes home first when on another page.
export function useGoToSection() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  return useCallback(
    (id: string) => {
      if (pathname === "/") scrollToSection(id)
      else navigate(`/#${id}`)
    },
    [pathname, navigate],
  )
}
