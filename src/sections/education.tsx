import { motion } from "motion/react"
import { GraduationCap } from "lucide-react"

import { education } from "@/data/content"
import { OrgLogo } from "@/components/org-logo"
import { Panel } from "@/components/panel"
import { SectionHeading } from "@/components/section-heading"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

export function Education() {
  return (
    <Panel id="education">
      <div className="mx-auto max-w-5xl px-6 py-28">
        <SectionHeading
          index="05"
          eyebrow="education"
          title={
            <>
              Pre-training <span className="text-muted-foreground">data</span>
            </>
          }
        />

        <div className="grid gap-6 md:grid-cols-2">
          {education.map((d, i) => (
            <motion.div
              key={d.school}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <Card className="relative h-full gap-4 overflow-hidden p-6">
                <GraduationCap className="absolute -right-6 -bottom-6 size-40 text-signal-1/5" />
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <OrgLogo src={d.logo} name={d.school} className="size-12" />
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">
                        {d.where} · {d.when}
                      </p>
                      <h3 className="mt-1 text-xl font-medium tracking-[-0.02em]">{d.school}</h3>
                      <p className="text-signal-2">{d.degree}</p>
                    </div>
                  </div>
                  {d.gpa && (
                    <div className="rounded-xl border bg-background px-3 py-2 text-center">
                      <div className="text-2xl font-medium">{d.gpa}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">GPA</div>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {d.courses.map((c) => (
                    <Badge key={c} variant="outline" className="font-mono text-[11px]">
                      {c}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">{d.detail}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </Panel>
  )
}
