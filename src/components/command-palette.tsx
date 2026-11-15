import { useEffect } from "react"
import { Copy, CornerDownRight, FileText, Mail, Moon, Sparkles } from "lucide-react"
import { useNavigate } from "react-router"

import { PAGES, SECTIONS, TOKEN_RAIN_EVENT } from "@/lib/sections"
import { useGoToSection } from "@/hooks/use-go-to-section"
import { profile } from "@/data/content"
import { useTheme } from "@/components/theme-provider"
import { copyEmail } from "@/sections/contact"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { theme, setTheme } = useTheme()
  const goToSection = useGoToSection()
  const navigate = useNavigate()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onOpenChange])

  const run = (fn: () => void) => () => {
    onOpenChange(false)
    // let the dialog close before scrolling
    setTimeout(fn, 50)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Command palette" description="Jump around or find a hidden feature">
      <Command>
        <CommandInput placeholder="Type a command or search…" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          <CommandGroup heading="Pages">
            {PAGES.map((p) => (
              <CommandItem key={p.path} onSelect={run(() => navigate(p.path))}>
                <FileText />
                {p.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="About">
            {SECTIONS.map((s) => (
              <CommandItem key={s.id} onSelect={run(() => goToSection(s.id))}>
                <CornerDownRight />
                {s.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem onSelect={run(copyEmail)}>
              <Copy />
              Copy email address
            </CommandItem>
            <CommandItem onSelect={run(() => (window.location.href = `mailto:${profile.email}`))}>
              <Mail />
              Send an email
            </CommandItem>
            <CommandItem onSelect={run(() => setTheme(theme === "dark" ? "light" : "dark"))}>
              <Moon />
              Toggle theme
            </CommandItem>
            <CommandItem onSelect={run(() => window.dispatchEvent(new Event(TOKEN_RAIN_EVENT)))}>
              <Sparkles />
              Make it rain tokens
              <CommandShortcut>↑↑↓↓←→←→BA</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
