import { motion } from "motion/react"
import { GraduationCap } from "lucide-react"

import { education } from "@/data/content"
import { OrgLogo } from "@/components/org-logo"
import { Panel } from "@/components/panel"
import { SectionHeading } from "@/components/section-heading"
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
              <motion.span
                className="inline-flex h-[1.1em] items-center rounded-[0.2em] border bg-muted/40 px-[0.14em] align-baseline shadow-sm"
                initial={{ scale: 1 }}
                whileInView={{ scale: [1, 1.12, 1] }}
                viewport={{ once: true, margin: "-100px 0px" }}
                transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
              >
                <GraduationCap aria-hidden strokeWidth={1.5} className="size-[0.8em]" />
              </motion.span>
              {" "}
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
                <p className="text-sm text-muted-foreground">{d.detail}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </Panel>
  )
}
