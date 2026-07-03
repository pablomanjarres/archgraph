# Archgraph

> Point an AI agent at a repo, get a C4 architecture diagram that's actually true.

![TypeScript](https://img.shields.io/badge/TypeScript_5.7-3178C6?style=flat&logo=typescript&logoColor=white)
![React 19](https://img.shields.io/badge/React_19-61DAFB?style=flat&logo=react&logoColor=black)
![ReactFlow 12](https://img.shields.io/badge/ReactFlow_12-FF0072?style=flat)
![Vite 6](https://img.shields.io/badge/Vite_6-646CFF?style=flat&logo=vite&logoColor=white)
![License: MIT](https://img.shields.io/badge/license-MIT-green?style=flat)
[![Portfolio](https://img.shields.io/badge/portfolio-pablomanjarres.com-c8542a?style=flat)](https://pablomanjarres.com/portfolio/projects/archgraph)

Archgraph generates C4 architecture diagrams from a codebase instead of asking you to draw them. An AI agent reads the repo, writes a structured model of the systems and how they connect, and an interactive web viewer renders it. When the code changes, you regenerate the model. The diagram stays honest.

It's an open-source take on IcePanel, minus the part where a human keeps the picture current by hand.

## Highlights

- **AI-generated model.** The `/graph` Claude Code skill fans out 4 parallel research agents (systems, external services and stores, data flows, actors) and synthesizes one schema-conforming C4 JSON, validating that every connection and diagram references a real object ID.
- **Interactive C4 canvas.** ReactFlow with ELK layered auto-layout, hierarchical group nesting, animated edges for async and event connections, and a selector that switches between Context (L1) and Container (L2) diagrams.
- **Web viewer and CLI.** `archgraph serve /path/to/project` boots a Vite dev server against any project's `.archgraph/model.json`, with `--model` and `--port` flags.
- **Live reload.** In dev the viewer polls the model file every 2s and redraws on change, so regenerating the model updates the diagram on its own.
- **Typed model + detail panel.** Actors, systems, apps, stores, components, connections, groups, technologies, and ordered flows. Click any node for its scope, status, tech, links, and both directions of its connections.
- **Multi-project index.** Drop a model under `public/models/<id>/`, register it in `projects.json`, and it shows up on the project picker at its own `/<id>` route.

## How it works

Two halves: a generator skill and a viewer.

The `/graph` skill is a Claude Code `SKILL.md` (it lives with your Claude Code skills, not in this repo). It runs 4 parallel research agents over a target codebase and writes a `.archgraph/model.json` that conforms to `src/types/model.ts`. The viewer loads that model, maps each C4 object to a typed node, runs ELK for layout, and hands the result to ReactFlow.

```
bin/archgraph.js            # CLI: `archgraph serve` boots a Vite viewer
src/
  types/model.ts            # the C4 schema (objects, connections, groups, flows)
  lib/load-model.ts         # fetch + validate model.json (version-gated)
  lib/model-to-reactflow.ts # C4 model → typed ReactFlow nodes/edges
  lib/layout.ts             # ELK layered layout + group nesting
  store/useGraphStore.ts    # Zustand: model, selection, active diagram
  hooks/useFileWatcher.ts   # 2s dev live-reload
  components/               # Canvas, per-type nodes, detail panel, bars
  pages/                    # project picker + viewer routes
```

## Tech stack

React 19, TypeScript 5.7, ReactFlow (`@xyflow/react` 12), ELK.js for auto-layout, Zustand for state, Tailwind CSS v4, Vite 6, React Router 7, and a small Node CLI.

## Getting started

```bash
git clone https://github.com/pablomanjarresneg/archgraph.git
cd archgraph
pnpm install
pnpm dev        # runs at http://localhost:4321 with the sample model
```

Generate a diagram from your own codebase:

```bash
# 1. Run the /graph skill in Claude Code inside your project.
#    It writes .archgraph/model.json.
# 2. Point the CLI at that project (from this repo):
node bin/archgraph.js serve /path/to/your/project
# custom model path, e.g. a Nella graph:
node bin/archgraph.js serve --model .nella/graph/model.json /path/to/nella
```

No API keys or env vars. Generation happens inside Claude Code; the viewer is a plain Vite app. The package isn't on npm (a different package owns the `archgraph` name there), so run the CLI from the clone, or `npm link` it for a global `archgraph serve`.

## Build

```bash
pnpm build      # tsc -b && vite build
pnpm preview
```

---

MIT licensed. Part of [Pablo Manjarres' portfolio](https://pablomanjarres.com/portfolio/projects/archgraph).