import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"

import { profile } from "@/data/content"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

export function HomePage() {
  const initials = profile.name
    .split(" ")
    .map((part) => part[0])
    .join("")

  return (
    <section className="mx-auto flex min-h-[calc(100svh-3.5rem)] max-w-4xl flex-col items-center justify-center gap-6 px-4 text-center">
      <Avatar className="size-40">
        <AvatarFallback className="text-4xl">{initials}</AvatarFallback>
      </Avatar>
      <div className="space-y-2">
        <h1 className="text-5xl font-bold tracking-tight">{profile.name}</h1>
        <p className="text-xl text-muted-foreground">{profile.role}</p>
      </div>
      <p className="max-w-md text-muted-foreground">{profile.tagline}</p>
      <div className="flex gap-3">
        <Button asChild>
          <Link to="/experience">
            View experience <ArrowRight />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/projects">Projects</Link>
        </Button>
      </div>
    </section>
  )
}
