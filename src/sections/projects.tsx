import { useState, type PointerEvent } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "motion/react"

import { projects, type Project } from "@/data/content"
import { cn } from "@/lib/utils"
import { ProjectVisual } from "@/components/project-visual"
import { Panel } from "@/components/panel"
import { SectionHeading } from "@/components/section-heading"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function Projects() {
  return (
    <Panel id="projects">
      <div className="mx-auto max-w-6xl px-6 py-28">
        <SectionHeading
          index="04"
          eyebrow="research & projects"
          title={
            <>
              Before the agents, <span className="text-muted-foreground">there were experiments</span>
            </>
          }
        >
          Satellite traffic segmentation, neural machine translation, OCR at scale, and a
          language model built on a graph database. Hover the cards.
        </SectionHeading>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => (
            <motion.div
              key={p.id}
              className={cn(i === 0 && "lg:col-span-2")}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
            >
              <TiltCard project={p} />
            </motion.div>
          ))}
        </div>
      </div>
    </Panel>
  )
}

function TiltCard({ project }: { project: Project }) {
  const [hover, setHover] = useState(false)
  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)
  const rotateX = useSpring(useTransform(my, [0, 1], [6, -6]), { stiffness: 200, damping: 20 })
  const rotateY = useSpring(useTransform(mx, [0, 1], [-6, 6]), { stiffness: 200, damping: 20 })

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - rect.left) / rect.width)
    my.set((e.clientY - rect.top) / rect.height)
  }

  return (
    <motion.div
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      onPointerMove={onMove}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => {
        setHover(false)
        mx.set(0.5)
        my.set(0.5)
      }}
      className="h-full"
    >
      <Card className="relative h-full overflow-hidden">
        <div className="relative mx-6 h-32 rounded-lg border bg-muted/30 p-3">
          <ProjectVisual kind={project.visual} active={hover} />
        </div>
        <CardHeader className="relative">
          <p className="font-mono text-xs text-muted-foreground">
            {project.whereUrl ? (
              <a
                href={project.whereUrl}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-muted-foreground/50 underline-offset-4 transition-colors hover:decoration-foreground"
              >
                {project.where}
              </a>
            ) : (
              project.where
            )}{" "}
            · {project.when}
          </p>
          <CardTitle className="text-lg">{project.title}</CardTitle>
          <CardDescription className="leading-relaxed">{project.description}</CardDescription>
        </CardHeader>
        <CardContent className="relative mt-auto flex flex-wrap gap-1.5">
          {project.stack.map((s) => (
            <Badge key={s} variant="secondary" className="font-mono text-[11px]">
              {s}
            </Badge>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  )
}
