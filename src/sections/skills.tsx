import { useMemo, useState } from "react"
import { motion, useReducedMotion } from "motion/react"

import { skillGroups } from "@/data/content"
import { cn } from "@/lib/utils"
import { Panel } from "@/components/panel"
import { SectionHeading } from "@/components/section-heading"
import { Card } from "@/components/ui/card"

const GROUP_COLORS = [
  "var(--signal-1)",
  "var(--signal-2)",
  "var(--signal-3)",
  "oklch(0.7 0.17 25)",
  "oklch(0.76 0.08 230)",
]

// Layout space (roughly the card's aspect ratio). Positions are converted to % for rendering.
const W = 1000
const H = 620

// Cluster centers, like a 2D t-SNE projection.
const CENTERS = [
  { x: 230, y: 160 },
  { x: 770, y: 150 },
  { x: 500, y: 330 },
  { x: 210, y: 480 },
  { x: 770, y: 470 },
]

type Point = { skill: string; group: number; x: number; y: number }
type Box = Point & { w: number; h: number; title: boolean }

const CHAR_W = 9
const LABEL_H = 40

// Spiral each cluster out from its center, then relax overlapping labels apart.
function layout() {
  let seed = 42
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647

  const boxes: Box[] = skillGroups.flatMap((g, gi) => [
    { skill: g.label.toUpperCase(), group: gi, x: CENTERS[gi].x, y: CENTERS[gi].y - 110, w: g.label.length * CHAR_W + 30, h: LABEL_H, title: true },
    ...g.skills.map((skill, i) => {
      const angle = i * 2.39996 + rand() * 0.6
      const radius = 20 + Math.sqrt(i) * 38
      return {
        skill,
        group: gi,
        x: CENTERS[gi].x + Math.cos(angle) * radius * 1.4,
        y: CENTERS[gi].y + Math.sin(angle) * radius,
        w: skill.length * CHAR_W + 56,
        h: LABEL_H,
        title: false,
      }
    }),
  ])

  for (let iter = 0; iter < 400; iter++) {
    for (let a = 0; a < boxes.length; a++) {
      for (let b = a + 1; b < boxes.length; b++) {
        const A = boxes[a]
        const B = boxes[b]
        const ox = (A.w + B.w) / 2 - Math.abs(A.x - B.x)
        const oy = (A.h + B.h) / 2 - Math.abs(A.y - B.y)
        if (ox <= 0 || oy <= 0) continue
        // cluster titles are pinned; everything else shares the push
        const wa = A.title ? 0 : B.title ? 1 : 0.5
        const wb = 1 - wa
        if (oy < ox) {
          const dir = Math.sign(A.y - B.y || 1)
          A.y += oy * wa * dir
          B.y -= oy * wb * dir
        } else {
          const dir = Math.sign(A.x - B.x || 1)
          A.x += ox * wa * dir
          B.x -= ox * wb * dir
        }
      }
    }
    for (const box of boxes) {
      if (box.title) continue
      const c = CENTERS[box.group]
      box.x += (c.x - box.x) * 0.006
      box.y += (c.y - box.y) * 0.006
      box.x = Math.min(W - box.w / 2 - 8, Math.max(box.w / 2 + 8, box.x))
      box.y = Math.min(H - box.h / 2 - 8, Math.max(box.h / 2 + 8, box.y))
    }
  }

  const toPct = ({ skill, group, x, y }: Box): Point => ({ skill, group, x: (x / W) * 100, y: (y / H) * 100 })
  return {
    points: boxes.filter((b) => !b.title).map(toPct),
    titles: boxes.filter((b) => b.title).map(toPct),
  }
}

export function Skills() {
  const { points, titles } = useMemo(layout, [])
  const [hovered, setHovered] = useState<Point | null>(null)
  const [focusGroup, setFocusGroup] = useState<number | null>(null)
  const reduce = useReducedMotion()

  const neighbors = useMemo(() => {
    if (!hovered) return []
    return points
      .filter((p) => p !== hovered)
      .map((p) => ({ p, d: Math.hypot(((p.x - hovered.x) * W) / 100, ((p.y - hovered.y) * H) / 100) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 3)
  }, [hovered, points])

  return (
    <Panel id="skills">
      <div className="mx-auto max-w-6xl px-6 py-28">
        <SectionHeading
          index="03"
          eyebrow="skills"
          title={
            <>
              My skills, <span className="text-muted-foreground">embedded</span>
            </>
          }
        >
          Every tool I use, projected into two dimensions. Hover a point to see its nearest
          neighbors. Click a cluster to focus it.
        </SectionHeading>

        <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
          <Card className="relative hidden aspect-[1000/620] overflow-hidden bg-grid p-0 sm:block">
            <svg className="pointer-events-none absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {hovered &&
                neighbors.map(({ p }) => (
                  <motion.line
                    key={p.skill}
                    x1={hovered.x}
                    y1={hovered.y}
                    x2={p.x}
                    y2={p.y}
                    stroke={GROUP_COLORS[hovered.group]}
                    strokeWidth={1.5}
                    strokeOpacity={0.7}
                    vectorEffect="non-scaling-stroke"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                ))}
            </svg>

            {titles.map((t) => (
              <span
                key={t.skill}
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 font-mono text-[10px] tracking-widest whitespace-nowrap opacity-50 sm:text-xs"
                style={{ left: `${t.x}%`, top: `${t.y}%`, color: GROUP_COLORS[t.group] }}
              >
                {t.skill}
              </span>
            ))}

            {points.map((p, i) => {
              const dim =
                (focusGroup !== null && focusGroup !== p.group) ||
                (hovered && hovered !== p && !neighbors.some((n) => n.p === p))
              return (
                <motion.button
                  key={p.skill}
                  className={cn(
                    "group absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full px-1.5 py-0.5 transition-opacity duration-300",
                    dim ? "opacity-20" : "opacity-100",
                  )}
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  onMouseEnter={() => setHovered(p)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(p)}
                  onBlur={() => setHovered(null)}
                  onClick={() => setFocusGroup((g) => (g === p.group ? null : p.group))}
                  animate={reduce ? undefined : { y: [0, -3, 0] }}
                  transition={{ duration: 3 + (i % 4), repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
                >
                  <span
                    className="size-2 rounded-full ring-4 ring-transparent transition-all group-hover:ring-current/20"
                    style={{ backgroundColor: GROUP_COLORS[p.group], color: GROUP_COLORS[p.group] }}
                  />
                  <span
                    className={cn(
                      "font-mono text-[10px] whitespace-nowrap sm:text-xs",
                      hovered === p ? "font-semibold text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {p.skill}
                  </span>
                </motion.button>
              )
            })}
          </Card>

          <div className="space-y-4 sm:hidden">
            {skillGroups.map((g, gi) => (
              <div key={g.id}>
                <p className="mb-2 font-mono text-xs tracking-widest uppercase" style={{ color: GROUP_COLORS[gi] }}>
                  {g.label}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {g.skills.map((skill) => (
                    <span key={skill} className="rounded-full border px-2.5 py-1 font-mono text-xs">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden space-y-2 sm:block">
            {skillGroups.map((g, gi) => (
              <button
                key={g.id}
                onClick={() => setFocusGroup((f) => (f === gi ? null : gi))}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                  focusGroup === gi ? "bg-accent" : "hover:bg-accent/50",
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: GROUP_COLORS[gi] }} />
                  {g.label}
                </span>
                <span className="font-mono text-xs text-muted-foreground">{g.skills.length}</span>
              </button>
            ))}
            <Card className="mt-4 gap-1 p-4 font-mono text-xs">
              {hovered ? (
                <>
                  <p className="text-muted-foreground">query</p>
                  <p className="text-sm font-semibold">{hovered.skill}</p>
                  <p className="mt-2 text-muted-foreground">nearest neighbors</p>
                  {neighbors.map(({ p, d }) => (
                    <p key={p.skill} className="flex justify-between">
                      <span>{p.skill}</span>
                      <span className="text-signal-2">{(1 - d / Math.hypot(W, H)).toFixed(2)}</span>
                    </p>
                  ))}
                </>
              ) : (
                <p className="text-muted-foreground">
                  dim=2 · n={points.length} · hover a point to run a similarity search
                </p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </Panel>
  )
}
