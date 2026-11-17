import katex from "katex"
import "katex/dist/katex.min.css"

import { cn } from "@/lib/utils"

// Renders a LaTeX string with KaTeX. `display` gives full-size operators like Σ on their own line.
export function Tex({ children, display = false, className }: { children: string; display?: boolean; className?: string }) {
  const html = katex.renderToString(children, {
    displayMode: display,
    throwOnError: false,
    output: "html",
    // only our own strings are rendered, and \htmlStyle is how they pick up theme colors
    trust: (ctx) => ctx.command === "\\htmlStyle",
  })
  return <span className={cn(display && "block overflow-x-auto overflow-y-hidden", className)} dangerouslySetInnerHTML={{ __html: html }} />
}
