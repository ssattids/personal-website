import { useEffect } from "react"
import { motion } from "motion/react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { Link, Navigate, useParams } from "react-router"

import { experience, techLinks } from "@/data/content"
import { OrgLogo } from "@/components/org-logo"
import { Panel } from "@/components/panel"
import { RoleVisual } from "@/components/role-visual"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function ExperiencePage() {
  const { id } = useParams()
  const index = experience.findIndex((r) => r.id === id)
  const role = experience[index]

  useEffect(() => {
    if (!role) return
    document.title = `${role.title} · ${role.company} · Salar Satti`
    window.scrollTo({ top: 0, behavior: "instant" })
  }, [role])

  if (!role) return <Navigate to="/#experience" replace />

  // follow the timeline's newest-first order: previous is the role above, next the one below
  const prev = experience[index - 1]
  const next = experience[index + 1]

  return (
    <main>
      <Panel backdrop="beam" className="min-h-svh">
        <div className="mx-auto max-w-3xl px-6 pt-32 pb-28">
          <Button variant="ghost" size="sm" className="-ml-3 rounded-full text-muted-foreground" asChild>
            <Link to={`/#role-${role.id}`}>
              <ArrowLeft /> All experience
            </Link>
          </Button>

          <motion.div
            key={role.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* the visuals are drawn at a fixed 40px height, so scale them up rather than resizing each one */}
            <div className="mt-10 flex h-24 items-center justify-center sm:h-32">
              <div className="scale-[2] sm:scale-[3]">
                <RoleVisual kind={role.visual} />
              </div>
            </div>
            <OrgLogo src={role.logo} name={role.company} url={role.url} className="mt-10 size-16 rounded-xl" />
            <p className="mt-6 font-mono text-xs tracking-widest text-muted-foreground uppercase">
              {role.period} · {role.duration}
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-6xl">{role.title}</h1>
            <p className="mt-2 text-2xl tracking-[-0.02em] text-muted-foreground">{role.company}</p>
            <p className="mt-6 text-lg text-muted-foreground">
              <LinkedText text={role.summary} />
            </p>

            {role.metrics && (
              <div className="mt-8 flex flex-wrap gap-3">
                {role.metrics.map((m) => (
                  <div key={m.label} className="rounded-lg border bg-muted/40 px-4 py-3">
                    <div className="text-2xl font-medium">{m.value}</div>
                    <div className="font-mono text-[10px] text-muted-foreground uppercase">{m.label}</div>
                  </div>
                ))}
              </div>
            )}

            <h2 className="mt-14 font-mono text-xs tracking-widest text-muted-foreground uppercase">What I did</h2>
            <ul className="mt-4 divide-y border-y">
              {role.points.map((p) => (
                <li key={p} className="flex gap-3 py-4 leading-relaxed">
                  <span className="mt-2.5 size-1 shrink-0 rounded-full bg-foreground" />
                  <span>
                    <LinkedText text={p} />
                  </span>
                </li>
              ))}
            </ul>

            <h2 className="mt-14 font-mono text-xs tracking-widest text-muted-foreground uppercase">Stack</h2>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {role.stack.map((s) => (
                <Badge key={s} variant="secondary" className="font-mono text-[11px]">
                  {s}
                </Badge>
              ))}
            </div>
          </motion.div>

          <nav className="mt-20 grid gap-4 sm:grid-cols-2" aria-label="Other roles">
            {prev ? (
              <Link to={`/experience/${prev.id}`} className="group">
                <Card className="h-full gap-1 p-5 transition-colors group-hover:bg-accent/50">
                  <p className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                    <ArrowLeft className="size-3" /> Previous role
                  </p>
                  <div className="mt-1 flex items-center gap-3">
                    <OrgLogo src={prev.logo} name={prev.company} className="size-8 rounded-md" />
                    <div>
                      <p className="font-medium tracking-[-0.02em]">{prev.title}</p>
                      <p className="text-sm text-muted-foreground">{prev.company}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ) : (
              <div className="hidden sm:block" />
            )}
            {next && (
              <Link to={`/experience/${next.id}`} className="group">
                <Card className="h-full gap-1 p-5 text-right transition-colors group-hover:bg-accent/50">
                  <p className="flex items-center justify-end gap-1.5 font-mono text-xs text-muted-foreground">
                    Next role <ArrowRight className="size-3" />
                  </p>
                  <div className="mt-1 flex items-center justify-end gap-3">
                    <div>
                      <p className="font-medium tracking-[-0.02em]">{next.title}</p>
                      <p className="text-sm text-muted-foreground">{next.company}</p>
                    </div>
                    <OrgLogo src={next.logo} name={next.company} className="size-8 rounded-md" />
                  </div>
                </Card>
              </Link>
            )}
          </nav>
        </div>
      </Panel>
    </main>
  )
}

// longest names first so a longer name wins over one it contains
const techPattern = new RegExp(
  `\\b(${Object.keys(techLinks)
    .sort((a, b) => b.length - a.length)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|")})\\b`,
  "g"
)

// Turns every tool named in `text` into a link to its homepage.
function LinkedText({ text }: { text: string }) {
  // split with a capture group keeps the matches at odd indexes
  return text.split(techPattern).map((part, i) =>
    i % 2 ? (
      <a
        key={i}
        href={techLinks[part]}
        target="_blank"
        rel="noreferrer"
        className="underline decoration-muted-foreground/50 underline-offset-4 transition-colors hover:decoration-foreground"
      >
        {part}
      </a>
    ) : (
      part
    )
  )
}
