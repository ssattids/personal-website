import { Bullets, Components, Formula, H2, Section, M, NoteLink } from "@/notes/parts"
import { COS_FORMULA, ExampleGrid, SpaceExplorer, SpaceExplorer3D } from "@/notes/closeness"

export function CosineDistanceNote() {
  return (
    <>
      <Section>
        <H2>Background</H2>
        <Bullets
          items={[
            <>
              Cosine distance is one of two common ways to compare two{" "}
              <NoteLink to="/notes/embeddings">embeddings</NoteLink>; the other is{" "}
              <NoteLink to="/notes/euclidean-distance">Euclidean distance</NoteLink>.
            </>,
            <>
              Cosine similarity is the angle between the two vectors, ignoring their lengths. It runs from{" "}
              <M>{"-1"}</M> (opposite) through <M>{"0"}</M> (unrelated) to <M>{"1"}</M> (same direction). Bigger means
              more similar.
            </>,
            <>
              Cosine distance is <M>{"1 - \\cos"}</M>, so smaller means more similar.
            </>,
          ]}
        />
      </Section>

      <Section>
        <H2>The formula, piece by piece</H2>
        <Formula tex={COS_FORMULA} animate />
        <Components
          items={[
            <>
              <M>{"\\cos"}</M> = the cosine of the angle between the two embeddings
            </>,
            <>
              <M>{"\\mathbf{e}_i, \\mathbf{e}_j"}</M> = the two embeddings being compared
            </>,
            <>
              <M>{"\\mathbf{e}_i \\cdot \\mathbf{e}_j = \\sum_k e_{ik} \\, e_{jk}"}</M> = the dot product
            </>,
            <>
              <M>{"\\|\\mathbf{e}\\|"}</M> = the length of a vector, its distance from the origin
            </>,
          ]}
        />
      </Section>

      <Section>
        <H2>Embedding space, visualized</H2>
        <Bullets
          items={[
            "Only the direction from the origin counts, so the rays below matter, not how far out the points sit.",
            "Kitten is nearer cat by cosine than by distance, because they point almost the same way.",
          ]}
        />
        <SpaceExplorer metric={1} />
      </Section>

      <Section>
        <H2>Example situations visualized</H2>
        <Bullets
          items={[
            "Two vectors pointing the same way have a cosine of 1, however far apart their tips are.",
            "At right angles the cosine is 0, and pointing opposite ways it's −1.",
          ]}
        />
        <ExampleGrid metric={1} />
      </Section>

      <Section>
        <H2>Embedding space in 3D</H2>
        <Bullets
          items={[
            "Real embeddings have hundreds of dimensions. Adding just one more shows why the extra room matters.",
            "Seen straight on, it looks just like the 2D space above. Once the view turns, the third axis gives every point depth.",
          ]}
        />
        <SpaceExplorer3D metric={1} />
      </Section>

      <Section>
        <H2>Takeaways</H2>
        <Bullets
          items={[
            "Cosine similarity is the dot product divided by both lengths: the cosine of the angle between two vectors.",
            "Cosine distance is 1 minus that. Smaller is closer, and only direction counts, not length.",
          ]}
        />
      </Section>
    </>
  )
}
