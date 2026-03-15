# archgraph

AI-managed C4 architecture diagrams — open-source IcePanel alternative.

When the `/graph` skill runs in Claude Code, it analyzes any codebase and auto-generates a full C4 architecture model (actors, systems, apps, stores, connections, groups, technologies), then renders it in an interactive web viewer.

## Quick Start

```bash
# Clone and install
git clone https://github.com/pablomanjarresneg/archgraph.git
cd archgraph
pnpm install

# Run with sample data
pnpm dev
# Open http://localhost:4321
```

## Generate from Your Codebase

1. Copy `.claude/commands/graph.md` to your project's `.claude/commands/`
2. Run `/graph` in Claude Code
3. This generates `.archgraph/model.json`
4. Copy it to `archgraph/public/model.json` and run `pnpm dev`

Or use the CLI:
```bash
npx archgraph serve /path/to/your/project
```

## Data Model

Based on the C4 model:

| Type | C4 Level | Description |
|------|----------|-------------|
| `actor` | L1 Context | Person/external entity |
| `system` | L1 Context | High-level system boundary |
| `app` | L2 Container | Deployable service/client |
| `store` | L2 Container | Data storage |
| `component` | L3 Component | Module within an app |

Plus: connections, groups, technologies, diagrams, and flows.

## Tech Stack

- React 19 + TypeScript
- ReactFlow 12 for the canvas
- ELK.js for auto-layout
- Zustand for state management
- Tailwind CSS v4
- Vite 6

## License

MIT
