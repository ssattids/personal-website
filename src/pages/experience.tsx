import { experience } from "@/data/content"
import { EntryCard } from "@/components/entry-card"
import { PageSection } from "@/components/page-section"

export function ExperiencePage() {
  return (
    <PageSection title="Experience" description="Where I've worked and what I built there.">
      {experience.map((entry) => (
        <EntryCard key={entry.title} entry={entry} />
      ))}
    </PageSection>
  )
}
