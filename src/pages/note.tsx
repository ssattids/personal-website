import { useEffect } from "react"
import { motion } from "motion/react"
import { ArrowLeft } from "lucide-react"
import { Link, Navigate, useParams } from "react-router"

import { posts } from "@/data/content"
import { notes } from "@/notes"
import { Panel } from "@/components/panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function NotePage() {
  const { slug = "" } = useParams()
  const post = posts.find((p) => p.slug === slug)
  const Body = notes[slug]

  useEffect(() => {
    if (!post) return
    document.title = `${post.title} · Salar Satti`
    window.scrollTo({ top: 0, behavior: "instant" })
  }, [post])

  if (!post || !Body) return <Navigate to="/blog" replace />

  return (
    <main>
      <Panel backdrop="beam" className="min-h-svh">
        <article className="mx-auto max-w-[52rem] px-6 pt-32 pb-28">
          <Button variant="ghost" size="sm" className="-ml-3 rounded-full text-muted-foreground" asChild>
            <Link to="/blog">
              <ArrowLeft /> All notes
            </Link>
          </Button>

          <motion.header
            className="mt-10"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
              {post.date} · {post.readingTime}
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-6xl">{post.title}</h1>
            <div className="mt-6 flex flex-wrap gap-1.5">
              {post.tags.map((t) => (
                <Badge key={t} variant="secondary" className="font-mono text-[11px]" asChild>
                  <Link to={`/blog?tag=${encodeURIComponent(t)}`}>{t}</Link>
                </Badge>
              ))}
            </div>
          </motion.header>

          <div className="mt-12">
            <Body />
          </div>
        </article>
      </Panel>
    </main>
  )
}
