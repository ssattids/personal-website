import { education } from "@/data/content"
import { EntryCard } from "@/components/entry-card"
import { PageSection } from "@/components/page-section"

export function EducationPage() {
  return (
    <PageSection title="Education">
      {education.map((entry) => (
        <EntryCard key={entry.title} entry={entry} />
      ))}
    </PageSection>
  )
}
