import { useId, type ReactNode } from "react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"
import { GridBackdrop, TopBeam } from "@/components/panel"
import { SlideButton } from "@/components/slide-button"

const fadeUp = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)" },
}

type GlowHeroProps = {
  id?: string
  badge?: { label: string; text: string; href: string }
  title: ReactNode
  description: ReactNode
  cta: { label: string; href: string; icon?: ReactNode }
  // oversized faded word along the bottom edge
  watermark?: string
  className?: string
}

export function GlowHero({ id, badge, title, description, cta, watermark, className }: GlowHeroProps) {
  return (
    <section id={id} className={cn("h-[60vh] w-full bg-white p-2 md:h-screen", className)}>
      <div className="dark relative isolate h-full w-full overflow-hidden rounded-3xl bg-background text-neutral-100">
        <Backdrop />

        <motion.div
          className="relative z-10 mx-auto flex h-full w-full max-w-6xl flex-col justify-between px-4 sm:px-6 lg:px-8"
          initial="hidden"
          animate="show"
          transition={{ staggerChildren: 0.12, delayChildren: 0.1 }}
        >
          <div className="pt-32 md:pt-42 lg:pt-60">
            {badge && (
              <motion.a
                variants={fadeUp}
                href={badge.href}
                className="flex w-fit items-center gap-1 rounded-full bg-neutral-900 p-1 shadow-lg shadow-black sm:gap-2"
              >
                <span className="rounded-full bg-neutral-950 px-2 py-1 text-[10px] sm:text-xs">{badge.label}</span>
                <span className="pr-2 text-[10px] sm:text-xs">{badge.text}</span>
              </motion.a>
            )}

            <div className="mt-6 flex flex-col items-start gap-6 md:mt-10 lg:flex-row lg:gap-10">
              <motion.h1
                variants={fadeUp}
                className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl md:text-5xl lg:text-7xl"
              >
                {title}
              </motion.h1>
              <motion.div variants={fadeUp} className="lg:max-w-md">
                <p className="text-sm font-medium text-balance text-neutral-300 sm:text-base lg:text-lg">
                  {description}
                </p>
                <SlideButton label={cta.label} href={cta.href} icon={cta.icon} className="mt-6 md:mt-8" />
              </motion.div>
            </div>
          </div>

          {watermark && (
            <div className="relative h-18 sm:h-48 md:h-72" aria-hidden>
              <p className="absolute -top-10 left-1/2 -translate-x-1/2 bg-linear-to-r from-white/10 to-white/0 bg-clip-text text-center text-[100px] font-semibold tracking-tight text-transparent sm:text-[6rem] md:-top-6 md:mt-10 md:text-[160px] lg:-top-18 lg:text-[300px]">
                {watermark}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}

function Backdrop() {
  // ids must be unique per instance since SVG gradients are document-global
  const uid = useId().replace(/:/g, "")
  const arc = (n: number) => `${uid}-arc${n}`

  // [stroke color, y1, y2] per arc gradient
  const arcs: [string, number, number][] = [
    ["#FA9A63", 108.5, 313.5],
    ["#FA9A63", 108.5, 582],
    ["#FA9A63", 253, 392],
    ["#FA9A63", 243, 468.5],
    ["#FA9A63", 243, 328.5],
    ["#CDA63C", 243, 334],
    ["#CDA63C", 243, 361],
    ["#CDA63C", 200, 336.5],
    ["white", 200, 780.5],
  ]
  const ring = "M975.5 255C1402.88 255 1749 569.029 1749 956C1749 1342.97 1402.88 1657 975.5 1657C548.119 1657 202 1342.97 202 956C202 569.029 548.119 255 975.5 255Z"
  const halo = (top: number) =>
    `M975.5 ${top}C1398.3 ${top} 1739 ${top + 310.452} 1739 ${top + 691}C1739 ${top + 1071.55} 1398.3 ${top + 1382} 975.5 ${top + 1382}C552.695 ${top + 1382} 212 ${top + 1071.55} 212 ${top + 691}C212 ${top + 310.452} 552.695 ${top} 975.5 ${top}Z`
  const blurs: [number, number, number][] = [
    // [gradient, blur px, halo top]
    [3, 30, 255],
    [4, 30, 255],
    [5, 40, 255],
    [6, 50, 255],
    [7, 50, 212],
    [8, 100, 212],
  ]

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <GridBackdrop />

      {/* glowing horizon ring */}
      <div className="absolute -bottom-75 left-1/2 flex h-full w-full -translate-x-1/2 justify-center">
        <svg width="1951" height="1806" viewBox="0 0 1951 1806" fill="none" overflow="visible" className="shrink-0">
          <path d={ring} stroke={`url(#${arc(0)})`} strokeWidth="4" />
          <path
            opacity="0.4"
            d="M975.5 253.5C1403.57 253.5 1750.5 568.065 1750.5 956C1750.5 1343.93 1403.57 1658.5 975.5 1658.5C547.432 1658.5 200.5 1343.93 200.5 956C200.5 568.065 547.432 253.5 975.5 253.5Z"
            stroke={`url(#${arc(1)})`}
          />
          <g style={{ filter: "blur(12px)", mixBlendMode: "plus-lighter" }}>
            <path d={ring} stroke={`url(#${arc(2)})`} strokeWidth="4" />
          </g>
          {blurs.map(([n, blur, top]) => (
            <g key={n} opacity="0.4" style={{ filter: `blur(${blur}px)`, mixBlendMode: "plus-lighter" }}>
              <path d={halo(top)} stroke={`url(#${arc(n)})`} strokeWidth="24" />
            </g>
          ))}
          <defs>
            {arcs.map(([color, y1, y2], n) => (
              <linearGradient key={n} id={arc(n)} x1="975.5" y1={y1} x2="976" y2={y2} gradientUnits="userSpaceOnUse">
                <stop stopColor={color} />
                <stop offset="1" stopColor={color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>
        </svg>
      </div>

      {/* stars */}
      <div className="absolute -bottom-10 left-1/2 flex h-full w-full -translate-x-1/2 justify-center">
        <svg width="822" height="158" viewBox="0 0 822 158" fill="none" className="shrink-0">
          {STARS.map(([cx, cy, r, opacity], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="white" opacity={opacity} />
          ))}
        </svg>
      </div>

      <TopBeam className="z-5" />
    </div>
  )
}

// [cx, cy, r, opacity]
const STARS: [number, number, number, number][] = [
  [1, 12, 1, 0.72], [122, 113, 1, 0.95], [108, 57, 1, 0.59], [510, 96, 1, 0.86],
  [700, 93, 1, 0.83], [625, 126, 1, 0.2], [821, 32, 1, 0.49], [203.5, 157.5, 0.5, 0.89],
  [167.5, 94.5, 0.5, 0.79], [76.5, 81.5, 0.5, 0.77], [157.5, 8.5, 0.5, 0.99], [240.5, 80.5, 0.5, 0.64],
  [256.5, 64.5, 0.5, 0.55], [273.5, 84.5, 0.5, 0.44], [285.5, 57.5, 0.5, 1], [227.5, 114.5, 0.5, 0.83],
  [202.5, 55.5, 0.5, 0.63], [156.5, 65.5, 0.5, 0.48], [330.5, 88.5, 0.5, 0.75], [363.5, 102.5, 0.5, 0.66],
  [476.5, 80.5, 0.5, 1], [438.5, 107.5, 0.5, 0.99], [422.5, 77.5, 0.5, 0.27], [455.5, 56.5, 0.5, 0.99],
  [488.5, 35.5, 0.5, 0.21], [313.5, 66.5, 0.5, 1], [231.5, 0.5, 0.5, 0.41], [270.5, 108.5, 0.5, 0.28],
  [573, 103, 0.5, 0.85], [501.5, 150.5, 0.5, 0.99], [456.5, 156.5, 0.5, 0.71], [659.5, 77.5, 0.5, 0.46],
  [746, 52, 0.5, 0.57], [591.5, 1.5, 0.5, 0.91], [389, 123, 1, 0.24], [40, 72, 1, 1],
]
