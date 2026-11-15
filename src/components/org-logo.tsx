import { Route } from "lucide-react"

import { cn } from "@/lib/utils"

// Square company / school logo. Falls back to an icon when there isn't one.
export function OrgLogo({ src, name, className }: { src?: string; name: string; className?: string }) {
  const base = "size-10 shrink-0 overflow-hidden rounded-lg border"

  if (!src) {
    return (
      <div className={cn(base, "flex items-center justify-center border-dashed text-muted-foreground", className)} aria-hidden>
        <Route className="size-1/2" />
      </div>
    )
  }

  return <img src={src} alt={`${name} logo`} loading="lazy" className={cn(base, "bg-white object-cover", className)} />
}
