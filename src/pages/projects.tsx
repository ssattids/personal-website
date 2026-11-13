import { projects } from "@/data/content"
import { EntryCard } from "@/components/entry-card"
import { PageSection } from "@/components/page-section"

export function ProjectsPage() {
  return (
    <PageSection title="Projects" description="Things I've built and researched.">
      {projects.map((entry) => (
        <EntryCard key={entry.title} entry={entry} />
      ))}
    </PageSection>
  )
}
