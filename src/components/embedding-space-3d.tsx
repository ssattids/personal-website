import { useLayoutEffect, useMemo, useRef, useState } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Line, OrbitControls } from "@react-three/drei"
import { Color, SRGBColorSpace, Vector3, type Group } from "three"

import { useTheme } from "@/components/theme-provider"

export type SpacePoint = {
  label: string
  pos: [number, number, number]
  // any CSS colour, including var(--…) and oklch(); it's resolved to RGB for three.js
  color: string
  // dimmed points stay visible for context
  dim?: boolean
  selected?: boolean
}

const R = 7.5 // camera distance from the origin
const INTRO_MS = 1100
// the intro swings the camera from straight-on, where the space looks 2D, to this three-quarter view
const END_AZIMUTH = 0.75
const END_ELEVATION = 0.38
const AXIS = 3.2

// Draws labelled points in 3D with an orbit camera. When `play` turns on, the points fly out from the origin while the
// camera swings round, then everything holds still until the reader drags.
export default function EmbeddingSpace3D({
  points,
  links,
  play,
  onPick,
}: {
  points: SpacePoint[]
  // index pairs to join with a dashed line, e.g. a query and its neighbours
  links: [number, number][]
  play: boolean
  onPick: (i: number) => void
}) {
  const { theme } = useTheme()
  const [done, setDone] = useState(false)
  const labels = useRef<(HTMLSpanElement | null)[]>([])

  return (
    <div className="relative overflow-hidden">
      <Canvas
        frameloop="demand"
        camera={{ position: [0, 0, R], fov: 40 }}
        dpr={[1, 2]}
        className="aspect-[7/5] w-full touch-none sm:aspect-[7/4]"
      >
        <Scene
          points={points}
          links={links}
          play={play}
          done={done}
          onDone={() => setDone(true)}
          onPick={onPick}
          theme={theme}
          labels={labels}
        />
        <OrbitControls enabled={done} enablePan={false} enableZoom={false} rotateSpeed={0.6} />
      </Canvas>
      {/* plain DOM labels over the canvas, moved by Scene every frame, so they stay crisp and pick up the theme */}
      {points.map((p, i) => (
        <span
          key={p.label}
          ref={(el) => {
            labels.current[i] = el
          }}
          className={`pointer-events-none absolute top-0 left-0 font-mono text-xs whitespace-nowrap select-none ${
            p.dim ? "text-muted-foreground/60" : "text-foreground"
          } ${play ? "" : "opacity-0"}`}
        >
          {p.label}
        </span>
      ))}
    </div>
  )
}

function Scene({
  points,
  links,
  play,
  done,
  onDone,
  onPick,
  theme,
  labels,
}: {
  points: SpacePoint[]
  links: [number, number][]
  play: boolean
  done: boolean
  onDone: () => void
  onPick: (i: number) => void
  theme: string
  labels: React.RefObject<(HTMLSpanElement | null)[]>
}) {
  const { camera, invalidate, size } = useThree()
  const group = useRef<Group>(null)
  const start = useRef<number | null>(null)
  const [screen] = useState(() => new Vector3())
  // re-resolve when the theme flips, since the CSS colours change with it
  const colors = useMemo(() => points.map((p) => toThree(p.color)), [points, theme])
  const ink = useMemo(() => toThree("var(--muted-foreground)"), [theme])

  useLayoutEffect(() => {
    if (play) invalidate()
  }, [play, invalidate])

  useFrame(({ clock }) => {
    if (play && !done) {
      start.current ??= clock.elapsedTime
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches
      const t = reduce ? 1 : Math.min((clock.elapsedTime - start.current) / (INTRO_MS / 1000), 1)
      const e = 1 - (1 - t) ** 3

      group.current?.children.forEach((child, i) => {
        const [x, y, z] = points[i].pos
        child.position.set(x * e, y * e, z * e)
      })
      const az = END_AZIMUTH * e
      const el = END_ELEVATION * e
      camera.position.set(R * Math.cos(el) * Math.sin(az), R * Math.sin(el), R * Math.cos(el) * Math.cos(az))
      camera.lookAt(0, 0, 0)

      if (t < 1) invalidate()
      else onDone()
    }

    // pin each label just above and right of its point on screen
    group.current?.children.forEach((child, i) => {
      const label = labels.current[i]
      if (!label) return
      const v = child.getWorldPosition(screen).project(camera)
      const x = ((v.x + 1) / 2) * size.width
      const y = ((1 - v.y) / 2) * size.height
      label.style.transform = `translate(${x + 8}px, ${y - 20}px)`
    })
  })

  return (
    <>
      {/* three faint axes through the origin */}
      {[
        [AXIS, 0, 0],
        [0, AXIS, 0],
        [0, 0, AXIS],
      ].map((a, i) => (
        <Line
          key={i}
          points={[a.map((v) => -v) as [number, number, number], a as [number, number, number]]}
          color={ink}
          transparent
          opacity={0.35}
          lineWidth={1}
        />
      ))}

      {done &&
        links.map(([a, b]) => (
          <Line
            key={`${a}-${b}`}
            points={[points[a].pos, points[b].pos]}
            color={colors[a]}
            transparent
            opacity={0.7}
            lineWidth={1.5}
            dashed
            dashSize={0.12}
            gapSize={0.1}
          />
        ))}

      <group ref={group} visible={play}>
        {points.map((p, i) => (
          <mesh
            key={p.label}
            // start at the origin so nothing flashes at its final spot before the intro plays
            position={done ? p.pos : [0, 0, 0]}
            onClick={(e) => {
              e.stopPropagation()
              onPick(i)
            }}
            onPointerOver={() => (document.body.style.cursor = "pointer")}
            onPointerOut={() => (document.body.style.cursor = "")}
          >
            <sphereGeometry args={[p.selected ? 0.13 : 0.09, 24, 16]} />
            <meshBasicMaterial color={colors[i]} transparent opacity={p.dim ? 0.35 : 1} />
          </mesh>
        ))}
      </group>
    </>
  )
}

// three.js only parses rgb/hsl/hex, so let the browser resolve the CSS colour by painting a pixel and reading it back
function toThree(css: string) {
  const probe = document.createElement("span")
  probe.style.color = css
  document.body.appendChild(probe)
  const resolved = getComputedStyle(probe).color
  probe.remove()
  const ctx = document.createElement("canvas").getContext("2d")!
  ctx.fillStyle = resolved
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  return new Color().setRGB(r / 255, g / 255, b / 255, SRGBColorSpace)
}
