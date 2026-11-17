import { motion } from "motion/react"
import { ArrowUpRight, PenLine } from "lucide-react"
import { Link } from "react-router"

import { posts, type Post } from "@/data/content"
import { cn } from "@/lib/utils"
import { Panel } from "@/components/panel"
import { SectionHeading } from "@/components/section-heading"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

export function Blog({ className }: { className?: string }) {
  const published = posts.filter((p) => p.url).length

  return (
    <Panel id="blog" className={className}>
      <div className="mx-auto max-w-5xl px-6 py-28">
        <SectionHeading
          index="06"
          eyebrow="blog"
          title={
            <>
              Notes from the <span className="text-muted-foreground">inference loop</span>
            </>
          }
        >
          Writing about agents, evals, and data at scale. Some of it is still in the oven.
        </SectionHeading>

        <Card className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5 font-mono text-xs text-muted-foreground">
            <span>
              <span className="text-signal-3">$</span> ls -lt ~/blog/posts
            </span>
            <span>
              {published} published · {posts.length - published} drafting
            </span>
          </div>
          <ul className="divide-y">
            {posts.map((post, i) => (
              <PostRow key={post.slug} post={post} index={i} />
            ))}
          </ul>
        </Card>
      </div>
    </Panel>
  )
}

function PostRow({ post, index }: { post: Post; index: number }) {
  const live = Boolean(post.url)
  const internal = post.url?.startsWith("/")
  const Row = internal ? Link : live ? "a" : "div"
  const linkProps = internal
    ? { to: post.url! }
    : live
      ? { href: post.url, target: "_blank", rel: "noreferrer" }
      : {}

  return (
    <motion.li
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: index * 0.08 }}
    >
      <Row
        {...(linkProps as { to: string })}
        className={cn(
          "group grid gap-2 px-5 py-5 sm:grid-cols-[8rem_1fr_auto] sm:items-start sm:gap-6",
          live && "transition-colors hover:bg-accent/50",
        )}
      >
        <div className="font-mono text-xs text-muted-foreground sm:pt-1">
          {live ? (
            <>
              <p className="text-foreground">{post.date}</p>
              <p>{post.readingTime}</p>
            </>
          ) : (
            <p className="flex items-center gap-1.5 text-signal-3">
              <PenLine className="size-3" />
              drafting
            </p>
          )}
        </div>
        <div className="min-w-0">
          <h3 className={cn("text-lg leading-tight font-medium tracking-[-0.02em]", !live && "text-foreground/80")}>
            {post.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{post.summary}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.tags.map((t) => (
              <Badge key={t} variant="secondary" className="font-mono text-[11px]">
                {t}
              </Badge>
            ))}
          </div>
        </div>
        {live && (
          <ArrowUpRight className="hidden size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground sm:block" />
        )}
      </Row>
    </motion.li>
  )
}
