import type { ComponentProps, ReactNode } from "react"

import { cn } from "@/lib/utils"

// 5×5 dot matrix drawing a right-pointing arrow
const ARROW = ["00100", "00010", "11111", "00010", "00100"]

// On hover the arrow box slides across, flips, and turns into `icon`
export function SlideButton({
  label,
  icon,
  className,
  ...props
}: { label: string; icon?: ReactNode } & ComponentProps<"a">) {
  return (
    <a
      className={cn(
        "group relative flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-white/20 bg-black py-2 pr-4 pl-11 tracking-tight",
        className,
      )}
      {...props}
    >
      <span className="absolute inset-y-0 left-1 z-40 my-auto flex size-8 items-center justify-center rounded-[5px] bg-[#FA9A63] transition-all duration-400 ease-out group-hover:left-[calc(100%-2.3rem)] group-hover:rotate-180">
        <span className="flex flex-col gap-px group-hover:hidden">
          {ARROW.map((row, i) => (
            <span key={i} className="flex gap-px">
              {[...row].map((on, j) => (
                <span key={j} className={cn("size-0.75 rounded-full", on === "1" ? "bg-white" : "bg-white/25")} />
              ))}
            </span>
          ))}
        </span>
        <span className="hidden rotate-180 text-black group-hover:block [&_svg]:size-4">{icon}</span>
      </span>
      <span className="absolute -inset-px rounded-lg bg-white/20 transition-[clip-path] duration-400 ease-out [clip-path:inset(0_100%_0_0)] group-hover:[clip-path:inset(0_0%_0_0)]" />
      <span className="inline-block text-white transition-transform duration-400 group-hover:-translate-x-8">
        {label}
      </span>
    </a>
  )
}
