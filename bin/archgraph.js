#!/usr/bin/env node

import { createServer } from "vite";
import { fileURLToPath } from "url";
import { dirname, resolve, join } from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = resolve(__dirname, "..");

const args = process.argv.slice(2);
const command = args[0] ?? "serve";

if (command === "serve") {
  // Parse --model flag for custom model path
  let customModel = null;
  let positionalDir = null;
  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--model" && i + 1 < args.length) {
      customModel = args[++i];
    } else if (args[i].startsWith("--model=")) {
      customModel = args[i].slice("--model=".length);
    } else if (!args[i].startsWith("--")) {
      positionalDir = args[i];
    }
  }

  const modelDir = resolve(positionalDir ?? process.cwd());
  const modelPath = customModel
    ? resolve(modelDir, customModel)
    : join(modelDir, ".archgraph", "model.json");

  if (!fs.existsSync(modelPath)) {
    console.error(`No model found at ${modelPath}`);
    console.error(
      'Run the /graph skill in Claude Code to generate one, or create .archgraph/model.json manually.',
    );
    console.error(
      'For nella graphs: archgraph serve --model .nella/graph/model.json',
    );
    process.exit(1);
  }

  console.log(`Serving archgraph viewer for: ${modelPath}`);

  const server = await createServer({
    root: packageRoot,
    server: {
      port: 4321,
      open: true,
    },
    plugins: [
      {
        name: "archgraph-model-server",
        configureServer(server) {
          server.middlewares.use("/model.json", (_req, res) => {
            try {
              const content = fs.readFileSync(modelPath, "utf-8");
              res.setHeader("Content-Type", "application/json");
              res.end(content);
            } catch (err) {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: "Model not found" }));
            }
          });
        },
      },
    ],
  });

  await server.listen();
  server.printUrls();
} else {
  console.error(`Unknown command: ${command}`);
  console.error("Usage: archgraph serve [path-to-project]");
  process.exit(1);
}
