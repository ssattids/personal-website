import type { Entry } from "@/data/content"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function EntryCard({ entry }: { entry: Entry }) {
  return (
    <Card className="overflow-hidden pt-0">
      {entry.image && (
        <div className="h-40 bg-white">
          <img
            src={entry.image}
            alt={entry.title}
            className="size-full object-contain p-4"
            loading="lazy"
          />
        </div>
      )}
      <CardHeader className={entry.image ? undefined : "pt-6"}>
        <CardTitle className="text-xl">{entry.title}</CardTitle>
        {entry.subtitle && <CardDescription>{entry.subtitle}</CardDescription>}
      </CardHeader>
      {entry.points.length > 0 && (
        <CardContent>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            {entry.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </CardContent>
      )}
      {entry.tags && (
        <CardFooter className="flex flex-wrap gap-2">
          {entry.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </CardFooter>
      )}
    </Card>
  )
}
