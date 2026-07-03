<p align="center"><a href="https://pablomanjarres.com/oss/archgraph"><img src=".github/banner.png" alt="Archgraph" width="100%" /></a></p>

<h1 align="center">Archgraph</h1>

<p align="center"><em>AI-managed C4 architecture diagrams for any codebase. An open-source IcePanel alternative.</em></p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white" alt="TypeScript 5.7" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white" alt="Vite 6" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/React_Flow-12-FF0072" alt="React Flow 12" />
  <img src="https://img.shields.io/badge/ELK.js-0.9-1E88E5" alt="ELK.js 0.9" />
</p>

<p align="center">
  <a href="#license"><img src="https://img.shields.io/badge/License-MIT-22C55E.svg" alt="License: MIT" /></a>
  <img src="https://img.shields.io/badge/status-alpha-F59E0B" alt="Status: alpha" />
  <img src="https://img.shields.io/badge/version-0.1.0-3B82F6" alt="Version 0.1.0" />
  <a href="https://pablomanjarres.com/portfolio/projects/archgraph"><img src="https://img.shields.io/badge/Portfolio-write--up-8B5CF6" alt="Portfolio write-up" /></a>
  <a href="https://pablomanjarres.com/oss/archgraph"><img src="https://img.shields.io/badge/Landing-pablo--oss-111111" alt="Landing page" /></a>
</p>

<p align="center">
  <a href="https://archgraph.vercel.app"><img src="https://img.shields.io/badge/%E2%96%B6%20Live%20Demo-archgraph.vercel.app-14B8A6?style=for-the-badge&logo=vercel&logoColor=white" alt="Live demo" /></a>
</p>

<p align="center"><strong>Live demo:</strong> open the viewer and click around at <a href="https://archgraph.vercel.app">archgraph.vercel.app</a>.</p>

---

Archgraph turns a codebase into a C4 architecture model and draws it in an interactive viewer. You run the `/graph` skill inside Claude Code, it reads the repo and writes one `model.json`, and the viewer renders the actors, systems, apps, data stores, and components, plus the connections between them. Auto-layout with ELK, a detail panel for every object, and diagram levels from system context down to containers.

The model is a single plain JSON file (`ArchGraphModel`, version `1.0.0`). Generate it with the skill, write it by hand, or emit it from your own tool. The viewer only needs the file.

## Highlights

- **Generated from source.** The `/graph` skill runs four research agents in parallel (structure and systems, external services and stores, data flows and connections, actors and user flows) and merges their findings into one model.
- **The C4 model, kept simple.** Five object types (actor, system, app, store, component), typed connections (sync, async, event, data), groups, technologies, tags, diagrams, and flows.
- **Interactive viewer.** Pan and zoom on a React Flow canvas, click any node for a detail panel (type, scope, status, groups, technologies, tags, links, docs, and its connections), switch diagram levels from the breadcrumb, and toggle a minimap.
- **Automatic layout.** ELK layered layout positions nodes and nests groups inside their parents. Saved positions win when a diagram already has them, otherwise the graph lays out from scratch and fits to view.
- **Live reload while you edit.** In dev the viewer polls `model.json` every two seconds and repaints when it changes, so a re-run of `/graph` shows up without a refresh.
- **Multi-project.** Drop one model per project under `public/models/<id>/` and they all list on the home page.

## How it works

```
codebase  --[ /graph skill: 4 parallel agents ]-->  .archgraph/model.json  -->  archgraph viewer
```

1. Run `/graph` in Claude Code at the root of any project. It analyzes the repo and writes `.archgraph/model.json`.
2. Serve it. Run `npx archgraph serve /path/to/project` to open the viewer against that model, or copy the model into `public/` and run `pnpm dev`.
3. Explore. Switch diagram levels, click nodes to open the detail panel, read the connections.

The viewer is a small React app. Here is the shape of it:

```
src/
  pages/
    ProjectList.tsx        home page, lists projects from public/projects.json
    ProjectViewer.tsx      canvas shell (top bar, sidebar, canvas, detail panel)
  components/
    Canvas.tsx             React Flow canvas: dot grid, controls, optional minimap
    bars/                  TopBar (breadcrumb + diagram switcher), LeftSidebar, BottomBar
    nodes/                 one renderer per C4 type: actor, system, app, store, component, group
    edges/LabeledEdge.tsx  labeled edges, animated for async and event connections
    panels/                DetailPanel (details + connections tabs), ConnectionsList, TechPill
  lib/
    load-model.ts          fetch and validate a model (version 1.0.0)
    model-to-reactflow.ts  turn a model into React Flow nodes and edges
    layout.ts              ELK layered auto-layout with group nesting
    tech-catalog.ts        known technologies and their brand colors
  hooks/
    useAutoLayout.ts       re-run layout on demand
    useFileWatcher.ts      poll model.json during dev
  store/useGraphStore.ts   Zustand store: model, selection, active diagram
  types/model.ts           the ArchGraphModel contract
```

## Data model

Based on the C4 model:

| Type | C4 level | What it is |
|------|----------|------------|
| `actor` | L1 Context | A person or external entity |
| `system` | L1 Context | A high-level system boundary |
| `app` | L2 Container | A deployable service or client |
| `store` | L2 Container | A data store |
| `component` | L3 Component | A module inside an app |

Plus connections (sync, async, event, data), groups, technologies, tags, diagrams (levels 1 to 3), and flows. The full contract lives in [`src/types/model.ts`](src/types/model.ts).

## Tech stack

- **React 19 + TypeScript 5.7**
- **React Flow 12** (`@xyflow/react`) for the canvas
- **ELK.js 0.9** for auto-layout
- **Zustand 5** for state
- **Tailwind CSS v4**
- **React Router 7** for the project routes
- **Vite 6**, plus a small Node CLI in `bin/`

## Getting started

Prerequisites: Node 20+ and pnpm.

```bash
git clone https://github.com/pablomanjarresneg/archgraph.git
cd archgraph
pnpm install

# run the viewer with the bundled sample model (Nella)
pnpm dev
# open http://localhost:4321
```

### Generate from your own codebase

```bash
# 1) inside your project, in Claude Code:
/graph                    # analyzes the repo, writes .archgraph/model.json

# 2) serve that model in the viewer:
npx archgraph serve /path/to/your/project
# open http://localhost:4321
```

The CLI reads `<project>/.archgraph/model.json` by default. Point it at another file or change the port:

```bash
npx archgraph serve . --model .nella/graph/model.json --port 4321
```

### Add a project to the home page

```bash
mkdir -p public/models/<project-id>
cp /path/to/model.json public/models/<project-id>/model.json
# then add { "id": "<project-id>", "name": "...", "description": "..." } to public/projects.json
```

### Build

```bash
pnpm build      # tsc -b && vite build
pnpm preview    # serve the production build locally
```

## What's inside

Archgraph is one Vite app plus a small CLI. No monorepo, no build steps to learn.

| Path | What it is |
|------|------------|
| [`src/`](src) | The React + Vite viewer (pages, canvas, nodes, panels, store, hooks). |
| [`src/types/model.ts`](src/types/model.ts) | The `ArchGraphModel` contract every `model.json` follows. |
| [`src/lib/layout.ts`](src/lib/layout.ts) | ELK layered auto-layout, with group nesting and a grid fallback. |
| [`src/lib/model-to-reactflow.ts`](src/lib/model-to-reactflow.ts) | Turns a model into typed React Flow nodes and edges. |
| [`bin/archgraph.js`](bin/archgraph.js) | The `archgraph serve` CLI that serves a project's `model.json` into the viewer. |
| [`public/sample-model.json`](public/sample-model.json) | The bundled Nella sample (12 objects, 11 connections, 3 groups). |
| `public/models/<id>/model.json` | One model per project for the multi-project home page. |
| [`public/projects.json`](public/projects.json) | The project index the home page reads. |
| `/graph` skill | The Claude Code skill that analyzes a repo and writes the model. |

## License

MIT.

---

<p align="center">
  <a href="https://pablomanjarres.com/oss/archgraph">Landing</a>
  &nbsp;·&nbsp;
  <a href="https://pablomanjarres.com/portfolio/projects/archgraph">Portfolio write-up</a>
  &nbsp;·&nbsp;
  Built by Pablo Manjarres
</p>
