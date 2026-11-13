import type { ReactNode } from "react"

import { Separator } from "@/components/ui/separator"

export function PageSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      {description && (
        <p className="mt-2 text-muted-foreground">{description}</p>
      )}
      <Separator className="my-6" />
      <div className="grid gap-6">{children}</div>
    </section>
  )
}
