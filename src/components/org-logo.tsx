import { Route } from "lucide-react"

import { cn } from "@/lib/utils"

// Square company / school logo. Falls back to an icon when there isn't one.
// With a `url` it links out to the organization's site.
export function OrgLogo({ src, name, url, className }: { src?: string; name: string; url?: string; className?: string }) {
  const base = "size-10 shrink-0 overflow-hidden rounded-lg border"

  if (!src) {
    return (
      <div className={cn(base, "flex items-center justify-center border-dashed text-muted-foreground", className)} aria-hidden>
        <Route className="size-1/2" />
      </div>
    )
  }

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        aria-label={`${name} website`}
        className={cn(base, "block bg-white transition-opacity hover:opacity-80", className)}
      >
        <img src={src} alt={`${name} logo`} loading="lazy" className="size-full object-cover" />
      </a>
    )
  }

  return <img src={src} alt={`${name} logo`} loading="lazy" className={cn(base, "bg-white object-cover", className)} />
}
