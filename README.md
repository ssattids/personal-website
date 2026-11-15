# personal-website
A personal website built for experience and research

Built with React, Vite, Tailwind CSS, [shadcn/ui](https://ui.shadcn.com), and [Motion](https://motion.dev). Frontend only — all content lives in `src/data/content.ts`.

## Pages

- **About** (`/`) — everything below, plus education
- **Blog** (`/blog`) — posts, published and drafting
- **Contact** (`/contact`) — a terminal that types out how to reach me

## What's on About

- **Hero** — a live agent-graph canvas (nodes, edges, signal pulses that follow your cursor)
- **Experience** — scroll-linked timeline; each role's "Learn more" opens its own page at `/experience/:id`
- **Origin story** — the career as a training run with a decreasing loss curve
- **Skills** — an interactive 2D "embedding space" with nearest-neighbor search
- **Projects** — tilt cards with generative mini-visuals
- **Easter eggs** — `⌘K` command palette, and the Konami code (↑↑↓↓←→←→BA)

## Development

```sh
npm install
npm run dev      # start the dev server
npm run build    # type-check and build to dist/
```

Add more shadcn components with `npx shadcn@latest add <component>`.

## Deploying

Pages use client-side routes (`/blog`, `/contact`, `/experience/:id`), so the host must serve
`index.html` for unknown paths (an SPA fallback / rewrite rule).
