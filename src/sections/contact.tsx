import { useEffect, useRef, useState } from "react"
import { motion, useInView } from "motion/react"
import { Copy, Mail } from "lucide-react"
import { toast } from "sonner"

import { profile } from "@/data/content"
import { Panel } from "@/components/panel"
import { SectionHeading } from "@/components/section-heading"
import { SlideButton } from "@/components/slide-button"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const SCRIPT: { cmd: string; out: string[] }[] = [
  { cmd: "whoami", out: [`${profile.name.toLowerCase()} · ${profile.role.toLowerCase()}`] },
  {
    cmd: "cat contact.json",
    out: [
      "{",
      `  "email": "${profile.email}",`,
      `  "location": "${profile.location}",`,
      `  "ask_me_about": ["voice agents", "LLM evals", "NLP", "Spark"]`,
      "}",
    ],
  },
]

export async function copyEmail() {
  try {
    await navigator.clipboard.writeText(profile.email)
    toast.success("Email copied", { description: profile.email })
  } catch {
    toast.error("Couldn't copy. Here it is:", { description: profile.email })
  }
}

export function Contact({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-120px" })
  const [shown, setShown] = useState(0)

  const lines = SCRIPT.flatMap(({ cmd, out }) => [{ cmd: true, text: cmd }, ...out.map((text) => ({ cmd: false, text }))])

  useEffect(() => {
    if (!inView || shown >= lines.length) return
    const id = setTimeout(() => setShown((n) => n + 1), lines[shown].cmd ? 450 : 90)
    return () => clearTimeout(id)
  }, [inView, shown, lines])

  return (
    <Panel id="contact" backdrop="beam" className={className}>
      <div className="mx-auto max-w-4xl px-6 py-28">
        <SectionHeading
          index="07"
          eyebrow="contact"
          title={
            <>
              Let's build something <span className="text-muted-foreground">that talks back</span>
            </>
          }
        />

        <Card ref={ref} className="overflow-hidden p-0">
          <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2.5">
            <span className="size-3 rounded-full bg-red-400/80" />
            <span className="size-3 rounded-full bg-yellow-400/80" />
            <span className="size-3 rounded-full bg-green-400/80" />
            <span className="ml-3 font-mono text-xs text-muted-foreground">salar@boston: ~</span>
          </div>
          <div className="min-h-64 p-5 font-mono text-sm">
            {lines.slice(0, shown).map((l, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={l.cmd ? "mt-3 first:mt-0" : "text-muted-foreground whitespace-pre"}
              >
                {l.cmd && <span className="text-signal-3">❯ </span>}
                {l.text}
              </motion.p>
            ))}
            {shown >= lines.length && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 flex flex-wrap gap-3">
                <SlideButton label="Send an email" href={`mailto:${profile.email}`} icon={<Mail />} />
                <Button variant="outline" className="h-auto rounded-lg border-white/20 py-2" onClick={copyEmail}>
                  <Copy /> Copy address
                </Button>
              </motion.div>
            )}
            <p className="mt-4">
              <span className="text-signal-3">❯ </span>
              <span className="inline-block h-4 w-2 translate-y-0.5 bg-foreground/70 [animation:caret-blink_1s_steps(1)_infinite]" />
            </p>
          </div>
        </Card>
      </div>
    </Panel>
  )
}
