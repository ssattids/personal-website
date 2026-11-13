import { posts } from "@/data/content"
import { PageSection } from "@/components/page-section"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function BlogPage() {
  return (
    <PageSection title="Blog" description="Notes on data, ML, and engineering.">
      {posts.length === 0 ? (
        <p className="text-muted-foreground">No posts yet — check back soon.</p>
      ) : (
        posts.map((post) => (
          <Card key={post.title}>
            <CardHeader>
              <CardTitle>{post.title}</CardTitle>
              <CardDescription>
                {post.date} · {post.summary}
              </CardDescription>
            </CardHeader>
          </Card>
        ))
      )}
    </PageSection>
  )
}
