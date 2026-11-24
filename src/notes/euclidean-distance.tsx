import { Bullets, Components, Formula, H2, Section, M, NoteLink } from "@/notes/parts"
import { DIST_FORMULA, ExampleGrid, SpaceExplorer, SpaceExplorer3D } from "@/notes/closeness"

export function EuclideanDistanceNote() {
  return (
    <>
      <Section>
        <H2>Background</H2>
        <Bullets
          items={[
            <>
              Euclidean distance is one of two common ways to compare two{" "}
              <NoteLink to="/notes/embeddings">embeddings</NoteLink>; the other is{" "}
              <NoteLink to="/notes/cosine-distance">cosine distance</NoteLink>.
            </>,
            "It's how far apart the two points are, in a straight line. Smaller means more similar, and 0 means they're the same point.",
          ]}
        />
      </Section>

      <Section>
        <H2>The formula, piece by piece</H2>
        <Bullets
          items={[
            <>
              Here it's written squared; <M>{"d"}</M> is the square root of the sum.
            </>,
          ]}
        />
        <Formula tex={DIST_FORMULA} animate />
        <Components
          items={[
            <>
              <M>{"d"}</M> = the Euclidean distance between the two embeddings
            </>,
            <>
              <M>{"\\mathbf{e}_i, \\mathbf{e}_j"}</M> = the two embeddings being compared
            </>,
            <>
              <M>{"k"}</M> = index of the current dimension, from <M>{"1"}</M> to <M>{"n"}</M>
            </>,
            <>
              <M>{"e_{ik}"}</M> = the <M>{"k"}</M>-th number in <M>{"\\mathbf{e}_i"}</M>
            </>,
          ]}
        />
      </Section>

      <Section>
        <H2>Embedding space, visualized</H2>
        <Bullets
          items={[
            "Similar things cluster, animals with animals and vehicles with vehicles.",
            "So the most similar items are the nearest neighbours: the points with the smallest distance.",
          ]}
        />
        <SpaceExplorer metric={0} />
      </Section>

      <Section>
        <H2>Example situations visualized</H2>
        <Bullets
          items={[
            "Distance cares about length as well as direction.",
            "A vector pointing the same way but shorter is still some distance away.",
          ]}
        />
        <ExampleGrid metric={0} />
      </Section>

      <Section>
        <H2>Embedding space in 3D</H2>
        <Bullets
          items={[
            "Real embeddings have hundreds of dimensions. Adding just one more shows why the extra room matters.",
            "Seen straight on, it looks just like the 2D space above. Once the view turns, the third axis gives every point depth.",
            "Every extra dimension is another direction in which unrelated things can be far apart.",
          ]}
        />
        <SpaceExplorer3D metric={0} />
      </Section>

      <Section>
        <H2>Takeaways</H2>
        <Bullets
          items={[
            "Euclidean distance is the straight-line distance between two points: the square root of the summed squared gaps.",
            "Smaller is closer, and it depends on both direction and length.",
          ]}
        />
      </Section>
    </>
  )
}
