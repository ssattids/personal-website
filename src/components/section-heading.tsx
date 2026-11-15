import type { ReactNode } from "react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"

export function SectionHeading({
  index,
  eyebrow,
  title,
  align = "left",
  children,
}: {
  index: string
  eyebrow: string
  title: ReactNode
  align?: "left" | "center"
  children?: ReactNode
}) {
  return (
    <motion.div
      className={cn(
        "mb-12 flex flex-col gap-6",
        align === "center"
          ? "items-center text-center"
          : "items-start lg:flex-row lg:items-end lg:justify-between lg:gap-10",
      )}
      initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="max-w-2xl">
        <p
          className={cn(
            "flex w-fit items-center gap-1 rounded-full bg-neutral-900 p-1 shadow-lg shadow-black sm:gap-2",
            align === "center" && "mx-auto",
          )}
        >
          <span className="rounded-full bg-neutral-950 px-2 py-1 font-mono text-[10px] text-signal-1 sm:text-xs">
            {index}
          </span>
          <span className="pr-2 text-[10px] text-neutral-300 capitalize sm:text-xs">{eyebrow}</span>
        </p>
        <h2 className="mt-6 text-3xl font-semibold tracking-tight text-balance sm:text-4xl md:text-5xl">{title}</h2>
      </div>
      {children && (
        <p className="text-sm font-medium text-balance text-neutral-400 sm:text-base lg:max-w-md lg:text-lg">
          {children}
        </p>
      )}
    </motion.div>
  )
}
