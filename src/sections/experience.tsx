import { useRef } from "react"
import { motion, useScroll, useSpring } from "motion/react"
import { ArrowRight } from "lucide-react"
import { Link, useNavigate } from "react-router"

import { experience, type Role } from "@/data/content"
import { cn } from "@/lib/utils"
import { OrgLogo } from "@/components/org-logo"
import { RollingDigit } from "@/components/rolling-digit"
import { Panel } from "@/components/panel"
import { SectionHeading } from "@/components/section-heading"

// alternate sides per company, so consecutive roles at the same place stay together
const sides: Record<string, "left" | "right"> = {}
experience.reduce((group, role, i) => {
  if (i > 0 && role.company !== experience[i - 1].company) group++
  sides[role.id] = group % 2 === 0 ? "left" : "right"
  return group
}, 0)

export function Experience() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "end 60%"] })
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })

  return (
    <Panel id="experience">
      <div className="mx-auto max-w-5xl px-6 py-28">
        <SectionHeading
          index="01"
          eyebrow="experience"
          align="center"
          title={
            <>
              <RollingDigit value={7} /> years of <span className="text-muted-foreground">shipping AI products</span>
            </>
          }
        />

        <div ref={ref} className="relative">
          <div className="absolute top-0 bottom-0 left-[11px] w-px bg-border sm:left-1/2" />
          <motion.div
            className="absolute top-0 bottom-0 left-[11px] w-px origin-top bg-linear-to-b from-signal-1 to-signal-2 sm:left-1/2"
            style={{ scaleY: progress }}
          />
          <ol className="space-y-12">
            {experience.map((role) => (
              <TimelineItem key={role.id} role={role} side={sides[role.id]} />
            ))}
          </ol>
        </div>
      </div>
    </Panel>
  )
}

function TimelineItem({ role, side }: { role: Role; side: "left" | "right" }) {
  const navigate = useNavigate()
  const isDetour = role.id === "transition"

  return (
    <li id={`role-${role.id}`} className="relative grid sm:grid-cols-2 sm:gap-12">
      <motion.span
        className="absolute top-6 left-0 z-10 flex size-[23px] items-center justify-center rounded-full border border-white/15 bg-neutral-950 sm:left-1/2 sm:-translate-x-1/2"
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, margin: "-120px" }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <span
          className={cn(
            "size-2.5 rounded-full",
            isDetour ? "bg-signal-3" : "bg-signal-1",
          )}
        />
      </motion.span>

      <div className={cn("hidden items-start pt-5 sm:flex", side === "left" ? "order-2" : "justify-end")}>
        <div className={cn("font-mono", side === "right" && "text-right")}>
          <p className="text-sm text-foreground">{role.period}</p>
          <p className="text-xs text-muted-foreground">{role.duration}</p>
        </div>
      </div>

      <motion.div
        className={cn("min-w-0 pl-10 sm:pl-0", side === "left" ? "order-1" : "order-2")}
        initial={{ opacity: 0, x: side === "left" ? -40 : 40 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          className={cn(
            "rounded-2xl border border-white/10 bg-neutral-950 p-5 transition-colors hover:border-white/20",
            isDetour && "border-dashed",
          )}
        >
          <div>
            <p className="mb-4 flex w-fit max-w-full items-center gap-1 rounded-full bg-neutral-900 p-1 sm:gap-2">
              <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-neutral-950 px-2 py-1 text-[10px] sm:text-xs">
                <span className="relative flex size-1.5">
                  {role.current && (
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-signal-1 opacity-75" />
                  )}
                  <span
                    className={cn("relative inline-flex size-1.5 rounded-full", role.current ? "bg-signal-1" : "bg-neutral-600")}
                  />
                </span>
                {role.current && "Now"}
              </span>
              <span className="truncate pr-2 text-[10px] text-neutral-300 sm:text-xs">{role.status}</span>
            </p>
            <p className="mb-2 font-mono text-xs text-muted-foreground sm:hidden">
              {role.period} · {role.duration}
            </p>
            <div className="flex items-center gap-3">
              <OrgLogo src={role.logo} name={role.company} />
              <div>
                <h3 className="text-lg leading-tight font-semibold tracking-tight">{role.title}</h3>
                <p className="text-sm text-signal-1">{role.company}</p>
              </div>
            </div>

            {role.metrics && (
              <div className="mt-4 flex flex-wrap gap-3">
                {role.metrics.map((m) => (
                  <div key={m.label} className="rounded-xl bg-neutral-900 px-3 py-2">
                    <div className="text-xl font-semibold tracking-tight">
                      {m.value}
                    </div>
                    <div className="font-mono text-[10px] text-neutral-500 uppercase">{m.label}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-1.5">
              {role.stack.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-neutral-900 px-2.5 py-0.5 font-mono text-[11px] text-neutral-300"
                >
                  {s}
                </span>
              ))}
            </div>

            <div className="-mx-5 mt-5 flex justify-end border-t border-white/10 px-5 pt-4">
              <Link
                to={`/experience/${role.id}`}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
                  e.preventDefault()
                  // remember this tile so the browser's back button returns to it
                  navigate(`/#role-${role.id}`, { replace: true })
                  navigate(`/experience/${role.id}`)
                }}
                className="group/link inline-flex items-center gap-2 text-sm font-medium tracking-tight text-neutral-300 transition-colors hover:text-white"
              >
                <span className="flex size-5 items-center justify-center rounded-[5px] bg-[#FA9A63] text-black transition-transform duration-300 group-hover/link:translate-x-0.5">
                  <ArrowRight className="size-3" />
                </span>
                Learn more
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </li>
  )
}
